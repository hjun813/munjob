import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Play,
  ListChecks,
  History,
  Calendar,
  FileQuestion,
  Award,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
} from 'lucide-react';
import { db, getCategoryColorClasses } from '@/db/database';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  formatDate,
  formatDurationKorean,
  calculateAverageScore,
} from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();

  const data = useLiveQuery(async () => {
    const [questions, categories, sessions, recordings, feedbacks] =
      await Promise.all([
        db.questions.toArray(),
        db.categories.toArray(),
        db.sessions.orderBy('startedAt').reverse().toArray(),
        db.recordings.toArray(),
        db.feedbacks.toArray(),
      ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const recordingsBySession = new Map<string, typeof recordings>();
    for (const rec of recordings) {
      const list = recordingsBySession.get(rec.sessionId) || [];
      list.push(rec);
      recordingsBySession.set(rec.sessionId, list);
    }

    const feedbackByRecording = new Map(
      feedbacks.map((f) => [f.recordingId, f])
    );

    const validSessions = sessions.filter(
      (s) =>
        s.status === 'completed' ||
        (recordingsBySession.get(s.id)?.length ?? 0) > 0
    );

    const latestSession = validSessions[0] || null;

    const recentSessions = validSessions.slice(0, 5).map((session) => {
      const sessionRecs = recordingsBySession.get(session.id) || [];
      const totalDuration = sessionRecs.reduce(
        (acc, r) => acc + (r.duration || 0),
        0
      );
      const feedbackCount = sessionRecs.filter((r) =>
        feedbackByRecording.has(r.id)
      ).length;

      const scores = sessionRecs
        .map((r) => calculateAverageScore(feedbackByRecording.get(r.id)))
        .filter((s): s is number => s !== null);

      const avgScore =
        scores.length > 0
          ? Math.round(
              (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
            ) / 10
          : null;

      return {
        session,
        recordingCount: sessionRecs.length,
        totalQuestions: session.questionIds.length,
        totalDuration,
        feedbackCount,
        avgScore,
      };
    });

    return {
      totalQuestions: questions.length,
      recentQuestions: questions
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 4),
      categoryMap,
      totalSessions: recordings.length,
      latestPracticeDate: latestSession ? latestSession.startedAt : null,
      recentSessions,
    };
  }, []);

  if (!data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-xl bg-white border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>개인 면접 연습 스튜디오</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              실제 면접처럼 답변하고, 스스로 돌아보며 성장하세요
            </h1>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              예상 면접 질문을 선택해 웹캠과 마이크로 답변을 녹화하고, 구간별 타임스탬프 피드백 메모를 기록하며 이전 시도와 비교할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              size="lg"
              onClick={() => navigate('/studio')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>연습실 바로가기</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/guide')}
            >
              <Video className="h-4 w-4 text-blue-600" />
              <span>사용 가이드</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          <Link
            to="/studio"
            className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Play className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  연습실
                </p>
                <p className="text-xs text-slate-500">
                  질문별 웹캠 녹화 스튜디오
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-all" />
          </Link>

          <Link
            to="/questions"
            className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <ListChecks className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  질문 관리
                </p>
                <p className="text-xs text-slate-500">
                  예상 질문 등록·일괄 추가·메모
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-all" />
          </Link>

          <Link
            to="/records"
            className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <History className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  연습 기록 보기
                </p>
                <p className="text-xs text-slate-500">
                  회차별 영상 재생 및 타임스탬프 메모
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-violet-600 transition-all" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              등록된 전체 질문 수
            </CardTitle>
            <FileQuestion className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {data.totalQuestions}
              <span className="text-base font-normal text-slate-500 ml-1">
                개
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              누적 답변 녹화 수
            </CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {data.totalSessions}
              <span className="text-base font-normal text-slate-500 ml-1">
                회
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">
              최근 연습 날짜
            </CardTitle>
            <Calendar className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {data.latestPracticeDate
                ? formatDate(data.latestPracticeDate, false)
                : '기록 없음'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">최근 연습 기록</CardTitle>
              <CardDescription>
                가장 최근에 진행한 면접 연습과 셀프 피드백 현황입니다.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/records')}
            >
              <span>전체 기록</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 px-4 text-center">
                <Video className="h-9 w-9 text-slate-400 mb-2.5" />
                <p className="text-sm font-medium text-slate-700">
                  아직 진행한 면접 연습 기록이 없습니다
                </p>
                <Button
                  size="sm"
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate('/studio')}
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>연습실에서 첫 녹화 시작하기</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.recentSessions.map((item) => {
                  const isAllFeedbackDone =
                    item.recordingCount > 0 &&
                    item.feedbackCount >= item.recordingCount;

                  return (
                    <Link
                      key={item.session.id}
                      to={`/records`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-sm text-slate-900">
                            {formatDate(item.session.startedAt)}
                          </span>
                          {isAllFeedbackDone ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              피드백 완료 ({item.feedbackCount}/{item.recordingCount})
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 gap-1"
                            >
                              <AlertCircle className="h-3 w-3" />
                              피드백 {item.feedbackCount}/{item.recordingCount} 작성됨
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>답변 녹화: {item.recordingCount}개</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />총 연습 시간:{' '}
                            {formatDurationKorean(item.totalDuration)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 shrink-0">
                        <span>영상 및 피드백 보기</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">등록된 질문</CardTitle>
              <CardDescription>예상 질문 목록입니다.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/questions')}
            >
              <span>관리</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.recentQuestions.map((q) => {
              const cat = data.categoryMap.get(q.categoryId);
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 space-y-1.5"
                >
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${getCategoryColorClasses(
                      cat?.color
                    )}`}
                  >
                    {cat?.name || '기타'}
                  </span>
                  <p className="text-sm font-medium text-slate-900 line-clamp-2">
                    {q.content}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
