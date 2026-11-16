import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Video,
  ListChecks,
  History,
  Sparkles,
  CheckCircle2,
  Clock,
  Mic,
  Monitor,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  Play,
  ArrowRight,
  RotateCcw,
  Star,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GuideStep {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  badge: string;
  actionLabel: string;
  actionPath: string;
  highlights: {
    title: string;
    description: string;
  }[];
  proTip: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'step-questions',
    stepNumber: 'STEP 01',
    title: '예상 면접 질문 및 키워드 노트 구성',
    subtitle:
      '직무별·유형별 카테고리를 나누고, 질문마다 답변에 꼭 포함할 핵심 키워드 메모를 등록하세요.',
    badge: '질문 관리 (/questions)',
    actionLabel: '질문 관리 페이지 열기',
    actionPath: '/questions',
    highlights: [
      {
        title: '카테고리별 체계적 분류',
        description:
          '백엔드 기술 면접, 자기소개, 지원동기, 프로젝트 경험 등 원하는 카테고리를 자유롭게 추가하고 색상 태그로 구분할 수 있습니다.',
      },
      {
        title: '여러 질문 한 번에 일괄 등록',
        description:
          '채용 공고나 기술 블로그에서 정리한 예상 질문 목록을 줄바꿈(Enter)으로 구분해 붙여넣으면 수십 개의 질문도 한 번에 등록됩니다.',
      },
      {
        title: '핵심 답변 키워드(참고 메모) 작성',
        description:
          '전체 대본을 통째로 외우기보다 "결론부터 말하기 / No-Offset 대안 언급"처럼 핵심 키워드만 메모해 두면 실전처럼 자연스러운 말하기 연습이 가능합니다.',
      },
    ],
    proTip:
      '대본을 그대로 읽으면 시선이 흔들리고 어조가 부자연스러워집니다. 참고 메모에는 핵심 키워드 3가지 이내로만 적어두는 것을 추천합니다!',
  },
  {
    id: 'step-studio',
    stepNumber: 'STEP 02',
    title: '실전 같은 웹캠·화면공유 녹화 스튜디오',
    subtitle:
      '카메라와 마이크 상태를 점검하고, 실제 면접장과 동일한 긴장감 속에서 답변을 녹화하세요.',
    badge: '연습실 (/studio)',
    actionLabel: '연습실 스튜디오 열기',
    actionPath: '/studio',
    highlights: [
      {
        title: '카메라 & 화면 공유 모드 전환',
        description:
          '일반 화상 면접처럼 웹캠으로 내 모습을 녹화하거나, 포트폴리오·아키텍처 발표 면접을 위해 화면 공유 녹화 모드로 전환할 수 있습니다.',
      },
      {
        title: '순차 출제 & 랜덤 출제 모드',
        description:
          '질문 순서를 섞는 [랜덤] 모드를 켜면 어떤 질문이 나올지 모르는 실전 압박 면접 환경을 그대로 재현할 수 있습니다.',
      },
      {
        title: '답변 제한 시간 타이머 설정',
        description:
          '1분 자기소개나 2분 이내 기술 설명처럼 제한 시간을 설정하고 녹화 중 경과 시간을 실시간으로 확인하며 시간 배분 감각을 익히세요.',
      },
    ],
    proTip:
      '녹화가 끝나면 별도의 복잡한 업로드 과정 없이 즉시 해당 질문의 새로운 시도 회차(시도 1, 시도 2...)로 자동 저장됩니다.',
  },
  {
    id: 'step-records',
    stepNumber: 'STEP 03',
    title: '구간별 타임스탬프 피드백 & 시도 회차 비교',
    subtitle:
      '녹화된 내 모습을 객관적으로 돌려보며 아쉬운 지점에 타임스탬프 메모를 남기고 다음 시도와 비교하세요.',
    badge: '연습 기록 (/records)',
    actionLabel: '연습 기록 보러가기',
    actionPath: '/records',
    highlights: [
      {
        title: '+ 현재 시간에 메모 (타임스탬프 북마크)',
        description:
          '영상을 재생하다가 말이 빨라지거나 시선이 흔들린 순간에 [+ 현재 시간에 메모]를 누르면 00:16 형태의 시간 배지와 함께 구간 피드백을 기록할 수 있습니다.',
      },
      {
        title: '타임스탬프 클릭 시 해당 구간 즉시 재생',
        description:
          '저장된 시간 배지(예: 00:42)를 클릭하면 영상 플레이어가 즉시 해당 시점으로 이동하여 문제 구간을 반복 점검할 수 있습니다.',
      },
      {
        title: '시도 1 · 시도 2 회차별 비교 및 5점 자가진단',
        description:
          '피드백을 반영해 [다시 녹화]한 뒤, 드롭다운에서 이전 시도와 최신 시도를 전환하며 얼마나 개선되었는지 직접 비교해 보세요.',
      },
    ],
    proTip:
      '첫 번째 녹화 후 타임스탬프 메모를 2~3개 남기고, 바로 [다시 녹화]를 눌러 두 번째 시도를 찍어보면 가장 빠르게 답변 퀄리티가 올라갑니다.',
  },
  {
    id: 'step-storage',
    stepNumber: 'STEP 04',
    title: '로컬 보안 저장소 & 영상 파일 관리',
    subtitle:
      '외부 유출 걱정 없는 브라우저 로컬 DB(IndexedDB) 구조와 영상 다운로드·용량 관리 방법을 확인하세요.',
    badge: '보안 및 파일 관리',
    actionLabel: '대시보드 현황 보기',
    actionPath: '/dashboard',
    highlights: [
      {
        title: '100% 로컬 저장으로 완벽한 프라이버시',
        description:
          '녹화된 모든 영상과 피드백 메모는 외부 서버로 전송되지 않으며, 오직 현재 사용 중인 브라우저 내부 데이터베이스에만 안전하게 저장됩니다.',
      },
      {
        title: '녹화 영상 소장용 다운로드 지원',
        description:
          '연습 기록 플레이어 하단의 다운로드 버튼을 누르면 녹화 영상을 WebM 또는 MP4 파일로 내 PC에 즉시 저장할 수 있습니다.',
      },
      {
        title: '피드백은 남기고 영상만 가볍게 정리',
        description:
          '브라우저 저장 공간을 비우고 싶을 때는 [영상만 삭제] 기능을 사용해 보세요. 작성해 둔 타임스탬프 메모와 자가진단 점수는 그대로 보존됩니다.',
      },
    ],
    proTip:
      '중요한 베스트 답변 영상은 PC로 다운로드해 백업해 두고, 오래된 연습 영상은 영상만 삭제하여 가볍게 관리하세요.',
  },
];

