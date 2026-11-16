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
  UserCheck,
  Camera,
  Volume2,
  VolumeX,
  Upload,
  RotateCcw,
  Sparkles,
  SkipForward,
  Lightbulb,
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
type StudioMode = 'self' | 'interviewer';

interface InterviewerPersona {
  id: string;
  name: string;
  role: string;
  badge: string;
  description: string;
  accentColor: string;
  voicePitch: number;
  voiceRate: number;
}

const INTERVIEWER_PERSONAS: InterviewerPersona[] = [
  {
    id: 'tech-lead',
    name: '김현우 팀장',
    role: '백엔드 수석 면접관 (Tech Lead)',
    badge: '실무·기술 면접',
    description: '핵심 원리와 트레이드오프, 실무 문제 해결 경험을 중점적으로 확인합니다.',
    accentColor: 'blue',
    voicePitch: 0.95,
    voiceRate: 1.02,
  },
  {
    id: 'hr-director',
    name: '박서연 수석',
    role: '피플팀 리드 (Culture & HR)',
    badge: '컬처핏·인성 면접',
    description: '협업 커뮤니케이션 방식과 지원 동기, 성장 가능성을 주의 깊게 듣습니다.',
    accentColor: 'emerald',
    voicePitch: 1.08,
    voiceRate: 1.0,
  },
];

const CUSTOM_VIDEO_DB_NAME = 'InterviewLabCustomAssets';
const CUSTOM_VIDEO_STORE = 'interviewerVideos';
const CUSTOM_VIDEO_KEY = 'custom_interviewer_loop';

