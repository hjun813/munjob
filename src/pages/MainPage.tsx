import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Video,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Plus,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
  UserCheck,
  Mic,
  ArrowUpRight,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface MockupMemo {
  id: string;
  time: number;
  text: string;
}

interface MockupQuestionItem {
  id: string;
  shortTitle: string;
  fullTitle: string;
  done: boolean;
  duration: number;
  initialTime: number;
  recordedDate: string;
  attempt: number;
  memos: MockupMemo[];
  improvementPlaceholder: string;
}

const MOCKUP_QUESTIONS: MockupQuestionItem[] = [
  {
    id: 'q-sample-1',
    shortTitle: '자기소개를 해주세요',
    fullTitle: '1분 자기소개를 해주세요.',
    done: true,
    duration: 64,
    initialTime: 21,
    recordedDate: '11월 14일 19:15',
    attempt: 3,
    memos: [
      { id: 'm1', time: 12, text: '핵심 역량 키워드 먼저 제시하기' },
      { id: 'm2', time: 38, text: '트래픽 개선 수치 명확히 언급' },
    ],
    improvementPlaceholder: '도입부 시선 처리를 카메라 중앙으로 고정하기',
  },
  {
    id: 'q-sample-2',
    shortTitle: '지원 동기를 설명해 주세요',
    fullTitle: '우리 회사에 지원한 동기를 설명해 주세요.',
    done: true,
    duration: 78,
    initialTime: 32,
    recordedDate: '11월 15일 20:10',
    attempt: 2,
    memos: [
      { id: 'm3', time: 18, text: '회사 기술 블로그 사례와 내 경험 연결' },
      { id: 'm4', time: 51, text: '입사 후 기여할 수 있는 부분 강조' },
    ],
    improvementPlaceholder: '마무리 문장을 더 간결하고 확신 있게 끝내기',
  },
  {
    id: 'q-sample-3',
    shortTitle: '인덱스가 있어도 OFFSET이 느린 이유는?',
    fullTitle: '인덱스가 있어도 OFFSET이 느린 이유는?',
    done: false,
    duration: 74,
    initialTime: 28,
    recordedDate: '11월 15일 21:42',
    attempt: 2,
    memos: [
      { id: 'm5', time: 16, text: '결론부터 말하기' },
      { id: 'm6', time: 42, text: '예시를 들어 설명하기' },
    ],
    improvementPlaceholder: '다음 답변에서 바꿀 점',
  },
  {
    id: 'q-sample-4',
    shortTitle: '커서 방식은 어떻게 동작하나요?',
    fullTitle: '커서(Cursor) 기반 페이지네이션 방식은 어떻게 동작하나요?',
    done: false,
    duration: 68,
    initialTime: 24,
    recordedDate: '11월 15일 21:55',
    attempt: 1,
    memos: [
      { id: 'm7', time: 14, text: 'WHERE 절 정렬 키 탐색 원리 설명' },
      { id: 'm8', time: 45, text: '복합 인덱스 설정 시 주의점 덧붙이기' },
    ],
    improvementPlaceholder: '시간 복잡도 O(1) 비교를 초반에 언급하기',
  },
  {
    id: 'q-sample-5',
    shortTitle: '캐시 정합성은 어떻게 유지했나요?',
    fullTitle: 'DB와 Redis 캐시 간의 데이터 정합성은 어떻게 유지했나요?',
    done: false,
    duration: 82,
    initialTime: 35,
    recordedDate: '11월 16일 10:20',
    attempt: 2,
    memos: [
      { id: 'm9', time: 19, text: 'Look-aside 패턴 선택 이유 설명' },
      { id: 'm10', time: 54, text: 'TTL 만료 및 캐시 무효화 시점 정리' },
    ],
    improvementPlaceholder: '장애 상황에서의 Fallback 처리도 함께 설명하기',
  },
  {
    id: 'q-sample-6',
    shortTitle: '트랜잭션의 격리 수준은 무엇인가요?',
    fullTitle: 'DB 트랜잭션의 격리 수준과 각각의 이상 현상을 설명해 주세요.',
    done: false,
    duration: 90,
    initialTime: 40,
    recordedDate: '11월 16일 11:05',
    attempt: 1,
    memos: [
      { id: 'm11', time: 22, text: 'Repeatable Read와 Phantom Read 비교' },
      { id: 'm12', time: 60, text: 'MySQL InnoDB MVCC 동작 원리 연결' },
    ],
    improvementPlaceholder: '4단계 격리 수준을 표처럼 순서대로 구조화해 말하기',
  },
];

