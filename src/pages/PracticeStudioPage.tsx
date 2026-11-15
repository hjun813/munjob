import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Video,
  Mic,
  Monitor,
  Pause,
  Square,
  Shuffle,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/database';
import type {
  AnswerRecording,
  InterviewSession,
  QuestionSnapshot,
} from '@/types/interview';
import { QuickQuestionModal } from '@/components/questions/QuickQuestionModal';
import { formatDuration, getSupportedMimeType } from '@/lib/utils';

type RecordStage = 'idle' | 'prep' | 'recording' | 'paused' | 'saving' | 'saved';

export function PracticeStudioPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryQuestionId = searchParams.get('questionId');
  const queryCategoryId = searchParams.get('categoryId');

  const data = useLiveQuery(async () => {
    const [categories, questions, recordings] = await Promise.all([
      db.categories.orderBy('createdAt').toArray(),
      db.questions.orderBy('createdAt').toArray(),
      db.recordings.toArray(),
    ]);

    const recordingsByQuestion = new Map<string, AnswerRecording[]>();
    for (const r of recordings) {
      const list = recordingsByQuestion.get(r.questionId) || [];
      list.push(r);
      recordingsByQuestion.set(r.questionId, list);
    }

    return { categories, questions, recordingsByQuestion };
  }, []);

  const categories = data?.categories || [];
  const allQuestions = data?.questions || [];
  const recordingsByQuestion =
    data?.recordingsByQuestion || new Map<string, AnswerRecording[]>();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    queryCategoryId || 'all'
  );
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const [isRandomOrder, setIsRandomOrder] = useState(false);
  const [shuffledIds, setShuffledIds] = useState<string[]>([]);
  const [answerLimitSeconds, setAnswerLimitSeconds] = useState<number>(0);

  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    queryQuestionId || ''
  );

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [captureSource, setCaptureSource] = useState<'camera' | 'screen'>(
    'camera'
  );
  const [mirrorVideo, setMirrorVideo] = useState<boolean>(true);
  const [deviceError, setDeviceError] = useState<string>('');
  const [isStreamReady, setIsStreamReady] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);

  const [stage, setStage] = useState<RecordStage>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef<number>(0);
  const stageRef = useRef<RecordStage>('idle');
  const stopResolveRef = useRef<(() => void) | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const updateStage = (next: RecordStage) => {
    stageRef.current = next;
    setStage(next);
  };

  const filteredQuestions = useMemo(() => {
    const base =
      selectedCategoryId === 'all'
        ? allQuestions
        : allQuestions.filter((q) => q.categoryId === selectedCategoryId);

    if (!isRandomOrder || shuffledIds.length === 0) {
      return base;
    }
    const orderMap = new Map(shuffledIds.map((id, i) => [id, i]));
    return base
      .slice()
      .sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  }, [allQuestions, selectedCategoryId, isRandomOrder, shuffledIds]);

  useEffect(() => {
    if (filteredQuestions.length === 0) {
      setActiveQuestionId('');
      return;
    }
    if (
      queryQuestionId &&
      filteredQuestions.some((q) => q.id === queryQuestionId)
    ) {
      setActiveQuestionId(queryQuestionId);
      return;
    }
    if (!filteredQuestions.some((q) => q.id === activeQuestionId)) {
      const sampleOffset = filteredQuestions.find(
        (q) => q.id === 'q-sample-3'
      );
      setActiveQuestionId(sampleOffset ? sampleOffset.id : filteredQuestions[0].id);
    }
  }, [filteredQuestions, activeQuestionId, queryQuestionId]);

  const currentIndex = useMemo(() => {
    const idx = filteredQuestions.findIndex((q) => q.id === activeQuestionId);
    return idx >= 0 ? idx : 0;
  }, [filteredQuestions, activeQuestionId]);

  const activeQuestion = filteredQuestions[currentIndex] || null;

  const activeCategoryName = useMemo(() => {
    if (selectedCategoryId !== 'all') {
      return (
        categories.find((c) => c.id === selectedCategoryId)?.name ||
        '백엔드 기술 면접'
      );
    }
    if (activeQuestion) {
      return (
        categories.find((c) => c.id === activeQuestion.categoryId)?.name ||
        '백엔드 기술 면접'
      );
    }
    return '전체 면접 질문';
  }, [categories, selectedCategoryId, activeQuestion]);

  const stopMediaResources = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.onended = null;
        t.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreamReady(false);
    setMicActive(false);
  }, []);

  const initMediaStream = useCallback(
    async (
      videoId?: string,
      audioId?: string,
      sourceMode: 'camera' | 'screen' = 'camera'
    ) => {
      setDeviceError('');
      stopMediaResources();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setDeviceError(
          '브라우저에서 카메라/마이크 API를 지원하지 않습니다. Chrome 데스크톱 브라우저를 사용해 주세요.'
        );
        return;
      }

      try {
        let finalStream: MediaStream;

        if (sourceMode === 'screen' && navigator.mediaDevices.getDisplayMedia) {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({
              audio: audioId ? { deviceId: { exact: audioId } } : true,
              video: false,
            });
            micStream
              .getAudioTracks()
              .forEach((track) => displayStream.addTrack(track));
          } catch {
            // continue with displayStream
          }
          finalStream = displayStream;
        } else {
          const constraints: MediaStreamConstraints = {
            video: videoId
              ? {
                  deviceId: { exact: videoId },
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                }
              : { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: audioId ? { deviceId: { exact: audioId } } : true,
          };
          finalStream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        streamRef.current = finalStream;
        setIsStreamReady(true);

        if (videoRef.current) {
          videoRef.current.srcObject = finalStream;
        }

        finalStream.getTracks().forEach((track) => {
          track.onended = () => {
            if (
              recorderRef.current &&
              recorderRef.current.state !== 'inactive'
            ) {
              try {
                recorderRef.current.stop();
              } catch {
                // ignore
              }
            }
            if (sourceMode === 'screen' && track.kind === 'video') {
              setCaptureSource('camera');
            }
          };
        });

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx && finalStream.getAudioTracks().length > 0) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(finalStream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          const dataArr = new Uint8Array(analyser.frequencyBinCount);
          const checkAudio = () => {
            analyser.getByteFrequencyData(dataArr);
            let sum = 0;
            for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
            setMicActive(sum / dataArr.length > 6);
            animFrameRef.current = requestAnimationFrame(checkAudio);
          };
          checkAudio();
        }

        const allDevs = await navigator.mediaDevices.enumerateDevices();
        const vDevs = allDevs.filter((d) => d.kind === 'videoinput');
        const aDevs = allDevs.filter((d) => d.kind === 'audioinput');
        setVideoDevices(vDevs);
        setAudioDevices(aDevs);

        if (sourceMode === 'camera') {
          const currentVId =
            finalStream.getVideoTracks()[0]?.getSettings().deviceId ||
            vDevs[0]?.deviceId ||
            '';
          if (!videoId && currentVId) setSelectedVideoId(currentVId);
        }
        const currentAId =
          finalStream.getAudioTracks()[0]?.getSettings().deviceId ||
          aDevs[0]?.deviceId ||
          '';
        if (!audioId && currentAId) setSelectedAudioId(currentAId);
      } catch (err: unknown) {
        console.error('Camera/mic connection error:', err);
        if (sourceMode === 'screen') {
          setCaptureSource('camera');
          initMediaStream(videoId, audioId, 'camera');
          return;
        }
        setDeviceError(
          '카메라 또는 마이크 권한이 필요합니다. 브라우저 주소창 왼쪽 권한 설정에서 허용 후 다시 시도해 주세요.'
        );
      }
    },
    [stopMediaResources]
  );

  useEffect(() => {
    initMediaStream();
    return () => {
      stopMediaResources();
    };
  }, [initMediaStream, stopMediaResources]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        stageRef.current === 'recording' ||
        stageRef.current === 'paused' ||
        stageRef.current === 'saving'
      ) {
        e.preventDefault();
        e.returnValue = '녹화가 진행 중입니다.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (stage !== 'recording') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        elapsedRef.current = next;
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const ensureStudioSession = useCallback(async (): Promise<string> => {
    if (activeSessionId) {
      const existing = await db.sessions.get(activeSessionId);
      if (existing && activeQuestion) {
        const catName =
          categories.find((c) => c.id === activeQuestion.categoryId)?.name ||
          '백엔드 기술 면접';
        const updatedSnapshots = {
          ...existing.questionSnapshots,
          [activeQuestion.id]: {
            id: activeQuestion.id,
            categoryId: activeQuestion.categoryId,
            categoryName: catName,
            shortTitle: activeQuestion.shortTitle,
            content: activeQuestion.content,
            memo: activeQuestion.memo,
          },
        };
        const updatedIds = existing.questionIds.includes(activeQuestion.id)
          ? existing.questionIds
          : [...existing.questionIds, activeQuestion.id];
        await db.sessions.update(activeSessionId, {
          questionIds: updatedIds,
          questionSnapshots: updatedSnapshots,
          endedAt: new Date().toISOString(),
          status: 'completed',
        });
        return activeSessionId;
      }
    }

    const newSessionId = uuidv4();
    const snapshots: Record<string, QuestionSnapshot> = {};
    for (const q of filteredQuestions) {
      const catName =
        categories.find((c) => c.id === q.categoryId)?.name ||
        '백엔드 기술 면접';
      snapshots[q.id] = {
        id: q.id,
        categoryId: q.categoryId,
        categoryName: catName,
        shortTitle: q.shortTitle,
        content: q.content,
        memo: q.memo,
      };
    }

    const newSession: InterviewSession = {
      id: newSessionId,
      title: activeCategoryName,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      questionIds: filteredQuestions.map((q) => q.id),
      questionSnapshots: snapshots,
      settings: {
        orderMode: isRandomOrder ? 'random' : 'sequential',
        answerLimitSeconds,
        prepTimeSeconds: 0,
        videoDeviceId: selectedVideoId,
        audioDeviceId: selectedAudioId,
        mirrorVideo,
      },
      status: 'completed',
    };

    await db.sessions.add(newSession);
    setActiveSessionId(newSessionId);
    return newSessionId;
  }, [
    activeSessionId,
    activeQuestion,
    categories,
    filteredQuestions,
    activeCategoryName,
    isRandomOrder,
    answerLimitSeconds,
    selectedVideoId,
    selectedAudioId,
    mirrorVideo,
  ]);

  const handleStartRecording = async () => {
    if (!activeQuestion) return;
    if (!streamRef.current || !streamRef.current.active) {
      await initMediaStream(
        selectedVideoId || undefined,
        selectedAudioId || undefined,
        captureSource
      );
    }
    const stream = streamRef.current;
    if (!stream || !stream.active) return;

    chunksRef.current = [];
    elapsedRef.current = 0;
    setElapsedSeconds(0);

    const mimeType = getSupportedMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      recorder = new MediaRecorder(stream);
    }

    const targetQuestion = activeQuestion;
    const catName =
      categories.find((c) => c.id === targetQuestion.categoryId)?.name ||
      '백엔드 기술 면접';
    const snapshot: QuestionSnapshot = {
      id: targetQuestion.id,
      categoryId: targetQuestion.categoryId,
      categoryName: catName,
      shortTitle: targetQuestion.shortTitle,
      content: targetQuestion.content,
      memo: targetQuestion.memo,
    };
    const actualMime = recorder.mimeType || mimeType || 'video/webm';

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      updateStage('saving');
      try {
        const sid = await ensureStudioSession();
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: actualMime })
            : null;
        chunksRef.current = [];

        const rec: AnswerRecording = {
          id: uuidv4(),
          sessionId: sid,
          questionId: targetQuestion.id,
          questionSnapshot: snapshot,
          videoBlob: blob,
          mimeType: actualMime,
          duration: Math.max(1, Math.round(elapsedRef.current)),
          videoSize: blob ? blob.size : 0,
          recordedAt: new Date().toISOString(),
        };
        await db.recordings.put(rec);
        updateStage('saved');
      } catch (err) {
        console.error('Failed to save recording:', err);
        updateStage('idle');
      } finally {
        if (stopResolveRef.current) {
          const resolve = stopResolveRef.current;
          stopResolveRef.current = null;
          resolve();
        }
      }
    };

    recorderRef.current = recorder;
    recorder.start(1000);
    updateStage('recording');
  };

  const stopRecordingAndWait = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === 'inactive') {
        resolve();
        return;
      }
      stopResolveRef.current = resolve;
      try {
        rec.stop();
      } catch {
        stopResolveRef.current = null;
        resolve();
      }
    });
  }, []);

  const handleStopRecording = async () => {
    if (stage === 'recording' || stage === 'paused') {
      await stopRecordingAndWait();
    }
  };

  const handleTogglePause = () => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === 'recording' && typeof rec.pause === 'function') {
      rec.pause();
      updateStage('paused');
    } else if (rec.state === 'paused' && typeof rec.resume === 'function') {
      rec.resume();
      updateStage('recording');
    }
  };

  const selectQuestion = async (questionId: string) => {
    if (stage === 'saving') return;
    if (stage === 'recording' || stage === 'paused') {
      await stopRecordingAndWait();
    }
    setActiveQuestionId(questionId);
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    updateStage('idle');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('questionId', questionId);
      return next;
    });
  };

  const handlePrevQuestion = async () => {
    if (currentIndex <= 0) return;
    const prevQ = filteredQuestions[currentIndex - 1];
    if (prevQ) await selectQuestion(prevQ.id);
  };

  const handleNextQuestion = async () => {
    if (stage === 'saving') return;
    if (stage === 'recording' || stage === 'paused') {
      await stopRecordingAndWait();
    }
    if (currentIndex < filteredQuestions.length - 1) {
      const nextQ = filteredQuestions[currentIndex + 1];
      if (nextQ) await selectQuestion(nextQ.id);
    } else if (activeQuestion) {
      navigate(`/records?questionId=${activeQuestion.id}`);
    }
  };

  const toggleRandomShuffle = () => {
    if (!isRandomOrder) {
      const ids = filteredQuestions.map((q) => q.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      setShuffledIds(ids);
      setIsRandomOrder(true);
    } else {
      setIsRandomOrder(false);
      setShuffledIds([]);
    }
  };

  const previousRecordingsForCurrent = activeQuestion
    ? recordingsByQuestion.get(activeQuestion.id) || []
    : [];

  const isOverLimit =
    answerLimitSeconds > 0 && elapsedSeconds >= answerLimitSeconds;

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-stretch min-h-[calc(100vh-7rem)]">
      <aside className="w-full lg:w-[290px] shrink-0 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
            질문 목록
          </h2>
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>추가</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredQuestions.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-slate-500">
                등록된 질문이 없습니다.
              </p>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>첫 질문 등록하기</span>
              </button>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const isSelected = q.id === activeQuestion?.id;
              const recCount = recordingsByQuestion.get(q.id)?.length || 0;
              const displayLabel = q.shortTitle || q.content;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => selectQuestion(q.id)}
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-2 transition-colors border-l-[3.5px] ${
                    isSelected
                      ? 'bg-[#EEF4FF] border-l-blue-600 text-slate-900 font-semibold'
                      : 'bg-white border-l-transparent text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="text-[13.5px] truncate">
                    {idx + 1}. {displayLabel}
                  </span>
                  {recCount > 0 && (
                    <Check className="h-4 w-4 text-emerald-600 stroke-[2.5] shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex-1 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex flex-col justify-between overflow-hidden">
        <div>
          <div className="px-7 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-400" />
                <span>{activeCategoryName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute left-0 top-8 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId('all');
                      setIsCategoryMenuOpen(false);
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      selectedCategoryId === 'all'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    전체 면접 질문 ({allQuestions.length})
                  </button>
                  {categories.map((cat) => {
                    const count = allQuestions.filter(
                      (q) => q.categoryId === cat.id
                    ).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          setIsCategoryMenuOpen(false);
                        }}
                        className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                          selectedCategoryId === cat.id
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cat.name} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={toggleRandomShuffle}
                className={`hidden sm:inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  isRandomOrder
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700'
                }`}
                title="질문 순서 랜덤 셔플"
              >
                <Shuffle className="h-3 w-3" />
                <span>{isRandomOrder ? '랜덤 순서' : '등록 순서'}</span>
              </button>
            </div>

            <div className="text-sm font-medium text-slate-500">
              질문 {filteredQuestions.length > 0 ? currentIndex + 1 : 0} /{' '}
              {filteredQuestions.length}
            </div>
          </div>

          <div className="px-7 py-6 space-y-4">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-snug break-keep">
                {activeQuestion
                  ? activeQuestion.content
                  : '질문을 선택하거나 추가해 주세요'}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5">
                {previousRecordingsForCurrent.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/records?questionId=${activeQuestion.id}`)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 hover:border-blue-200 transition-colors shadow-2xs"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>
                      이전 녹화 {previousRecordingsForCurrent.length}개
                    </span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                    <Play className="h-3 w-3" />
                    <span>아직 이전 녹화 없음</span>
                  </span>
                )}

                {stage === 'saved' && activeQuestion && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/records?questionId=${activeQuestion.id}`)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>방금 녹화한 영상 확인 및 피드백 작성하기 →</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative aspect-video w-full max-w-[780px] overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 shadow-xs">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover ${
                  captureSource === 'camera' && mirrorVideo
                    ? 'scale-x-[-1]'
                    : ''
                } ${isStreamReady ? 'block' : 'hidden'}`}
              />

              {!isStreamReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/90 space-y-3">
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                  <p className="text-sm font-medium max-w-md">
                    {deviceError || '카메라 미리보기를 연결하고 있습니다...'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      initMediaStream(
                        selectedVideoId || undefined,
                        selectedAudioId || undefined,
                        captureSource
                      )
                    }
                    className="rounded-lg bg-white/15 hover:bg-white/25 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
                  >
                    카메라·마이크 다시 연결
                  </button>
                </div>
              )}

              <div className="absolute top-4 left-4 flex items-center gap-2">
                {stage === 'recording' ? (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-red-600/90 backdrop-blur-xs px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    <span>REC 녹화 중</span>
                  </div>
                ) : stage === 'paused' ? (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-amber-600/90 backdrop-blur-xs px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                    <span>일시정지됨</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-black/55 backdrop-blur-xs px-3 py-1.5 text-xs font-medium text-white">
                    <span>
                      {captureSource === 'screen'
                        ? '화면 공유 미리보기'
                        : '카메라 미리보기'}
                    </span>
                  </div>
                )}

                {isOverLimit && stage === 'recording' && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/95 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                    <Clock className="h-3.5 w-3.5" />
                    <span>제한 시간 경과 (계속 녹화 중)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 max-w-[780px]">
              <div className="relative inline-flex items-center">
                <Video className="h-4 w-4 text-slate-600 absolute left-3 pointer-events-none" />
                <select
                  value={selectedVideoId}
                  onChange={(e) => {
                    const vId = e.target.value;
                    setSelectedVideoId(vId);
                    setCaptureSource('camera');
                    initMediaStream(vId, selectedAudioId || undefined, 'camera');
                  }}
                  disabled={stage === 'recording' || stage === 'paused'}
                  aria-label="카메라 선택"
                  className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer max-w-[140px] truncate disabled:opacity-50"
                >
                  {videoDevices.length === 0 ? (
                    <option value="">카메라</option>
                  ) : (
                    videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label ? `카메라 (${d.label.slice(0, 12)})` : `카메라 ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>

              <div className="relative inline-flex items-center">
                <Mic
                  className={`h-4 w-4 absolute left-3 pointer-events-none ${
                    micActive ? 'text-emerald-600' : 'text-slate-600'
                  }`}
                />
                <select
                  value={selectedAudioId}
                  onChange={(e) => {
                    const aId = e.target.value;
                    setSelectedAudioId(aId);
                    initMediaStream(
                      selectedVideoId || undefined,
                      aId,
                      captureSource
                    );
                  }}
                  disabled={stage === 'recording' || stage === 'paused'}
                  aria-label="마이크 선택"
                  className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer max-w-[140px] truncate disabled:opacity-50"
                >
                  {audioDevices.length === 0 ? (
                    <option value="">마이크</option>
                  ) : (
                    audioDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label ? `마이크 (${d.label.slice(0, 12)})` : `마이크 ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>

              <div className="relative inline-flex items-center">
                <Monitor className="h-4 w-4 text-slate-600 absolute left-3 pointer-events-none" />
                <select
                  value={
                    captureSource === 'screen'
                      ? 'screen'
                      : mirrorVideo
                      ? 'camera-mirror'
                      : 'camera-normal'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'screen') {
                      setCaptureSource('screen');
                      initMediaStream(
                        selectedVideoId || undefined,
                        selectedAudioId || undefined,
                        'screen'
                      );
                    } else if (val === 'camera-mirror') {
                      setMirrorVideo(true);
                      if (captureSource !== 'camera') {
                        setCaptureSource('camera');
                        initMediaStream(
                          selectedVideoId || undefined,
                          selectedAudioId || undefined,
                          'camera'
                        );
                      }
                    } else {
                      setMirrorVideo(false);
                      if (captureSource !== 'camera') {
                        setCaptureSource('camera');
                        initMediaStream(
                          selectedVideoId || undefined,
                          selectedAudioId || undefined,
                          'camera'
                        );
                      }
                    }
                  }}
                  disabled={stage === 'recording' || stage === 'paused'}
                  aria-label="화면 공유 및 화면 모드"
                  className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer disabled:opacity-50"
                >
                  <option value="camera-mirror">화면 공유</option>
                  <option value="camera-normal">카메라 (좌우반전 해제)</option>
                  <option value="screen">화면 공유로 녹화</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>

              {stage === 'recording' || stage === 'paused' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-6 h-10 text-sm font-bold text-white shadow-xs transition-colors"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>녹화 종료</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 h-10 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    {stage === 'paused' ? (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>재개</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>일시정지</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={!activeQuestion || stage === 'saving'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-7 h-10 text-sm font-bold text-white shadow-xs transition-colors"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  <span>녹화 시작</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-1">
                <span
                  className={`text-xl font-bold font-mono tracking-tight ${
                    isOverLimit ? 'text-red-600' : 'text-slate-800'
                  }`}
                >
                  {formatDuration(elapsedSeconds)}
                </span>

                <select
                  value={answerLimitSeconds}
                  onChange={(e) =>
                    setAnswerLimitSeconds(Number(e.target.value))
                  }
                  title="답변 제한 시간 설정"
                  className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-medium text-slate-500 hover:text-slate-700 focus:outline-none"
                >
                  <option value={0}>제한 없음</option>
                  <option value={60}>제한 1분</option>
                  <option value={120}>제한 2분</option>
                  <option value={180}>제한 3분</option>
                  <option value={300}>제한 5분</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="px-7 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevQuestion}
            disabled={currentIndex <= 0 || stage === 'saving'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>이전 질문</span>
          </button>

          <button
            type="button"
            onClick={handleNextQuestion}
            disabled={!activeQuestion || stage === 'saving'}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <span>
              {currentIndex >= filteredQuestions.length - 1
                ? '연습 기록 보기'
                : '다음 질문'}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <QuickQuestionModal
        open={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        categories={categories}
        defaultCategoryId={
          selectedCategoryId !== 'all' ? selectedCategoryId : 'cat-backend'
        }
        onAdded={(newId) => selectQuestion(newId)}
      />
    </div>
  );
}
