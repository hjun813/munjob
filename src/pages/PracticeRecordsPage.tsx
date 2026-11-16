import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Trash2,
  Star,
  SlidersHorizontal,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/database';
import type {
  AnswerRecording,
  SelfFeedback,
  TimestampMemo,
} from '@/types/interview';
import {
  VideoPlayer,
  type VideoPlayerHandle,
} from '@/components/video/VideoPlayer';
import { QuickQuestionModal } from '@/components/questions/QuickQuestionModal';
import {
  calculateAverageScore,
  formatDate,
  formatDuration,
  formatMonthDayTime,
} from '@/lib/utils';

const COMPACT_METRICS: {
  key: keyof Pick<
    SelfFeedback,
    | 'contentScore'
    | 'logicScore'
    | 'speakingScore'
    | 'eyeContactScore'
    | 'confidenceScore'
  >;
  label: string;
}[] = [
  { key: 'contentScore', label: '내용 적절성' },
  { key: 'logicScore', label: '논리 전달력' },
  { key: 'speakingScore', label: '속도·발음' },
  { key: 'eyeContactScore', label: '시선 처리' },
  { key: 'confidenceScore', label: '자신감·태도' },
];

export function PracticeRecordsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryQuestionId = searchParams.get('questionId');
  const queryRecordingId = searchParams.get('recordingId');

  const playerRef = useRef<VideoPlayerHandle | null>(null);

  const data = useLiveQuery(async () => {
    const [categories, questions, recordings, feedbacks] = await Promise.all([
      db.categories.orderBy('createdAt').toArray(),
      db.questions.orderBy('createdAt').toArray(),
      db.recordings.toArray(),
      db.feedbacks.toArray(),
    ]);

    const recordingsByQuestion = new Map<string, AnswerRecording[]>();
    for (const r of recordings) {
      const list = recordingsByQuestion.get(r.questionId) || [];
      list.push(r);
      recordingsByQuestion.set(r.questionId, list);
    }
    for (const [qId, list] of recordingsByQuestion.entries()) {
      list.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
      recordingsByQuestion.set(qId, list);
    }

    const feedbackByRecording = new Map(
      feedbacks.map((f) => [f.recordingId, f])
    );

    return {
      categories,
      questions,
      recordingsByQuestion,
      feedbackByRecording,
    };
  }, []);

  const categories = data?.categories || [];
  const allQuestions = data?.questions || [];
  const recordingsByQuestion =
    data?.recordingsByQuestion || new Map<string, AnswerRecording[]>();
  const feedbackByRecording =
    data?.feedbackByRecording || new Map<string, SelfFeedback>();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    queryQuestionId || ''
  );
  const [selectedRecordingId, setSelectedRecordingId] = useState<string>(
    queryRecordingId || ''
  );

  const [timestampMemos, setTimestampMemos] = useState<TimestampMemo[]>([]);
  const [improvements, setImprovements] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [weaknesses, setWeaknesses] = useState<string>('');
  const [scores, setScores] = useState({
    contentScore: 4,
    logicScore: 4,
    speakingScore: 4,
    eyeContactScore: 4,
    confidenceScore: 4,
  });
  const [showDetailedScores, setShowDetailedScores] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string>('');

  const filteredQuestions = useMemo(() => {
    if (selectedCategoryId === 'all') return allQuestions;
    return allQuestions.filter((q) => q.categoryId === selectedCategoryId);
  }, [allQuestions, selectedCategoryId]);

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
      const withRec = filteredQuestions.find(
        (q) => (recordingsByQuestion.get(q.id)?.length || 0) > 0
      );
      const sampleOffset = filteredQuestions.find(
        (q) => q.id === 'q-sample-3'
      );
      setActiveQuestionId(
        withRec?.id || sampleOffset?.id || filteredQuestions[0].id
      );
    }
  }, [
    filteredQuestions,
    activeQuestionId,
    queryQuestionId,
    recordingsByQuestion,
  ]);

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

  const attempts = useMemo(() => {
    if (!activeQuestion) return [];
    return recordingsByQuestion.get(activeQuestion.id) || [];
  }, [activeQuestion, recordingsByQuestion]);

  useEffect(() => {
    if (attempts.length === 0) {
      setSelectedRecordingId('');
      return;
    }
    if (
      queryRecordingId &&
      attempts.some((a) => a.id === queryRecordingId)
    ) {
      setSelectedRecordingId(queryRecordingId);
      return;
    }
    if (!attempts.some((a) => a.id === selectedRecordingId)) {
      setSelectedRecordingId(attempts[attempts.length - 1].id);
    }
  }, [attempts, selectedRecordingId, queryRecordingId]);

  const activeRecording = useMemo(() => {
    if (attempts.length === 0) return null;
    return (
      attempts.find((a) => a.id === selectedRecordingId) ||
      attempts[attempts.length - 1]
    );
  }, [attempts, selectedRecordingId]);

  const activeFeedback = useMemo(() => {
    if (!activeRecording) return null;
    return feedbackByRecording.get(activeRecording.id) || null;
  }, [activeRecording, feedbackByRecording]);

  useEffect(() => {
    setSaveToast('');
    if (activeFeedback) {
      setTimestampMemos(activeFeedback.timestampMemos || []);
      setImprovements(activeFeedback.improvements || '');
      setStrengths(activeFeedback.strengths || '');
      setWeaknesses(activeFeedback.weaknesses || '');
      setScores({
        contentScore: activeFeedback.contentScore,
        logicScore: activeFeedback.logicScore,
        speakingScore: activeFeedback.speakingScore,
        eyeContactScore: activeFeedback.eyeContactScore,
        confidenceScore: activeFeedback.confidenceScore,
      });
    } else if (activeQuestion?.id === 'q-sample-3' && !activeRecording) {
      setTimestampMemos([
        { id: 'demo-1', time: 16, text: '결론부터 말하기' },
        {
          id: 'demo-2',
          time: 42,
          text: '인덱스가 읽고 건너뛰는 행을 예로 들기',
        },
      ]);
      setImprovements('');
      setStrengths('');
      setWeaknesses('');
    } else {
      setTimestampMemos([]);
      setImprovements('');
      setStrengths('');
      setWeaknesses('');
      setScores({
        contentScore: 4,
        logicScore: 4,
        speakingScore: 4,
        eyeContactScore: 4,
        confidenceScore: 4,
      });
    }
  }, [activeFeedback, activeRecording, activeQuestion?.id]);

  const handleSelectQuestion = (qId: string) => {
    setActiveQuestionId(qId);
    setSelectedRecordingId('');
    setSearchParams({ questionId: qId });
  };

  const handleAddTimestampMemo = () => {
    const currentSec = Math.floor(playerRef.current?.getCurrentTime() || 0);
    const newMemo: TimestampMemo = {
      id: uuidv4(),
      time: currentSec,
      text: '',
    };
    setTimestampMemos((prev) =>
      [...prev, newMemo].sort((a, b) => a.time - b.time)
    );
  };

  const handleUpdateTimestampMemo = (id: string, text: string) => {
    setTimestampMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text } : m))
    );
  };

  const handleDeleteTimestampMemo = (id: string) => {
    setTimestampMemos((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveMemos = async () => {
    if (!activeQuestion) return;

    if (activeRecording) {
      const fb: SelfFeedback = {
        id: activeFeedback?.id || uuidv4(),
        recordingId: activeRecording.id,
        sessionId: activeRecording.sessionId,
        questionId: activeQuestion.id,
        timestampMemos,
        contentScore: scores.contentScore,
        logicScore: scores.logicScore,
        speakingScore: scores.speakingScore,
        eyeContactScore: scores.eyeContactScore,
        confidenceScore: scores.confidenceScore,
        strengths: strengths.trim(),
        weaknesses: weaknesses.trim(),
        improvements: improvements.trim(),
        updatedAt: new Date().toISOString(),
      };
      await db.feedbacks.put(fb);
    } else {
      if (improvements.trim()) {
        await db.questions.update(activeQuestion.id, {
          memo: improvements.trim(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    setSaveToast('메모가 저장되었습니다');
    window.setTimeout(() => setSaveToast(''), 2500);
  };

  const handleDeleteVideoBlob = async () => {
    if (!activeRecording) return;
    const ok = window.confirm(
      '이 시도의 녹화 영상을 삭제하시겠습니까?\n(작성한 피드백 메모는 그대로 유지됩니다.)'
    );
    if (!ok) return;
    await db.recordings.update(activeRecording.id, {
      videoBlob: null,
      videoSize: 0,
    });
  };

  const avgScore = calculateAverageScore(scores);

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
          {filteredQuestions.map((q) => {
            const isSelected = q.id === activeQuestion?.id;
            const recCount = recordingsByQuestion.get(q.id)?.length || 0;
            const displayLabel = q.shortTitle || q.content;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSelectQuestion(q.id)}
                className={`w-full text-left px-4 py-3.5 flex items-center gap-2.5 transition-colors border-l-[3.5px] ${
                  isSelected
                    ? 'bg-[#EEF4FF] border-l-blue-600 text-slate-900 font-semibold'
                    : 'bg-white border-l-transparent text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                {recCount > 0 && (
                  <CheckCircle2 className="h-4 w-4 text-white fill-emerald-500 shrink-0" />
                )}
                <span className="text-[13.5px] truncate">{displayLabel}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex-1 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex flex-col overflow-hidden">
        <div className="px-7 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex items-center gap-2">
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
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium ${
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
                      className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium ${
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
          </div>

          <div className="text-sm font-medium text-slate-500">
            질문 {filteredQuestions.length > 0 ? currentIndex + 1 : 0} /{' '}
            {filteredQuestions.length}
          </div>
        </div>

        <div className="p-7 space-y-6 flex-1">
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-snug break-keep">
            {activeQuestion
              ? activeQuestion.content
              : '질문을 선택해 주세요'}
          </h1>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-7 space-y-4">
              <VideoPlayer
                ref={playerRef}
                blob={activeRecording?.videoBlob || null}
                mimeType={activeRecording?.mimeType || 'video/webm'}
                fallbackDuration={activeRecording?.duration || 0}
                videoSize={activeRecording?.videoSize}
                downloadFileName={`interview-${formatDate(
                  activeRecording?.recordedAt,
                  false
                )}`}
                onDeleteVideo={
                  activeRecording?.videoBlob
                    ? handleDeleteVideoBlob
                    : undefined
                }
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  {attempts.length > 0 ? (
                    <>
                      <div className="relative inline-flex items-center">
                        <select
                          value={activeRecording?.id || ''}
                          onChange={(e) =>
                            setSelectedRecordingId(e.target.value)
                          }
                          aria-label="시도 회차 선택"
                          className="appearance-none bg-transparent pr-6 py-1 text-sm font-bold text-slate-900 cursor-pointer focus:outline-none"
                        >
                          {attempts.map((att, idx) => (
                            <option key={att.id} value={att.id}>
                              시도 {idx + 1}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="h-4 w-4 text-slate-500 absolute right-0 pointer-events-none" />
                      </div>

                      <span className="h-3.5 w-[1px] bg-slate-200" />

                      <span className="text-xs font-medium text-slate-500">
                        {formatMonthDayTime(activeRecording?.recordedAt)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      아직 녹화된 시도가 없습니다
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      activeQuestion
                        ? `/studio?questionId=${activeQuestion.id}`
                        : '/studio'
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
                  <span>다시 녹화</span>
                </button>
              </div>
            </div>

            <div className="xl:col-span-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between min-h-[410px] shadow-2xs">
              <div>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    피드백 메모
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddTimestampMemo}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>현재 시간에 메모</span>
                  </button>
                </div>

                <div className="p-4 space-y-2.5 max-h-[220px] overflow-y-auto">
                  {timestampMemos.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-slate-400">
                        영상을 재생하며 <strong>[+ 현재 시간에 메모]</strong>를 눌러 구간별 피드백을 남겨보세요.
                      </p>
                    </div>
                  ) : (
                    timestampMemos.map((memo) => (
                      <div
                        key={memo.id}
                        className="flex items-center gap-2 group"
                      >
                        <button
                          type="button"
                          onClick={() => playerRef.current?.seekTo(memo.time)}
                          className="rounded-md bg-[#EEF4FF] hover:bg-blue-100 px-2.5 py-1.5 text-xs font-mono font-bold text-blue-600 transition-colors shrink-0"
                          title="클릭하여 해당 시간으로 이동"
                        >
                          {formatDuration(memo.time)}
                        </button>

                        <input
                          type="text"
                          value={memo.text}
                          onChange={(e) =>
                            handleUpdateTimestampMemo(memo.id, e.target.value)
                          }
                          placeholder="이 구간의 피드백 메모 입력..."
                          className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />

                        <button
                          type="button"
                          onClick={() => handleDeleteTimestampMemo(memo.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                          title="메모 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowDetailedScores((v) => !v)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                      <span>5점 척도 자가진단 (평균 ★ {avgScore})</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          showDetailedScores ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {showDetailedScores && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                      {COMPACT_METRICS.map((m) => {
                        const val = scores[m.key];
                        return (
                          <div
                            key={m.key}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-700">
                              {m.label}
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((pt) => (
                                <button
                                  key={pt}
                                  type="button"
                                  onClick={() =>
                                    setScores((prev) => ({
                                      ...prev,
                                      [m.key]: pt,
                                    }))
                                  }
                                  className="p-0.5"
                                >
                                  <Star
                                    className={`h-3.5 w-3.5 ${
                                      pt <= val
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="다음 답변에서 바꿀 점"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />

                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    {saveToast && (
                      <span className="text-xs font-semibold text-emerald-600">
                        ✓ {saveToast}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveMemos}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
                  >
                    메모 저장
                  </button>
                </div>
              </div>
            </div>
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
        onAdded={(newId) => handleSelectQuestion(newId)}
      />
    </div>
  );
}