interface ChecklistItem {
  id: string;
  category: '환경 점검' | '답변 구성' | '비언어 태도';
  label: string;
  detail: string;
}

const INTERVIEW_CHECKLIST: ChecklistItem[] = [
  {
    id: 'chk-1',
    category: '환경 점검',
    label: '카메라 렌즈 높이를 눈높이와 수평으로 맞추었나요?',
    detail: '위에서 내려다보거나 아래에서 올려다보지 않도록 노트북 거치대를 활용하세요.',
  },
  {
    id: 'chk-2',
    category: '환경 점검',
    label: '얼굴 정면에 밝은 조명이 비치고 배경이 깔끔한가요?',
    detail: '역광을 피하고 면접관이 답변에만 집중할 수 있는 정돈된 배경인지 확인하세요.',
  },
  {
    id: 'chk-3',
    category: '환경 점검',
    label: '마이크 입력 레벨 표시가 정상적으로 반응하나요?',
    detail: '연습실 하단 마이크 상태 배지를 통해 목소리가 끊기지 않는지 먼저 테스트하세요.',
  },
  {
    id: 'chk-4',
    category: '답변 구성',
    label: '첫 15초 이내에 질문에 대한 핵심 결론(두괄식)을 말했나요?',
    detail: '결론 → 이유/근거 → 구체적 프로젝트 사례 순서로 말하면 전달력이 크게 높아집니다.',
  },
  {
    id: 'chk-5',
    category: '답변 구성',
    label: '답변 하나당 1분~1분 30초 이내로 간결하게 마무리했나요?',
    detail: '답변이 2분을 넘어가면 집중도가 떨어집니다. 꼬리질문을 유도할 수 있게 핵심만 전달하세요.',
  },
  {
    id: 'chk-6',
    category: '답변 구성',
    label: '단순 지식 나열이 아닌 본인의 문제 해결 경험을 연결했나요?',
    detail: '기술 개념 설명 후 "실제 프로젝트에서도 이를 적용해 응답 속도를 개선했습니다"처럼 연결하세요.',
  },
  {
    id: 'chk-7',
    category: '비언어 태도',
    label: '화 속의 내 얼굴이 아닌 웹캠 카메라 렌즈를 응시하며 말했나요?',
    detail: '카메라 렌즈를 바라보아야 실제 면접관과 눈을 맞추는(아이컨택) 느낌을 줄 수 있습니다.',
  },
  {
    id: 'chk-8',
    category: '비언어 태도',
    label: '"음...", "그..." 같은 불필요한 추임새나 말끝 흐리기가 없었나요?',
    detail: '생각할 시간이 필요할 때는 추임새 대신 1~2초간 자연스럽게 호흡을 가다듬으세요.',
  },
  {
    id: 'chk-9',
    category: '비언어 태도',
    label: '질문을 들을 때와 답변을 마칠 때 밝고 자신감 있는 표정을 유지했나요?',
    detail: '답변 마지막 문장을 마친 뒤 1초간 미소와 함께 시선을 유지하면 훨씬 여유로워 보입니다.',
  },
];

