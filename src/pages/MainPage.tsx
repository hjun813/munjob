import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Video,
  Play,
  BookOpen,
  ListChecks,
  History,
  LayoutDashboard,
  Sparkles,
  CheckCircle2,
  Clock,
  Mic,
  ArrowRight,
  Star,
  ShieldCheck,
  Layers,
  StickyNote,
  UserCheck,
  LogIn,
} from 'lucide-react';
import { db, getCategoryColorClasses } from '@/db/database';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateAverageScore } from '@/lib/utils';

export function MainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryQuestionId = searchParams.get('questionId');
  const queryCategoryId = searchParams.get('categoryId');

  const { currentUser } = useAuthStore();
  const [selectedCatId, setSelectedCatId] = useState<string>('all');

  useEffect(() => {
    if (queryQuestionId || queryCategoryId) {
      const qs = searchParams.toString();
      navigate(`/studio${qs ? `?${qs}` : ''}`, { replace: true });
    }
  }, [queryQuestionId, queryCategoryId, searchParams, navigate]);

  const data = useLiveQuery(async () => {
    const [categories, questions, recordings, feedbacks] = await Promise.all([
      db.categories.orderBy('createdAt').toArray(),
      db.questions.orderBy('createdAt').toArray(),
      db.recordings.toArray(),
      db.feedbacks.toArray(),
    ]);

    const practiceCountMap = new Map<string, number>();
    for (const r of recordings) {
      practiceCountMap.set(
        r.questionId,
        (practiceCountMap.get(r.questionId) || 0) + 1
      );
    }

    const scores = feedbacks
      .map((f) => calculateAverageScore(f))
      .filter((s): s is number => s !== null);

    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
          10
        : null;

    return {
      categories,
      questions,
      totalQuestions: questions.length,
      totalRecordings: recordings.length,
      totalFeedbacks: feedbacks.length,
      avgScore,
      practiceCountMap,
    };
  }, []);

  const categories = data?.categories || [];
  const questions = data?.questions || [];
  const practiceCountMap = data?.practiceCountMap || new Map<string, number>();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const previewQuestions = useMemo(() => {
    const filtered =
      selectedCatId === 'all'
        ? questions
        : questions.filter((q) => q.categoryId === selectedCatId);
    return filtered.slice(0, 6);
  }, [questions, selectedCatId]);

  const CORE_FEATURES = [
    {
      icon: ListChecks,
      color: 'bg-blue-100 text-blue-600',
      title: '맞춤형 질문 & 키워드 노트',
      description:
        '직무별 예상 질문을 카테고리별로 정리하고, 답변 시 잊지 말아야 할 핵심 키워드 메모를 함께 관리합니다.',
      link: '/questions',
      linkText: '질문 관리하기',
    },
    {
      icon: Video,
      color: 'bg-indigo-100 text-indigo-600',
      title: '실전 웹캠·화면공유 스튜디오',
      description:
        '카메라 좌우 반전, 실시간 마이크 감도 확인, 답변 제한 시간 타이머, 랜덤 출제로 실제 면접장 환경을 재현합니다.',
      link: '/studio',
      linkText: '연습실 열기',
    },
    {
      icon: Clock,
      color: 'bg-emerald-100 text-emerald-600',
      title: '타임스탬프 메모 & 회차 비교',
      description:
        '영상을 보며 특정 구간(00:16)에 피드백 메모를 남기고 클릭해 즉시 이동하며, 시도 1·시도 2 영상을 직접 비교합니다.',
      link: '/records',
      linkText: '연습 기록 보기',
    },
    {
      icon: ShieldCheck,
      color: 'bg-violet-100 text-violet-600',
      title: '100% 로컬 보안 & 파일 소장',
      description:
        '외부 서버 업로드 없이 내 브라우저(IndexedDB)에만 안전하게 보관되며, 언제든 영상 파일로 다운로드할 수 있습니다.',
      link: '/guide',
      linkText: '사용 가이드 보기',
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-blue-50/70 p-6 sm:p-10 lg:p-12 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                <span>셀프 면접 트레이닝 스튜디오</span>
              </div>
              {currentUser && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>
                    {currentUser.name}님 ({currentUser.targetRole}) 접속 중
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.2] break-keep">
                {currentUser ? (
                  <>
                    반가워요, <span className="text-blue-600">{currentUser.name}</span>님!
                    <br />
                    오늘도 실전처럼 면접을 연습해 볼까요?
                  </>
                ) : (
                  <>
                    혼자서도 실제 면접처럼,
                    <br />
                    <span className="text-blue-600">녹화하고 복기하며</span> 합격률을 높이세요
                  </>
                )}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl break-keep">
                머릿속으로만 생각하는 답변과 카메라 앞에서 직접 소리 내어 말하는 답변은 다릅니다.
                웹캠 녹화, 구간별 타임스탬프 피드백 메모, 시도 회차별 비교를 통해 내 답변을 가장 빠르게 개선하세요.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                size="lg"
                onClick={() => navigate('/studio')}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>연습실 바로 시작하기</span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/guide')}
                className="h-12 px-5 font-semibold"
              >
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>사용 가이드 보기</span>
              </Button>

              {!currentUser && (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('/login')}
                  className="h-12 px-5 font-semibold"
                >
                  <LogIn className="h-4 w-4 text-slate-700" />
                  <span>로그인 / 회원가입</span>
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                별도 설치 없는 웹 스튜디오
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                구간별 타임스탬프 피드백 메모
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                100% 브라우저 로컬 저장
              </span>
            </div>
          </div>

          {/* Right Interactive Preview Mockup Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 sm:p-5 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">
                    REC 01:14 / 02:00
                  </span>
                </div>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-[11px]">
                  백엔드 기술 면접 · 시도 2
                </Badge>
              </div>

              <div className="rounded-xl bg-slate-800/90 border border-slate-700/80 p-4 space-y-2">
                <p className="text-[11px] font-semibold text-blue-300">
                  Q. 인덱스가 있어도 OFFSET이 느린 이유는 무엇인가요?
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  참고 메모: 결론부터 말하기 / 인덱스가 읽고 건너뛰는 행을 예로 들기 / No-Offset(커서) 대안 언급
                </p>
              </div>

              {/* Timestamp Memo Preview */}
              <div className="rounded-xl bg-white text-slate-900 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    타임스탬프 피드백 메모
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    자가진단 평균 4.6
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 text-xs">
                    <span className="rounded bg-[#EEF4FF] px-2 py-0.5 font-mono font-bold text-blue-600 text-[11px]">
                      00:16
                    </span>
                    <span className="text-slate-700 font-medium truncate">
                      결론을 두괄식으로 명확하게 제시함
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 text-xs">
                    <span className="rounded bg-[#EEF4FF] px-2 py-0.5 font-mono font-bold text-blue-600 text-[11px]">
                      00:42
                    </span>
                    <span className="text-slate-700 font-medium truncate">
                      No-Offset 커서 페이지네이션 비교 설명 추가하기
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-emerald-400" />
                  마이크 입력 정상 · 좌우 반전 ON
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/studio')}
                  className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                >
                  <span>스튜디오 체험</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/questions"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>등록된 예상 질문</span>
            <ListChecks className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {data?.totalQuestions ?? 8}
              <span className="text-sm font-medium text-slate-500 ml-1">개</span>
            </p>
            <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
              관리 <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        <Link
          to="/records"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>누적 답변 녹화</span>
            <Video className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {data?.totalRecordings ?? 0}
              <span className="text-sm font-medium text-slate-500 ml-1">회</span>
            </p>
            <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
              기록 <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        <Link
          to="/records"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>작성한 피드백 메모</span>
            <History className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {data?.totalFeedbacks ?? 0}
              <span className="text-sm font-medium text-slate-500 ml-1">건</span>
            </p>
            <span className="text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
              복기 <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>

        <Link
          to="/dashboard"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>평균 자가진단 점수</span>
            <LayoutDashboard className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {data?.avgScore ? `★ ${data.avgScore}` : '-'}
              <span className="text-xs font-medium text-slate-400 ml-1">
                / 5.0
              </span>
            </p>
            <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors inline-flex items-center gap-0.5">
              대시보드 <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      </section>

      {/* Core Features Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              면접 준비에 꼭 필요한 핵심 기능
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              복잡한 설정 없이 질문 정리부터 실전 녹화, 구간별 피드백까지 한 번에 해결하세요.
            </p>
          </div>
          <Link
            to="/guide"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>상세 사용 가이드 보기</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CORE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <Card
                key={feat.title}
                className="hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center ${feat.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={feat.link}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      <span>{feat.linkText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick Practice Question Selector */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-1">
              <Layers className="h-3.5 w-3.5" />
              <span>QUICK PRACTICE</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              원하는 질문을 골라 지금 바로 녹화를 시작해 보세요
            </h2>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/questions')}
          >
            <ListChecks className="h-4 w-4 text-blue-600" />
            <span>전체 질문 관리 ({questions.length}개)</span>
          </Button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCatId('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedCatId === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 ({questions.length})
          </button>
          {categories.map((cat) => {
            const count = questions.filter((q) => q.categoryId === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCatId === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {previewQuestions.map((q) => {
            const cat = categoryMap.get(q.categoryId);
            const recCount = practiceCountMap.get(q.id) || 0;

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 flex flex-col justify-between gap-4 hover:border-blue-300 hover:bg-white transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${getCategoryColorClasses(
                        cat?.color
                      )}`}
                    >
                      {cat?.name || '기타'}
                    </span>
                    {recCount > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                        연습 {recCount}회 완료
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {q.content}
                  </h3>

                  {q.memo && (
                    <p className="text-xs text-slate-500 line-clamp-2 flex items-start gap-1.5">
                      <StickyNote className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{q.memo}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => navigate(`/records?questionId=${q.id}`)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    기록/메모 보기
                  </button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/studio?questionId=${q.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>이 질문 연습하기</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Guide & CTA Banner */}
      <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400">
            <BookOpen className="h-4 w-4" />
            <span>HOW TO USE INTERVIEW LAB</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            처음 이용하시나요? 3분 사용 가이드로 모든 기능을 마스터하세요
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            카메라·마이크 권한 설정부터 타임스탬프 피드백 작성법, 면접 전 자가점검 체크리스트까지 한눈에 확인할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            size="lg"
            onClick={() => navigate('/guide')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            <BookOpen className="h-4 w-4" />
            <span>사용 가이드 읽어보기</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/studio')}
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>연습실 열기</span>
          </Button>
        </div>
      </section>
    </div>
  );
}
