import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Video,
  Play,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Plus,
  RotateCcw,
  Trash2,
  Volume2,
  Maximize,
} from 'lucide-react';

const MOCKUP_QUESTIONS = [
  { id: 'q-sample-1', title: '자기소개를 해주세요', done: true, active: false },
  {
    id: 'q-sample-2',
    title: '지원 동기를 설명해 주세요',
    done: true,
    active: false,
  },
  {
    id: 'q-sample-3',
    title: '인덱스가 있어도 OFFSET이 느린 이유는?',
    done: false,
    active: true,
  },
  {
    id: 'q-sample-4',
    title: '커서 방식은 어떻게 동작하나요?',
    done: false,
    active: false,
  },
  {
    id: 'q-sample-5',
    title: '캐시 정합성은 어떻게 유지했나요?',
    done: false,
    active: false,
  },
  {
    id: 'q-sample-6',
    title: '트랜잭션의 격리 수준은 무엇인가요?',
    done: false,
    active: false,
  },
];

export function MainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryQuestionId = searchParams.get('questionId');
  const queryCategoryId = searchParams.get('categoryId');

  useEffect(() => {
    if (queryQuestionId || queryCategoryId) {
      const qs = searchParams.toString();
      navigate(`/studio${qs ? `?${qs}` : ''}`, { replace: true });
    }
  }, [queryQuestionId, queryCategoryId, searchParams, navigate]);

  return (
    <div className="flex-1 flex flex-col justify-between bg-white">
      {/* Main Hero Section */}
      <section className="flex-1 flex items-center px-4 sm:px-6 lg:px-10 py-10 lg:py-16">
        <div className="max-w-[1360px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Copy & CTA */}
          <div className="lg:col-span-5 space-y-6">
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

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/studio')}
                className="inline-flex items-center gap-3 rounded-xl bg-[#0B50E8] hover:bg-[#0942C2] px-8 py-4 text-base sm:text-[18px] font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                <span>연습 시작하기</span>
                <ChevronRight className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Right Product Preview Mockup Window */}
          <div className="lg:col-span-7">
            <div
              onClick={() => navigate('/records?questionId=q-sample-3')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('/records?questionId=q-sample-3');
                }
              }}
              title="클릭하여 실제 연습 기록 화면 열기"
              className="group rounded-2xl border border-slate-200/95 bg-[#F6F8FB] shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden transition-all hover:shadow-[0_24px_60px_rgba(11,80,232,0.12)] hover:border-blue-200 cursor-pointer select-none"
            >
              {/* Mockup App Header */}
              <div className="h-11 bg-white border-b border-slate-200/90 px-4 flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-[#0B50E8] stroke-[2.3]" />
                  <span className="text-[13px] font-extrabold tracking-tight text-slate-900">
                    Interview Lab
                  </span>
                </div>

                <div className="flex items-center h-full gap-5 text-xs">
                  <span className="text-slate-500 font-medium">연습실</span>
                  <span className="relative h-full inline-flex items-center text-[#0B50E8] font-bold">
                    연습 기록
                    <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-t-full bg-[#0B50E8]" />
                  </span>
                </div>
              </div>

              {/* Mockup Body */}
              <div className="p-3 sm:p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Mockup Left Question List */}
                <div className="md:col-span-4 rounded-xl border border-slate-200/90 bg-white flex flex-col overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      질문 목록
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      <Plus className="h-2.5 w-2.5" />
                      추가
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-[11px]">
                    {MOCKUP_QUESTIONS.map((q) => (
                      <div
                        key={q.id}
                        className={`px-3 py-2.5 flex items-center gap-2 border-l-[3px] ${
                          q.active
                            ? 'bg-[#EBF2FF] border-l-[#0B50E8] text-slate-900 font-bold'
                            : 'bg-white border-l-transparent text-slate-700 font-medium'
                        }`}
                      >
                        {q.done && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white fill-emerald-500 shrink-0" />
                        )}
                        <span className="leading-snug">{q.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mockup Right Records & Feedback Panel */}
                <div className="md:col-span-8 rounded-xl border border-slate-200/90 bg-white flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                    <ChevronLeft className="h-3 w-3 text-slate-400" />
                    <span>연습 기록</span>
                  </div>

                  <div className="p-3.5 sm:p-4 space-y-3">
                    <h3 className="text-sm sm:text-[16px] font-extrabold text-slate-900 tracking-tight">
                      인덱스가 있어도 OFFSET이 느린 이유는?
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                      {/* Mockup Video Player Column */}
                      <div className="sm:col-span-7 flex flex-col justify-between gap-2.5">
                        <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-[4/3] border border-slate-200">
                          <img
                            src="/hero-video-thumb.jpg"
                            alt="면접 답변 녹화 복기 화면"
                            className="h-full w-full object-cover"
                          />

                          {/* Video Player Bottom Overlay Bar */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent pt-5 pb-2 px-2.5 flex items-center gap-2">
                            <Play className="h-3.5 w-3.5 text-white fill-white shrink-0" />
                            <span className="text-[10px] font-mono font-medium text-white/95 shrink-0">
                              00:28 / 01:14
                            </span>

                            <div className="relative flex-1 h-1 rounded-full bg-white/30 flex items-center">
                              <div className="h-full w-[42%] rounded-full bg-[#0B50E8]" />
                              <div className="absolute left-[42%] -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-white shadow" />
                            </div>

                            <Volume2 className="h-3.5 w-3.5 text-white/90 shrink-0" />
                            <Maximize className="h-3 w-3 text-white/90 shrink-0" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                              시도 2
                              <ChevronDown className="h-3 w-3 text-slate-500" />
                            </span>
                            <span className="h-3 w-[1px] bg-slate-200" />
                            <span className="text-slate-500 font-medium">
                              11월 15일 21:42
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-2xs">
                            <RotateCcw className="h-2.5 w-2.5 text-slate-500" />
                            다시 녹화
                          </span>
                        </div>
                      </div>

                      {/* Mockup Feedback Memo Column */}
                      <div className="sm:col-span-5 rounded-lg border border-slate-200 bg-white flex flex-col justify-between p-2.5">
                        <div>
                          <div className="pb-2 border-b border-slate-100 flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900">
                              피드백 메모
                            </span>
                            <span className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-600">
                              <Plus className="h-2.5 w-2.5" />
                              현재 시간에 메모
                            </span>
                          </div>

                          <div className="py-2.5 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-[#EBF2FF] px-1.5 py-1 text-[10px] font-mono font-bold text-[#0B50E8] shrink-0">
                                00:16
                              </span>
                              <div className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-800 truncate">
                                결론부터 말하기
                              </div>
                              <Trash2 className="h-3 w-3 text-slate-400 shrink-0" />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-[#EBF2FF] px-1.5 py-1 text-[10px] font-mono font-bold text-[#0B50E8] shrink-0">
                                00:42
                              </span>
                              <div className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-800 truncate">
                                예시를 들어 설명하기
                              </div>
                              <Trash2 className="h-3 w-3 text-slate-400 shrink-0" />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="h-12 rounded-md border border-slate-200 bg-slate-50/50 p-2 text-[10px] text-slate-400">
                            다음 답변에서 바꿀 점
                          </div>
                          <div className="flex justify-end">
                            <span className="rounded-md bg-[#0B50E8] px-2.5 py-1 text-[10px] font-bold text-white">
                              메모 저장
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom 3-Column Feature Strip */}
      <section className="border-t border-slate-200/80 bg-[#F5F7FA] px-4 sm:px-6 lg:px-10 py-8 lg:py-11">
        <div className="max-w-[1360px] mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/90">
          {/* 1. 질문 준비 */}
          <Link
            to="/questions"
            className="group flex items-start gap-4 py-4 md:py-1 md:pr-8 lg:pr-12 transition-opacity hover:opacity-85"
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#0B50E8] text-[#0B50E8] bg-white">
              <div className="space-y-1">
                <span className="block h-[2px] w-3.5 bg-[#0B50E8] rounded-full" />
                <span className="block h-[2px] w-3.5 bg-[#0B50E8] rounded-full" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg sm:text-[19px] font-extrabold text-slate-900 tracking-tight">
                질문 준비
              </h2>
              <p className="text-sm sm:text-[15px] text-slate-600 font-medium">
                연습할 질문을 직접 추가해요.
              </p>
            </div>
          </Link>

          {/* 2. 답변 녹화 */}
          <Link
            to="/studio"
            className="group flex items-start gap-4 py-4 md:py-1 md:px-8 lg:px-12 transition-opacity hover:opacity-85"
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-[#0B50E8]">
              <Video className="h-7 w-7 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg sm:text-[19px] font-extrabold text-slate-900 tracking-tight">
                답변 녹화
              </h2>
              <p className="text-sm sm:text-[15px] text-slate-600 font-medium">
                카메라와 마이크로 답변을 남겨요.
              </p>
            </div>
          </Link>

          {/* 3. 영상 복기 */}
          <Link
            to="/records"
            className="group flex items-start gap-4 py-4 md:py-1 md:pl-8 lg:pl-12 transition-opacity hover:opacity-85"
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#0B50E8] text-[#0B50E8] bg-white">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg sm:text-[19px] font-extrabold text-slate-900 tracking-tight">
                영상 복기
              </h2>
              <p className="text-sm sm:text-[15px] text-slate-600 font-medium">
                영상의 특정 시점에 메모를 남겨요.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