const RUBRIC_ITEMS = [
  {
    metric: '내용 적절성',
    good: '질문의 의도를 정확히 파악하고 직무 역량·실제 경험과 연결해 구체적으로 답변함',
    needWork: '질문 요지에서 벗어나거나 추상적인 표현만 반복함',
  },
  {
    metric: '논리 전달력',
    good: '두괄식(결론 → 근거 → 사례 → 요약) 구조가 뚜렷해 한 번에 이해하기 쉬움',
    needWork: '배경 설명이 너무 길어 결론이 무엇인지 끝까지 들어야 알 수 있음',
  },
  {
    metric: '속도·발음',
    good: '적절한 말하기 속도와 또렷한 발음, 핵심 키워드에서 강약 조절이 자연스러움',
    needWork: '긴장으로 말이 지나치게 빨라지거나 말끝을 흐리는 습관이 나타남',
  },
  {
    metric: '시선 처리',
    good: '메모에 의존하지 않고 카메라 렌즈를 안정적으로 응시하며 답변함',
    needWork: '화면을 읽느라 눈동자가 좌우로 흔들리거나 시선이 자주 바닥으로 향함',
  },
  {
    metric: '자신감·태도',
    good: '안정된 자세와 여유 있는 표정, 명확한 목소리 톤으로 신뢰감을 줌',
    needWork: '몸이 자주 흔들리거나 목소리가 작아 확신이 부족해 보임',
  },
];

const FAQ_ITEMS = [
  {
    q: '녹화한 면접 영상이 외부 서버에 업로드되나요?',
    a: '아니요! Interview Lab은 100% 로컬 개인용 스튜디오입니다. 녹화한 모든 영상(Blob)과 질문, 피드백 데이터는 현재 사용 중인 웹 브라우저 내부 데이터베이스(IndexedDB)에만 저장되며 외부 서버로 절대 전송되지 않습니다.',
  },
  {
    q: '카메라나 마이크가 나오지 않을 때는 어떻게 해결하나요?',
    a: '브라우저 주소창 왼쪽의 자물쇠(또는 사이트 설정) 아이콘을 클릭하여 카메라 및 마이크 권한이 [허용]으로 되어 있는지 확인해 주세요. 다른 화상회의 프로그램(Zoom, Teams 등)이 카메라를 점유 중이라면 종료 후 새로고침하면 정상 작동합니다.',
  },
  {
    q: '시도 1, 시도 2처럼 같은 질문을 여러 번 녹화하면 이전 영상은 사라지나요?',
    a: '사라지지 않습니다! 같은 질문에 대해 여러 번 녹화할 때마다 [시도 1], [시도 2], [시도 3]으로 차곡차곡 쌓이며, 연습 기록(/records) 페이지에서 드롭다운으로 회차를 바꿔가며 이전 답변과 최신 답변을 비교할 수 있습니다.',
  },
  {
    q: '타임스탬프 구간 메모는 어떻게 활용하나요?',
    a: '연습 기록 페이지에서 영상을 재생하다가 피드백을 남기고 싶은 시점에 [+ 현재 시간에 메모] 버튼을 클릭하세요. 현재 재생 시간(예: 00:24)이 자동으로 기록되며, 나중에 해당 시간 배지를 클릭하면 즉시 그 구간으로 이동해 재생됩니다.',
  },
];

const CHECKLIST_STORAGE_KEY = 'interview_lab_guide_checklist_v1';