async function saveCustomInterviewerVideo(blob: Blob | null): Promise<void> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(CUSTOM_VIDEO_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains(CUSTOM_VIDEO_STORE)) {
          idb.createObjectStore(CUSTOM_VIDEO_STORE);
        }
      };
      req.onsuccess = () => {
        const idb = req.result;
        const tx = idb.transaction(CUSTOM_VIDEO_STORE, 'readwrite');
        const store = tx.objectStore(CUSTOM_VIDEO_STORE);
        if (blob) {
          store.put(blob, CUSTOM_VIDEO_KEY);
        } else {
          store.delete(CUSTOM_VIDEO_KEY);
        }
        tx.oncomplete = () => {
          idb.close();
          resolve();
        };
        tx.onerror = () => {
          idb.close();
          resolve();
        };
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function loadCustomInterviewerVideo(): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(CUSTOM_VIDEO_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains(CUSTOM_VIDEO_STORE)) {
          idb.createObjectStore(CUSTOM_VIDEO_STORE);
        }
      };
      req.onsuccess = () => {
        const idb = req.result;
        const tx = idb.transaction(CUSTOM_VIDEO_STORE, 'readonly');
        const store = tx.objectStore(CUSTOM_VIDEO_STORE);
        const getReq = store.get(CUSTOM_VIDEO_KEY);
        getReq.onsuccess = () => {
          const result = getReq.result instanceof Blob ? getReq.result : null;
          idb.close();
          resolve(result);
        };
        getReq.onerror = () => {
          idb.close();
          resolve(null);
        };
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

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
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [showHintMemo, setShowHintMemo] = useState<boolean>(true);

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

  const [studioMode, setStudioMode] = useState<StudioMode>(() => {
    const saved = localStorage.getItem('interview_lab_studio_mode');
    return saved === 'interviewer' ? 'interviewer' : 'self';
  });
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    INTERVIEWER_PERSONAS[0].id
  );
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] =
    useState<boolean>(false);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [listeningCueIndex, setListeningCueIndex] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const interviewerVideoRef = useRef<HTMLVideoElement | null>(null);
  const customVideoInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef<number>(0);
  const stageRef = useRef<RecordStage>('idle');
  const stopResolveRef = useRef<(() => void) | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speechProceedRef = useRef<(() => void) | null>(null);

  const activePersona = useMemo(
    () =>
      INTERVIEWER_PERSONAS.find((p) => p.id === selectedPersonaId) ||
      INTERVIEWER_PERSONAS[0],
    [selectedPersonaId]
  );

  const handleChangeStudioMode = (mode: StudioMode) => {
    setStudioMode(mode);
    try {
      localStorage.setItem('interview_lab_studio_mode', mode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let revokeUrl: string | null = null;
    loadCustomInterviewerVideo().then((blob) => {
      if (blob) {
        revokeUrl = URL.createObjectURL(blob);
        setCustomVideoUrl(revokeUrl);
      }
    });
    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, []);

  const handleUploadCustomVideo = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await saveCustomInterviewerVideo(file);
    setCustomVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    e.target.value = '';
  };

  const handleResetCustomVideo = async () => {
    await saveCustomInterviewerVideo(null);
    setCustomVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const stopSpeaking = useCallback(() => {
    speechProceedRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsInterviewerSpeaking(false);
  }, []);

  const speakQuestionText = useCallback(
    (text: string, onComplete?: () => void) => {
      if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        !text.trim()
      ) {
        onComplete?.();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.pitch = activePersona.voicePitch;
        utterance.rate = activePersona.voiceRate;

        const voices = window.speechSynthesis.getVoices();
        const koVoice = voices.find((v) => v.lang.includes('ko'));
        if (koVoice) {
          utterance.voice = koVoice;
        }

        let finished = false;
        const finishOnce = () => {
          if (finished) return;
          finished = true;
          speechProceedRef.current = null;
          setIsInterviewerSpeaking(false);
          onComplete?.();
        };

        speechProceedRef.current = () => {
          try {
            window.speechSynthesis.cancel();
          } catch {
            // ignore
          }
          finishOnce();
        };

        utterance.onstart = () => {
          setIsInterviewerSpeaking(true);
        };
        utterance.onend = finishOnce;
        utterance.onerror = finishOnce;

        setIsInterviewerSpeaking(true);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsInterviewerSpeaking(false);
        onComplete?.();
      }
    },
    [activePersona]
  );

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  useEffect(() => {
    if (stage !== 'recording') {
      setListeningCueIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setListeningCueIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [stage]);

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
    if (activeQuestion) {
      return (
        categories.find((c) => c.id === activeQuestion.categoryId)?.name ||
        '백엔드 기술 면접'
      );
    }
    if (selectedCategoryId !== 'all') {
      return (
        categories.find((c) => c.id === selectedCategoryId)?.name ||
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

  const startMediaRecorderNow = async () => {
    if (!activeQuestion) return;
    if (!streamRef.current || !streamRef.current.active) {
      await initMediaStream(
        selectedVideoId || undefined,
        selectedAudioId || undefined,
        captureSource
      );
    }
    const stream = streamRef.current;
    if (!stream || !stream.active) {
      updateStage('idle');
      return;
    }

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

  const handleStartRecording = async () => {
    if (!activeQuestion) return;
    if (!streamRef.current || !streamRef.current.active) {
      await initMediaStream(
        selectedVideoId || undefined,
        selectedAudioId || undefined,
        captureSource
      );
    }
    if (!streamRef.current || !streamRef.current.active) return;

    if (studioMode === 'interviewer' && ttsEnabled) {
      updateStage('prep');
      speakQuestionText(activeQuestion.content, () => {
        if (stageRef.current === 'prep') {
          startMediaRecorderNow();
        }
      });
    } else {
      stopSpeaking();
      await startMediaRecorderNow();
    }
  };

  const handleSkipQuestionSpeech = () => {
    if (speechProceedRef.current) {
      speechProceedRef.current();
    } else if (stageRef.current === 'prep') {
      stopSpeaking();
      startMediaRecorderNow();
    }
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
    stopSpeaking();
    if (stage === 'prep') {
      updateStage('idle');
      return;
    }
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
    stopSpeaking();
    if (stage === 'prep') {
      updateStage('idle');
    } else if (stage === 'recording' || stage === 'paused') {
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
    stopSpeaking();
    if (stage === 'prep') {
      updateStage('idle');
    } else if (stage === 'recording' || stage === 'paused') {
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

  const listeningCueMessages = [
    '고개를 끄덕이며 답변의 핵심 논리와 근거를 경청하고 있습니다...',
    '이력서 및 평가표를 대조하며 답변 키워드를 메모하고 있습니다...',
    '지원자의 시선 처리와 답변 전달력을 주의 깊게 확인하고 있습니다...',
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:h-[calc(100vh-5.2rem)]">
      {/* 좌측: 카테고리 필터 + 질문 목록 + 이전/다음 네비게이션 */}
      <aside className="w-full lg:w-[275px] shrink-0 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col overflow-hidden max-h-[300px] lg:max-h-none">
        {/* 사이드바 상단: 타이틀 & 카테고리 필터 */}
        <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                질문 목록
              </h2>
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-[#0B50E8]">
                {filteredQuestions.length > 0 ? currentIndex + 1 : 0}/
                {filteredQuestions.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleRandomShuffle}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  isRandomOrder
                    ? 'border-blue-200 bg-blue-50 text-[#0B50E8]'
                    : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                }`}
                title="질문 순서 랜덤 셔플"
              >
                <Shuffle className="h-3 w-3" />
                <span>{isRandomOrder ? '랜덤' : '순차'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0B50E8] hover:bg-[#0942C2] px-2.5 py-1 text-[11px] font-bold text-white transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>추가</span>
              </button>
            </div>
          </div>

          {/* 카테고리 드롭다운 */}
          <div className="relative">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              aria-label="카테고리 필터"
              className="w-full h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0B50E8] cursor-pointer"
            >
              <option value="all">
                전체 면접 질문 ({allQuestions.length}개)
              </option>
              {categories.map((cat) => {
                const count = allQuestions.filter(
                  (q) => q.categoryId === cat.id
                ).length;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({count}개)
                  </option>
                );
              })}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 질문 리스트 */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredQuestions.length === 0 ? (
            <div className="p-6 text-center space-y-2.5">
              <p className="text-xs text-slate-500">등록된 질문이 없습니다.</p>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0B50E8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0942C2]"
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
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors border-l-[3.5px] cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEF4FF] border-l-[#0B50E8] text-slate-900 font-bold'
                      : 'bg-white border-l-transparent text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="text-[12.5px] truncate">
                    {idx + 1}. {displayLabel}
                  </span>
                  {recCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                      {recCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* 사이드바 하단: 빠른 질문 이동 */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrevQuestion}
            disabled={currentIndex <= 0 || stage === 'saving'}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>이전 질문</span>
          </button>
          <button
            type="button"
            onClick={handleNextQuestion}
            disabled={!activeQuestion || stage === 'saving'}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span>
              {currentIndex >= filteredQuestions.length - 1
                ? '기록 보기'
                : '다음 질문'}
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* 우측 메인 스튜디오: 한 화면에 꽉 차는 3단 구성 (질문 헤더 + 중앙 비디오 + 하단 컨트롤 독) */}
      <section className="flex-1 min-w-0 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col justify-between overflow-hidden">
        {/* 1. 상단 컴팩트 질문 & 모드 전환 헤더 */}
        <div className="px-5 py-3.5 border-b border-slate-100 space-y-2 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[11px] font-bold text-[#0B50E8]">
                Q{filteredQuestions.length > 0 ? currentIndex + 1 : 0}.{' '}
                {activeCategoryName}
              </span>

              {activeQuestion?.memo && (
                <button
                  type="button"
                  onClick={() => setShowHintMemo((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                    showHintMemo
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Lightbulb className="h-3 w-3 text-amber-500" />
                  <span>답변 힌트 {showHintMemo ? '숨기기' : '보기'}</span>
                </button>
              )}

              {activeQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    if (isInterviewerSpeaking) {
                      stopSpeaking();
                    } else {
                      speakQuestionText(activeQuestion.content);
                    }
                  }}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                    isInterviewerSpeaking
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Volume2 className="h-3 w-3 text-[#0B50E8]" />
                  <span>
                    {isInterviewerSpeaking ? '읽기 중지' : '질문 음성 듣기'}
                  </span>
                </button>
              )}
            </div>

            {/* 연습 모드 스위치: 내 화면 보며 연습 vs 실전 면접관 모드 */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5">
              <button
                type="button"
                onClick={() => handleChangeStudioMode('self')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  studioMode === 'self'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="h-3.5 w-3.5 text-[#0B50E8]" />
                <span>내 화면 보며 연습</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangeStudioMode('interviewer')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  studioMode === 'interviewer'
                    ? 'bg-[#0B50E8] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>실전 면접관 모드</span>
              </button>
            </div>
          </div>

          {/* 질문 본문 & 힌트 메모 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-lg sm:text-[21px] font-extrabold text-slate-900 tracking-tight leading-snug break-keep">
              {activeQuestion
                ? activeQuestion.content
                : '질문을 선택하거나 추가해 주세요'}
            </h1>

            {showHintMemo && activeQuestion?.memo && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 text-xs text-amber-900 shrink-0 max-w-md">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="truncate font-medium">
                  {activeQuestion.memo}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. 중앙 비디오 스테이지: 남은 높이에 맞춰 자동 리사이즈 */}
        <div className="flex-1 min-h-0 bg-slate-950/95 p-3 sm:p-4 flex items-center justify-center relative overflow-hidden">
          <div
            className={`relative w-full h-full max-w-[920px] aspect-video max-h-full overflow-hidden rounded-xl bg-slate-900 border shadow-lg transition-all ${
              studioMode === 'interviewer' && isInterviewerSpeaking
                ? 'border-emerald-400 ring-2 ring-emerald-400/40'
                : 'border-slate-800'
            }`}
          >
            {/* 실전 면접관 모드 레이어 */}
            {studioMode === 'interviewer' && (
              <div className="absolute inset-0 z-10 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 select-none overflow-hidden">
                {/* 우측 상단 플로팅 면접관 설정 바 (화면 밖 공간을 차지하지 않음!) */}
                <div className="relative z-30 p-3 flex flex-wrap items-center justify-end gap-1.5 pointer-events-auto">
                  <div className="inline-flex items-center gap-0.5 rounded-lg bg-black/60 backdrop-blur-xs border border-white/15 p-0.5">
                    {INTERVIEWER_PERSONAS.map((persona) => (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => setSelectedPersonaId(persona.id)}
                        className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                          selectedPersonaId === persona.id
                            ? 'bg-[#0B50E8] text-white'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {persona.name}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setTtsEnabled((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-xs transition-colors cursor-pointer ${
                      ttsEnabled
                        ? 'border-blue-400/40 bg-blue-500/25 text-blue-200'
                        : 'border-white/15 bg-black/60 text-slate-300 hover:text-white'
                    }`}
                    title="녹화 시작 시 면접관이 질문을 먼저 음성으로 읽어줍니다"
                  >
                    {ttsEnabled ? (
                      <Volume2 className="h-3 w-3" />
                    ) : (
                      <VolumeX className="h-3 w-3" />
                    )}
                    <span>질문 자동 읽기: {ttsEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <input
                    ref={customVideoInputRef}
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleUploadCustomVideo}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => customVideoInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/60 hover:bg-black/80 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <Upload className="h-3 w-3" />
                    <span>
                      {customVideoUrl ? '영상(.mp4) 변경' : '면접관 영상(.mp4)'}
                    </span>
                  </button>

                  {customVideoUrl && (
                    <button
                      type="button"
                      onClick={handleResetCustomVideo}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/60 hover:bg-black/80 px-2 py-1 text-[11px] font-medium text-slate-300 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>초기화</span>
                    </button>
                  )}
                </div>

                {customVideoUrl ? (
                  <video
                    ref={interviewerVideoRef}
                    src={customVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <div
                      className={`absolute w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
                        isInterviewerSpeaking
                          ? 'bg-emerald-500 scale-110'
                          : stage === 'recording'
                          ? 'bg-blue-500 scale-105'
                          : 'bg-slate-600'
                      }`}
                    />

                    <div className="relative flex flex-col items-center">
                      <div
                        className={`relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 transition-all duration-500 shadow-2xl ${
                          isInterviewerSpeaking
                            ? 'border-emerald-400 shadow-emerald-500/25 scale-[1.03]'
                            : stage === 'recording'
                            ? 'border-blue-400/80 shadow-blue-500/20'
                            : 'border-slate-700'
                        } bg-gradient-to-b from-slate-700 to-slate-800`}
                      >
                        <svg
                          viewBox="0 0 120 120"
                          className={`w-24 h-24 sm:w-32 sm:h-32 transition-transform duration-700 ${
                            stage === 'recording' ? 'animate-pulse' : ''
                          }`}
                          fill="none"
                        >
                          <circle cx="60" cy="60" r="56" fill="#1E293B" />
                          <path
                            d="M20 112C24 88 40 78 60 78C80 78 96 88 100 112"
                            fill="#0F172A"
                          />
                          <path d="M50 78L60 106L70 78H50Z" fill="#F8FAFC" />
                          <path
                            d="M58 84L60 78L62 84L61 106H59L58 84Z"
                            fill={
                              activePersona.id === 'tech-lead'
                                ? '#2563EB'
                                : '#059669'
                            }
                          />
                          <rect
                            x="52"
                            y="64"
                            width="16"
                            height="16"
                            rx="6"
                            fill="#F1C27D"
                          />
                          <ellipse
                            cx="60"
                            cy="48"
                            rx="20"
                            ry="23"
                            fill="#F5CBA7"
                          />
                          {activePersona.id === 'tech-lead' ? (
                            <path
                              d="M40 44C40 28 48 22 60 22C72 22 80 28 80 44C76 34 68 30 60 30C50 30 43 35 40 44Z"
                              fill="#1E293B"
                            />
                          ) : (
                            <path
                              d="M38 52C38 28 47 21 60 21C73 21 82 28 82 52C79 36 71 30 60 30C49 30 41 36 38 52Z"
                              fill="#0F172A"
                            />
                          )}
                          {activePersona.id === 'tech-lead' && (
                            <g stroke="#334155" strokeWidth="2">
                              <rect
                                x="45"
                                y="43"
                                width="11"
                                height="8"
                                rx="2"
                                fill="#E2E8F0"
                                fillOpacity="0.25"
                              />
                              <rect
                                x="64"
                                y="43"
                                width="11"
                                height="8"
                                rx="2"
                                fill="#E2E8F0"
                                fillOpacity="0.25"
                              />
                              <line x1="56" y1="47" x2="64" y2="47" />
                            </g>
                          )}
                          <circle cx="50.5" cy="47" r="2" fill="#0F172A" />
                          <circle cx="69.5" cy="47" r="2" fill="#0F172A" />
                          {isInterviewerSpeaking ? (
                            <ellipse
                              cx="60"
                              cy="59"
                              rx="4.5"
                              ry="3"
                              fill="#BE123C"
                            />
                          ) : (
                            <path
                              d="M54 58C56 60.5 64 60.5 66 58"
                              stroke="#475569"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                            />
                          )}
                        </svg>

                        {isInterviewerSpeaking && (
                          <div className="absolute -bottom-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-bold text-white shadow-md">
                            <span className="inline-flex items-end gap-0.5 h-3">
                              <span className="w-0.5 h-full bg-white rounded-full animate-eq-1" />
                              <span className="w-0.5 h-full bg-white rounded-full animate-eq-2" />
                              <span className="w-0.5 h-full bg-white rounded-full animate-eq-3" />
                              <span className="w-0.5 h-full bg-white rounded-full animate-eq-4" />
                            </span>
                            <span>질문 발화 중</span>
                          </div>
                        )}

                        {!isInterviewerSpeaking && stage === 'recording' && (
                          <div className="absolute -bottom-3 inline-flex items-center gap-1.5 rounded-full bg-[#0B50E8] px-3 py-0.5 text-[11px] font-bold text-white shadow-md">
                            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-ping" />
                            <span>경청 및 평가 기록 중</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 text-center space-y-0.5">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            {activePersona.name}
                          </span>
                          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-white/10">
                            {activePersona.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {activePersona.role}
                        </p>
                      </div>

                      <div className="mt-3 max-w-md rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs px-4 py-2 text-center">
                        {isInterviewerSpeaking ? (
                          <p className="text-xs font-medium text-emerald-300">
                            &ldquo;{activeQuestion?.content}&rdquo;
                          </p>
                        ) : stage === 'recording' ? (
                          <p className="text-xs font-medium text-slate-200">
                            {listeningCueMessages[listeningCueIndex]}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-300">
                            {activePersona.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {stage === 'prep' && (
                  <div className="relative z-30 mt-auto p-3 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-900/90 border border-emerald-400/40 px-4 py-2 text-white shadow-lg">
                      <span className="text-xs font-medium text-emerald-300">
                        면접관이 질문을 읽고 있습니다. 끝나면 자동으로 녹화가 시작됩니다.
                      </span>
                      <button
                        type="button"
                        onClick={handleSkipQuestionSpeech}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                        <span>바로 답변 녹화 시작</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 내 웹캠 화면: 셀프 모드에서는 전체, 면접관 모드에서는 우측 하단 PIP */}
            <div
              className={
                studioMode === 'interviewer'
                  ? 'absolute bottom-3 right-3 z-20 w-36 sm:w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/85 bg-slate-900 shadow-2xl transition-all'
                  : 'relative w-full h-full'
              }
            >
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
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-white/90 space-y-2 bg-slate-900">
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                  <p className="text-[11px] sm:text-xs font-medium max-w-md line-clamp-2">
                    {deviceError || '카메라 연결 중...'}
                  </p>
                  {studioMode === 'self' && (
                    <button
                      type="button"
                      onClick={() =>
                        initMediaStream(
                          selectedVideoId || undefined,
                          selectedAudioId || undefined,
                          captureSource
                        )
                      }
                      className="rounded-lg bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                    >
                      카메라·마이크 다시 연결
                    </button>
                  )}
                </div>
              )}

              {studioMode === 'interviewer' && (
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <span className="rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    지원자 (나)
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      micActive ? 'bg-emerald-400' : 'bg-white/40'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* 좌측 상단 상태 배지 */}
            <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2 pointer-events-none">
              {stage === 'recording' ? (
                <div className="inline-flex items-center gap-2 rounded-lg bg-red-600/90 backdrop-blur-xs px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span>REC 답변 녹화 중</span>
                </div>
              ) : stage === 'prep' ? (
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/90 backdrop-blur-xs px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  <span>면접관 질문 진행 중</span>
                </div>
              ) : stage === 'paused' ? (
                <div className="inline-flex items-center gap-2 rounded-lg bg-amber-600/90 backdrop-blur-xs px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <span>일시정지됨</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-lg bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] font-medium text-white">
                  <span>
                    {studioMode === 'interviewer'
                      ? `실전 면접관 (${
                          customVideoUrl ? '커스텀 영상' : activePersona.name
                        })`
                      : captureSource === 'screen'
                      ? '화면 공유 미리보기'
                      : '셀프 카메라 미리보기'}
                  </span>
                </div>
              )}

              {isOverLimit && stage === 'recording' && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                  <Clock className="h-3 w-3" />
                  <span>제한 시간 경과</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. 하단 통합 컨트롤 독 (기기 설정 · 메인 녹화 버튼 & 타이머 · 복기 바로가기) */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* 좌측: 기기 & 화면 컴팩트 셀렉터 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="relative inline-flex items-center">
              <Video className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
              <select
                value={selectedVideoId}
                onChange={(e) => {
                  const vId = e.target.value;
                  setSelectedVideoId(vId);
                  setCaptureSource('camera');
                  initMediaStream(vId, selectedAudioId || undefined, 'camera');
                }}
                disabled={
                  stage === 'recording' ||
                  stage === 'paused' ||
                  stage === 'prep'
                }
                aria-label="카메라 선택"
                className="h-9 appearance-none rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-6 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer max-w-[125px] truncate disabled:opacity-50"
              >
                {videoDevices.length === 0 ? (
                  <option value="">카메라</option>
                ) : (
                  videoDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label ? d.label.slice(0, 10) : `카메라 ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 pointer-events-none" />
            </div>

            <div className="relative inline-flex items-center">
              <Mic
                className={`h-3.5 w-3.5 absolute left-2.5 pointer-events-none ${
                  micActive ? 'text-emerald-600' : 'text-slate-500'
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
                disabled={
                  stage === 'recording' ||
                  stage === 'paused' ||
                  stage === 'prep'
                }
                aria-label="마이크 선택"
                className="h-9 appearance-none rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-6 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer max-w-[125px] truncate disabled:opacity-50"
              >
                {audioDevices.length === 0 ? (
                  <option value="">마이크</option>
                ) : (
                  audioDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label ? d.label.slice(0, 10) : `마이크 ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 pointer-events-none" />
            </div>

            <div className="relative inline-flex items-center">
              <Monitor className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
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
                disabled={
                  stage === 'recording' ||
                  stage === 'paused' ||
                  stage === 'prep'
                }
                aria-label="화면 모드"
                className="h-9 appearance-none rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-6 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="camera-mirror">거울 모드</option>
                <option value="camera-normal">반전 해제</option>
                <option value="screen">화면 공유</option>
              </select>
              <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* 중앙: 메인 녹화 컨트롤 & 타이머 */}
          <div className="flex items-center gap-3">
            {stage === 'recording' || stage === 'paused' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] px-6 h-10 text-sm font-bold text-white shadow-sm transition-all cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>녹화 종료</span>
                </button>
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 h-10 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
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
            ) : stage === 'prep' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkipQuestionSpeech}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 h-10 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
                >
                  <SkipForward className="h-4 w-4" />
                  <span>바로 답변 시작</span>
                </button>
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 h-10 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={!activeQuestion || stage === 'saving'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B50E8] hover:bg-[#0942C2] active:scale-[0.98] disabled:opacity-50 px-7 h-10 text-sm font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
                <span>
                  {studioMode === 'interviewer' && ttsEnabled
                    ? '면접 시작 (질문 듣고 녹화)'
                    : '답변 녹화 시작'}
                </span>
              </button>
            )}

            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/90 px-3 py-1.5">
              <span
                className={`text-base font-extrabold font-mono tracking-tight ${
                  isOverLimit
                    ? 'text-red-600'
                    : stage === 'recording'
                    ? 'text-[#0B50E8]'
                    : 'text-slate-800'
                }`}
              >
                {formatDuration(elapsedSeconds)}
              </span>

              <select
                value={answerLimitSeconds}
                onChange={(e) => setAnswerLimitSeconds(Number(e.target.value))}
                title="답변 제한 시간 설정"
                className="bg-transparent text-[11px] font-semibold text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={0}>/ 제한 없음</option>
                <option value={60}>/ 1분 제한</option>
                <option value={120}>/ 2분 제한</option>
                <option value={180}>/ 3분 제한</option>
              </select>
            </div>
          </div>

          {/* 우측: 복기 바로가기 & 다음 질문 */}
          <div className="flex items-center gap-2">
            {stage === 'saved' && activeQuestion ? (
              <button
                type="button"
                onClick={() =>
                  navigate(`/records?questionId=${activeQuestion.id}`)
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 h-9 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>방금 녹화본 복기하기 →</span>
              </button>
            ) : previousRecordingsForCurrent.length > 0 && activeQuestion ? (
              <button
                type="button"
                onClick={() =>
                  navigate(`/records?questionId=${activeQuestion.id}`)
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 px-3 h-9 text-xs font-bold text-[#0B50E8] transition-colors cursor-pointer"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>이전 녹화 {previousRecordingsForCurrent.length}개 복기</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={!activeQuestion || stage === 'saving'}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 h-9 text-xs font-bold text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <span>
                {currentIndex >= filteredQuestions.length - 1
                  ? '기록 페이지로'
                  : '다음 질문'}
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
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
