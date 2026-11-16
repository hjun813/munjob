import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
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

  const handlePrevQuestion = () => {
    if (currentIndex <= 0) return;
    const prevQ = filteredQuestions[currentIndex - 1];
    if (prevQ) handleSelectQuestion(prevQ.id);
  };

  const handleNextQuestion = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      const nextQ = filteredQuestions[currentIndex + 1];
      if (nextQ) handleSelectQuestion(nextQ.id);
    }
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
    <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:h-[calc(100vh-5.2rem)]">
      {/* 좌측: 질문 목록 & 카테고리 필터 */}
      <aside className="w-full lg:w-[275px] shrink-0 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col overflow-hidden max-h-[300px] lg:max-h-none">
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

            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#0B50E8] hover:bg-[#0942C2] px-2.5 py-1 text-[11px] font-bold text-white transition-colors cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>추가</span>
            </button>
          </div>

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

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredQuestions.map((q, idx) => {
            const isSelected = q.id === activeQuestion?.id;
            const recCount = recordingsByQuestion.get(q.id)?.length || 0;
            const displayLabel = q.shortTitle || q.content;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSelectQuestion(q.id)}
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
          })}
        </div>

        <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handlePrevQuestion}
            disabled={currentIndex <= 0}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>이전 질문</span>
          </button>
          <button
            type="button"
            onClick={handleNextQuestion}
            disabled={currentIndex >= filteredQuestions.length - 1}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span>다음 질문</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* 우측: 영상 복기 플레이어 & 타임스탬프 피드백 노트 */}
      <section className="flex-1 min-w-0 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col overflow-hidden">
        {/* 상단 질문 타이틀 & 시도 회차 선택 바 */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[11px] font-bold text-[#0B50E8]">
                Q{filteredQuestions.length > 0 ? currentIndex + 1 : 0}.{' '}
                {activeCategoryName}
              </span>
              {activeRecording && (
                <span className="text-xs font-medium text-slate-400">
                  녹화 일시: {formatMonthDayTime(activeRecording.recordedAt)}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-[21px] font-extrabold text-slate-900 tracking-tight leading-snug break-keep">
              {activeQuestion
                ? activeQuestion.content
                : '질문을 선택해 주세요'}
            </h1>
          </div>

          {/* 시도 회차 탭 & 다시 녹화 버튼 */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {attempts.length > 0 && (
              <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                {attempts.map((att, idx) => {
                  const isCurrent = att.id === activeRecording?.id;
                  return (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => setSelectedRecordingId(att.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0B50E8] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      시도 {idx + 1}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                navigate(
                  activeQuestion
                    ? `/studio?questionId=${activeQuestion.id}`
                    : '/studio'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#0B50E8]" />
              <span>다시 녹화</span>
            </button>
          </div>
        </div>

        {/* 본문: 좌측 영상 플레이어 (7) + 우측 피드백 메모장 (5) */}
        <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-full items-stretch">
            {/* 영상 플레이어 영역 */}
            <div className="xl:col-span-7 flex flex-col justify-center">
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
            </div>

            {/* 우측 피드백 메모장 */}
            <div className="xl:col-span-5 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col justify-between overflow-hidden shadow-2xs">
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="px-4 py-3 border-b border-slate-200/80 bg-white flex items-center justify-between gap-2 shrink-0">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    타임스탬프 피드백 메모
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddTimestampMemo}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 px-2.5 py-1 text-xs font-bold text-[#0B50E8] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>현재 시간에 메모</span>
                  </button>
                </div>

                <div className="flex-1 p-3.5 space-y-2 overflow-y-auto max-h-[240px]">
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
                          className="rounded-md bg-[#EEF4FF] hover:bg-blue-100 px-2.5 py-1.5 text-xs font-mono font-bold text-[#0B50E8] transition-colors shrink-0 cursor-pointer"
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
                          className="flex-1 h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B50E8]"
                        />

                        <button
                          type="button"
                          onClick={() => handleDeleteTimestampMemo(memo.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                          title="메모 삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 하단: 5점 척도 자가진단 & 다음 답변에서 바꿀 점 */}
              <div className="p-3.5 border-t border-slate-200/80 bg-white space-y-2.5 shrink-0">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowDetailedScores((v) => !v)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-[#0B50E8]" />
                      <span>5점 척도 자가진단 (평균 ★ {avgScore})</span>
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        showDetailedScores ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showDetailedScores && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 space-y-1.5">
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
                            <div className="flex items-center gap-0.5">
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
                                  className="p-0.5 cursor-pointer"
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
                  rows={2}
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="다음 답변에서 바꿀 점을 적어보세요"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white p-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B50E8] resize-none"
                />

                <div className="flex items-center justify-between">
                  <div>
                    {saveToast && (
                      <span className="text-xs font-bold text-emerald-600">
                        ✓ {saveToast}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveMemos}
                    className="rounded-xl bg-[#0B50E8] hover:bg-[#0942C2] active:scale-[0.98] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
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