export function GuidePage() {
  const navigate = useNavigate();

  const [activeStepId, setActiveStepId] = useState<string>(GUIDE_STEPS[0].id);
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['chk-1', 'chk-4'];
    } catch {
      return [];
    }
  });
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checkedIds));
    } catch {
      // ignore storage errors
    }
  }, [checkedIds]);

  const toggleChecklist = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetChecklist = () => {
    setCheckedIds([]);
  };

  const activeStep =
    GUIDE_STEPS.find((s) => s.id === activeStepId) || GUIDE_STEPS[0];

  const progressPercent = Math.round(
    (checkedIds.length / INTERVIEW_CHECKLIST.length) * 100
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/60 p-6 sm:p-10 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Interview Lab 공식 사용 가이드</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              질문 준비부터 녹화·타임스탬프 복기까지,
              <br className="hidden sm:inline" /> 100% 활용하는 실전 면접 훈련법
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              혼자 연습할 때 막막했던 시선 처리, 답변 시간 조절, 논리적 말하기를
              <strong> 4단계 워크플로우</strong>와 <strong>실전 체크리스트</strong>로 완벽하게 마스터해 보세요.
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
              onClick={() => navigate('/questions')}
            >
              <ListChecks className="h-4 w-4 text-blue-600" />
              <span>내 질문 등록하기</span>
            </Button>
          </div>
        </div>

        {/* 4-Step Quick Flow Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-200/80">
          {GUIDE_STEPS.map((step, idx) => {
            const isSelected = step.id === activeStepId;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepId(step.id)}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-extrabold tracking-wider ${
                      isSelected ? 'text-blue-100' : 'text-blue-600'
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {idx + 1} / 4
                  </span>
                </div>
                <p className="text-sm font-bold leading-snug line-clamp-1">
                  {step.title}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Step Explorer */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white border-transparent font-bold">
                {activeStep.stepNumber}
              </Badge>
              <Badge variant="outline" className="text-slate-600">
                {activeStep.badge}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {activeStep.title}
            </h2>
            <p className="text-sm text-slate-500">{activeStep.subtitle}</p>
          </div>

          <Button
            onClick={() => navigate(activeStep.actionPath)}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 self-start sm:self-center"
          >
            <span>{activeStep.actionLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeStep.highlights.map((hl, i) => (
            <div
              key={hl.title}
              className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold">
                  {i + 1}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{hl.title}</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {hl.description}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            <strong className="font-bold mr-1.5">실전 연습 Pro Tip:</strong>
            {activeStep.proTip}
          </div>
        </div>
      </div>

      {/* Interactive Self-Check Checklist + 5-Point Rubric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Checklist */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <span>실전 면접 녹화 자가점검 체크리스트</span>
                </CardTitle>
                <CardDescription>
                  항목을 직접 클릭해 체크하며 내 면접 준비 상태를 점검해 보세요. (자동 저장됨)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetChecklist}
                className="text-xs text-slate-500 hover:text-slate-900 shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>초기화</span>
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="pt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">
                  점검 완료: {checkedIds.length} / {INTERVIEW_CHECKLIST.length}개
                </span>
                <span className="text-blue-600">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-2.5">
            {INTERVIEW_CHECKLIST.map((item) => {
              const checked = checkedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleChecklist(item.id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all flex items-start gap-3 ${
                    checked
                      ? 'border-blue-200 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {item.category}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          checked
                            ? 'text-blue-900 line-through decoration-blue-400/60'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: 5-Point Rubric Guide & Shortcut */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-blue-600" />
                <span>5대 역량 자가진단 채점 기준표</span>
              </CardTitle>
              <CardDescription>
                연습 기록 페이지에서 1~5점 별점을 매길 때 아래 기준을 참고하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {RUBRIC_ITEMS.map((item) => (
                <div
                  key={item.metric}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {item.metric}
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-3.5 w-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-emerald-700 font-medium">
                      <strong className="font-bold">우수(4~5점):</strong> {item.good}
                    </p>
                    <p className="text-slate-500">
                      <strong className="font-semibold text-slate-700">보완(1~3점):</strong>{' '}
                      {item.needWork}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-blue-400">
                <Video className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Ready to Practice?
                </span>
              </div>
              <h3 className="text-lg font-bold leading-snug">
                가이드를 확인했다면 지금 첫 번째 답변을 녹화해 보세요!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                기본 탑재된 8개의 백엔드 핵심 면접 질문으로 바로 연습을 시작하거나 나만의 질문을 추가할 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={() => navigate('/studio')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>연습실 시작하기</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/records')}
                  className="border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>연습 기록 보기</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <span>자주 묻는 질문 (FAQ)</span>
          </CardTitle>
          <CardDescription>
            연습실 이용 중 궁금한 점을 빠르게 확인해 보세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-900">
                    Q. {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