export function MainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryQuestionId = searchParams.get('questionId');
  const queryCategoryId = searchParams.get('categoryId');

  // Interactive Mockup States
  const [mockupTab, setMockupTab] = useState<'records' | 'studio'>('records');
  const [activeMockupId, setActiveMockupId] = useState<string>('q-sample-3');
  const [isPlayingMockup, setIsPlayingMockup] = useState<boolean>(false);
  const [isMutedMockup, setIsMutedMockup] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(28);
  const [activeMemoId, setActiveMemoId] = useState<string | null>(null);
  const [customMemosByQuestion, setCustomMemosByQuestion] = useState<
    Record<string, MockupMemo[]>
  >(() =>
    Object.fromEntries(MOCKUP_QUESTIONS.map((q) => [q.id, [...q.memos]]))
  );
  const [improvementNote, setImprovementNote] = useState<string>('');
  const [mockupToast, setMockupToast] = useState<string>('');

  const activeMockupQuestion =
    MOCKUP_QUESTIONS.find((q) => q.id === activeMockupId) ||
    MOCKUP_QUESTIONS[2];

  const currentMemos =
    customMemosByQuestion[activeMockupQuestion.id] ||
    activeMockupQuestion.memos;

  useEffect(() => {
    if (queryQuestionId || queryCategoryId) {
      const qs = searchParams.toString();
      navigate(`/studio${qs ? `?${qs}` : ''}`, { replace: true });
    }
  }, [queryQuestionId, queryCategoryId, searchParams, navigate]);

  // Simulate video playback timer when user clicks Play in the mockup
  useEffect(() => {
    if (!isPlayingMockup) return;
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev + 1 >= activeMockupQuestion.duration) {
          setIsPlayingMockup(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlayingMockup, activeMockupQuestion.duration]);

  const handleSelectMockupQuestion = (q: MockupQuestionItem) => {
    setActiveMockupId(q.id);
    setCurrentTime(q.initialTime);
    setIsPlayingMockup(false);
    setActiveMemoId(null);
    setImprovementNote('');
    setMockupToast('');
  };

  const handleSeekMockup = (sec: number, memoId?: string) => {
    setCurrentTime(sec);
    if (memoId) {
      setActiveMemoId(memoId);
      window.setTimeout(() => {
        setActiveMemoId((prev) => (prev === memoId ? null : prev));
      }, 1500);
    }
  };

  const handleAddMockupMemo = () => {
    const newMemo: MockupMemo = {
      id: `memo-${Date.now()}`,
      time: currentTime,
      text: '이 구간 답변 보완하기',
    };
    setCustomMemosByQuestion((prev) => {
      const list = prev[activeMockupQuestion.id] || [];
      return {
        ...prev,
        [activeMockupQuestion.id]: [...list, newMemo].sort(
          (a, b) => a.time - b.time
        ),
      };
    });
    setActiveMemoId(newMemo.id);
  };

  const handleUpdateMockupMemo = (id: string, text: string) => {
    setCustomMemosByQuestion((prev) => ({
      ...prev,
      [activeMockupQuestion.id]: (prev[activeMockupQuestion.id] || []).map(
        (m) => (m.id === id ? { ...m, text } : m)
      ),
    }));
  };

  const handleDeleteMockupMemo = (id: string) => {
    setCustomMemosByQuestion((prev) => ({
      ...prev,
      [activeMockupQuestion.id]: (prev[activeMockupQuestion.id] || []).filter(
        (m) => m.id !== id
      ),
    }));
  };

  const handleSaveMockupMemo = () => {
    setMockupToast('피드백 메모가 저장되었습니다');
    window.setTimeout(() => setMockupToast(''), 2200);
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, (currentTime / activeMockupQuestion.duration) * 100)
  );

  return (
    <div className="flex-1 flex flex-col justify-between bg-white min-h-[calc(100vh-3.75rem)]">
      {/* Main Hero Section */}
      <section className="flex-1 flex items-center px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="max-w-[1380px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Copy & CTA */}
          <div className="lg:col-span-5 space-y-6 animate-fade-in-up">
            <h1 className="text-[36px] sm:text-[44px] xl:text-[50px] font-extrabold tracking-tight text-slate-900 leading-[1.24] break-keep">
              면접 전에,
              <br />
              내 답변을 먼저 봅니다.
            </h1>

            <p className="text-base sm:text-[18px] text-slate-600 leading-[1.65] font-medium break-keep">
              질문을 골라 답변을 녹화하고,
              <br />
              다시 보면서 다음 답변에서 바꿀 점을 적어보세요.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(`/studio?questionId=${activeMockupQuestion.id}`)
                }
                className="group inline-flex items-center gap-3 rounded-xl bg-[#0B50E8] hover:bg-[#0942C2] active:scale-[0.98] px-8 py-4 text-base sm:text-[18px] font-bold text-white shadow-[0_8px_20px_rgba(11,80,232,0.25)] hover:shadow-[0_12px_28px_rgba(11,80,232,0.34)] transition-all cursor-pointer"
              >
                <span>연습 시작하기</span>
                <ChevronRight className="h-5 w-5 stroke-[2.5] transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right Interactive Product Preview Mockup Window */}
          <div className="lg:col-span-7 animate-fade-in-up">
            <div className="rounded-2xl border border-slate-200/95 bg-[#F6F8FB] shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden transition-all duration-300 hover:shadow-[0_26px_65px_rgba(11,80,232,0.12)] hover:border-blue-200/90">
              {/* Mockup App Header */}
              <div className="h-11 bg-white border-b border-slate-200/90 px-4 flex items-center justify-between gap-4">
                <div className="flex items-center h-full gap-6">
                  <div className="flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-[#0B50E8] stroke-[2.3]" />
                    <span className="text-[13px] font-extrabold tracking-tight text-slate-900">
                      Interview Lab
                    </span>
                  </div>

                  <div className="flex items-center h-full gap-5 text-xs">
                    <button
                      type="button"
                      onClick={() => setMockupTab('studio')}
                      className={`relative h-full inline-flex items-center transition-colors cursor-pointer ${
                        mockupTab === 'studio'
                          ? 'text-[#0B50E8] font-bold'
                          : 'text-slate-500 hover:text-slate-800 font-medium'
                      }`}
                    >
                      연습실
                      {mockupTab === 'studio' && (
                        <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-t-full bg-[#0B50E8]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMockupTab('records')}
                      className={`relative h-full inline-flex items-center transition-colors cursor-pointer ${
                        mockupTab === 'records'
                          ? 'text-[#0B50E8] font-bold'
                          : 'text-slate-500 hover:text-slate-800 font-medium'
                      }`}
                    >
                      연습 기록
                      {mockupTab === 'records' && (
                        <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-t-full bg-[#0B50E8]" />
                      )}
                    </button>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                  <Sparkles className="h-3 w-3 text-[#0B50E8]" />
                  질문과 타임스탬프를 클릭해 보세요
                </span>
              </div>

              {/* Mockup Body */}
              <div className="p-3 sm:p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Mockup Left Question List */}
                <div className="md:col-span-4 rounded-xl border border-slate-200/90 bg-white flex flex-col overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      질문 목록
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('/questions')}
                      className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition-colors cursor-pointer"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      추가
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 text-[11px]">
                    {MOCKUP_QUESTIONS.map((q) => {
                      const isActive = q.id === activeMockupQuestion.id;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => handleSelectMockupQuestion(q)}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-2 border-l-[3px] transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#EBF2FF] border-l-[#0B50E8] text-slate-900 font-bold'
                              : 'bg-white border-l-transparent text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          {q.done && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-white fill-emerald-500 shrink-0" />
                          )}
                          <span className="leading-snug">{q.shortTitle}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mockup Right Content Area */}
                <div className="md:col-span-8 rounded-xl border border-slate-200/90 bg-white flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <div className="flex items-center gap-1">
                      <ChevronLeft className="h-3 w-3 text-slate-400" />
                      <span>
                        {mockupTab === 'records'
                          ? '연습 기록'
                          : '백엔드 기술 면접 연습실'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          mockupTab === 'records'
                            ? `/records?questionId=${activeMockupQuestion.id}`
                            : `/studio?questionId=${activeMockupQuestion.id}`
                        )
                      }
                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#0B50E8] hover:underline cursor-pointer"
                    >
                      <span>전체 화면으로 열기</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>

                  {mockupTab === 'records' ? (
                    <div className="p-3.5 sm:p-4 space-y-3">
                      <h3 className="text-sm sm:text-[16px] font-extrabold text-slate-900 tracking-tight">
                        {activeMockupQuestion.fullTitle}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                        {/* Mockup Video Player Column */}
                        <div className="sm:col-span-7 flex flex-col justify-between gap-2.5">
                          <div
                            onClick={() => setIsPlayingMockup((v) => !v)}
                            className="group/video relative rounded-lg overflow-hidden bg-slate-900 aspect-[4/3] border border-slate-200 cursor-pointer"
                          >
                            <img
                              src="/hero-video-thumb.jpg"
                              alt="면접 답변 녹화 복기 화면"
                              className={`h-full w-full object-cover transition-transform duration-500 ${
                                isPlayingMockup
                                  ? 'scale-[1.02]'
                                  : 'group-hover/video:scale-[1.01]'
                              }`}
                            />

                            {/* Center Play Pulse on Hover */}
                            <div
                              className={`absolute inset-0 flex items-center justify-center bg-black/15 transition-opacity ${
                                isPlayingMockup
                                  ? 'opacity-0 hover:opacity-100'
                                  : 'opacity-0 group-hover/video:opacity-100'
                              }`}
                            >
                              <div className="h-10 w-10 rounded-full bg-black/65 text-white flex items-center justify-center shadow-lg backdrop-blur-xs">
                                {isPlayingMockup ? (
                                  <Pause className="h-4 w-4 fill-current" />
                                ) : (
                                  <Play className="h-4 w-4 fill-current ml-0.5" />
                                )}
                              </div>
                            </div>

                            {/* Video Player Bottom Overlay Bar */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent pt-5 pb-2 px-2.5 flex items-center gap-2"
                            >
                              <button
                                type="button"
                                onClick={() => setIsPlayingMockup((v) => !v)}
                                className="text-white hover:text-blue-400 transition-colors shrink-0 cursor-pointer"
                                aria-label={isPlayingMockup ? '일시정지' : '재생'}
                              >
                                {isPlayingMockup ? (
                                  <Pause className="h-3.5 w-3.5 fill-current" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                )}
                              </button>

                              <span className="text-[10px] font-mono font-medium text-white/95 shrink-0">
                                {formatDuration(currentTime)} /{' '}
                                {formatDuration(activeMockupQuestion.duration)}
                              </span>

                              <div className="relative flex-1 h-1.5 rounded-full bg-white/30 flex items-center">
                                <div
                                  className="h-full rounded-full bg-[#0B50E8] transition-all duration-200"
                                  style={{ width: `${progressPercent}%` }}
                                />
                                <input
                                  type="range"
                                  min={0}
                                  max={activeMockupQuestion.duration}
                                  value={currentTime}
                                  onChange={(e) =>
                                    setCurrentTime(Number(e.target.value))
                                  }
                                  aria-label="프리뷰 재생 위치 조절"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div
                                  className="pointer-events-none absolute -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-white shadow transition-all duration-200"
                                  style={{ left: `${progressPercent}%` }}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => setIsMutedMockup((v) => !v)}
                                className="text-white/90 hover:text-white shrink-0 cursor-pointer"
                                aria-label="음소거 토글"
                              >
                                {isMutedMockup ? (
                                  <VolumeX className="h-3.5 w-3.5" />
                                ) : (
                                  <Volume2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/records?questionId=${activeMockupQuestion.id}`
                                  )
                                }
                                className="text-white/90 hover:text-white shrink-0 cursor-pointer"
                                title="연습 기록 페이지에서 크게 보기"
                              >
                                <Maximize className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                                시도 {activeMockupQuestion.attempt}
                                <ChevronDown className="h-3 w-3 text-slate-500" />
                              </span>
                              <span className="h-3 w-[1px] bg-slate-200" />
                              <span className="text-slate-500 font-medium">
                                {activeMockupQuestion.recordedDate}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/studio?questionId=${activeMockupQuestion.id}`
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-2.5 w-2.5 text-slate-500" />
                              다시 녹화
                            </button>
                          </div>
                        </div>

                        {/* Mockup Feedback Memo Column */}
                        <div className="sm:col-span-5 rounded-lg border border-slate-200 bg-white flex flex-col justify-between p-2.5">
                          <div>
                            <div className="pb-2 border-b border-slate-100 flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900">
                                피드백 메모
                              </span>
                              <button
                                type="button"
                                onClick={handleAddMockupMemo}
                                className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 hover:text-[#0B50E8] px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-600 transition-colors cursor-pointer"
                              >
                                <Plus className="h-2.5 w-2.5" />
                                현재 시간에 메모
                              </button>
                            </div>

                            <div className="py-2.5 space-y-1.5 max-h-[115px] overflow-y-auto">
                              {currentMemos.map((memo) => {
                                const isHighlighted = activeMemoId === memo.id;
                                return (
                                  <div
                                    key={memo.id}
                                    className="flex items-center gap-1.5"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSeekMockup(memo.time, memo.id)
                                      }
                                      className={`rounded px-1.5 py-1 text-[10px] font-mono font-bold transition-colors shrink-0 cursor-pointer ${
                                        isHighlighted
                                          ? 'bg-[#0B50E8] text-white'
                                          : 'bg-[#EBF2FF] hover:bg-blue-100 text-[#0B50E8]'
                                      }`}
                                      title="클릭하여 해당 시점으로 이동"
                                    >
                                      {formatDuration(memo.time)}
                                    </button>
                                    <input
                                      type="text"
                                      value={memo.text}
                                      onChange={(e) =>
                                        handleUpdateMockupMemo(
                                          memo.id,
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 min-w-0 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-800 focus:outline-none focus:border-[#0B50E8]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteMockupMemo(memo.id)
                                      }
                                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                                      title="메모 삭제"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <textarea
                              rows={2}
                              value={improvementNote}
                              onChange={(e) =>
                                setImprovementNote(e.target.value)
                              }
                              placeholder={
                                activeMockupQuestion.improvementPlaceholder
                              }
                              className="w-full rounded-md border border-slate-200 bg-slate-50/50 p-2 text-[10px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0B50E8] resize-none"
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] font-semibold text-emerald-600">
                                {mockupToast ? `✓ ${mockupToast}` : ''}
                              </span>
                              <button
                                type="button"
                                onClick={handleSaveMockupMemo}
                                className="rounded-md bg-[#0B50E8] hover:bg-[#0942C2] active:scale-95 px-2.5 py-1 text-[10px] font-bold text-white transition-all cursor-pointer"
                              >
                                메모 저장
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Interactive Studio Mode Preview inside Mockup */
                    <div className="p-3.5 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm sm:text-[16px] font-extrabold text-slate-900 tracking-tight truncate">
                          {activeMockupQuestion.fullTitle}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0B50E8] shrink-0">
                          <UserCheck className="h-3 w-3" />
                          실전 면접관 모드 지원
                        </span>
                      </div>

                      <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[16/9] border border-slate-200">
                        <img
                          src="/hero-video-thumb.jpg"
                          alt="연습실 미리보기"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-red-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          REC 00:28
                        </div>
                        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/65 backdrop-blur-xs px-2.5 py-1 text-[10px] font-medium text-white">
                          <Mic className="h-3 w-3 text-emerald-400" />
                          마이크 입력 정상 · 카메라 미러링 ON
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500 font-medium">
                          내 화면을 보거나 AI 면접관과 실전처럼 연습할 수 있습니다.
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/studio?questionId=${activeMockupQuestion.id}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B50E8] hover:bg-[#0942C2] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-xs transition-colors cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>이 질문으로 녹화 시작</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom 3-Column Feature Strip */}
      <section className="border-t border-slate-200/80 bg-[#F5F7FA] px-4 sm:px-6 lg:px-8 py-6 lg:py-7">
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/90">
          {/* 1. 질문 준비 */}
          <Link
            to="/questions"
            className="group flex items-start justify-between gap-4 py-4 md:py-1 md:pr-8 lg:pr-12 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#0B50E8] text-[#0B50E8] bg-white shadow-2xs transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:bg-[#0B50E8] group-hover:text-white">
                <div className="space-y-1">
                  <span className="block h-[2px] w-3.5 bg-current rounded-full" />
                  <span className="block h-[2px] w-3.5 bg-current rounded-full" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-[19px] font-extrabold text-slate-900 tracking-tight group-hover:text-[#0B50E8] transition-colors">
                  질문 준비
                </h2>
                <p className="text-sm sm:text-[15px] text-slate-600 font-medium">
                  연습할 질문을 직접 추가해요.
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0B50E8] group-hover:translate-x-0.5 transition-all mt-1.5 shrink-0" />
          </Link>

          {/* 2. 답변 녹화 */}
          <Link
            to="/studio"
            className="group flex items-start justify-between gap-4 py-4 md:py-1 md:px-8 lg:px-12 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-[#0B50E8] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
                <Video className="h-7 w-7 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-[19px] font-extrabold text-slate-900 tracking-tight group-hover:text-[#0B50E8] transition-colors">
                  답변 녹화
                </h2>
                <p className="text-sm sm:text-[15px] text-slate-600 font-medium">
                  카메라와 마이크로 답변을 남겨요.
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0B50E8] group-hover:translate-x-0.5 transition-all mt-1.5 shrink-0" />
          </Link>

          {/* 3. 영상 복기 */}
          <Link
            to="/records"
            className="group flex items-start justify-between gap-4 py-4 md:py-1 md:pl-8 lg:pl-12 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#0B50E8] text-[#0B50E8] bg-white shadow-2xs transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:bg-[#0B50E8] group-hover:text-white">
                <Play className="h-4 w-4 fill-current ml-0.5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-[19px] font-extrabold text-slate-900 tracking-tight group-hover:text-[#0B50E8] transition-colors">
                  영상 복기
                </h2>
                <p className="text-sm sm:text-[15px] text-slate-600 font-medium">
                  영상의 특정 시점에 메모를 남겨요.
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0B50E8] group-hover:translate-x-0.5 transition-all mt-1.5 shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  );
}
