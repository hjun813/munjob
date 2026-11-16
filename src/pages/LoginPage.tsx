import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Video,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const { login, loginAsDemo } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password, rememberMe);
      if (!result.ok) {
        setError(result.error || '로그인에 실패했습니다.');
        return;
      }
      navigate(redirectTo, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginAsDemo();
      navigate(redirectTo, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@interviewlab.kr');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="py-6 sm:py-10 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {/* Left Feature Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
                <Video className="h-5 w-5 text-white stroke-[2.2]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                Interview Lab
              </span>
            </Link>

            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-blue-100">
                <Sparkles className="h-3.5 w-3.5" />
                <span>개인 맞춤형 면접 연습 스튜디오</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
                실전 같은 연습이
                <br />
                가장 확실한 합격을 만듭니다
              </h1>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                웹캠 녹화부터 구간별 타임스탬프 피드백, 시도 회차별 비교까지 한곳에서 관리하세요.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                '질문별 웹캠·마이크·화면공유 실전 녹화',
                '타임스탬프 구간 메모 및 5점 척도 자가진단',
                '시도 회차별(시도 1, 시도 2...) 답변 비교 분석',
                '브라우저 로컬 DB 저장으로 안심 개인정보 보호',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-xs sm:text-sm text-blue-50">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/15">
            <div className="rounded-2xl bg-white/10 backdrop-blur-xs p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-100">
                  데모 계정 안내
                </span>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[11px] font-semibold text-white underline underline-offset-2 hover:text-blue-200"
                >
                  입력란에 자동 채우기
                </button>
              </div>
              <p className="text-xs text-blue-100/90 font-mono">
                ID: demo@interviewlab.kr / PW: password123
              </p>
            </div>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                로그인
              </h2>
              <p className="text-sm text-slate-500">
                계정에 로그인하고 나만의 면접 연습 기록과 질문 노트를 이어가세요.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="text-xs font-semibold text-slate-700"
                >
                  이메일 주소
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="example@interviewlab.kr"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="h-11 pl-10 text-sm"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-slate-700"
                >
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className="h-11 pl-10 pr-10 text-sm"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-xs font-medium text-slate-600">
                    로그인 상태 유지
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  데모 계정 정보 채우기
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                <span>{isSubmitting ? '로그인 중...' : '로그인'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink-0 px-3 text-xs text-slate-400 font-medium">
                또는 빠른 시작
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              onClick={handleDemoLogin}
              className="w-full h-11 border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 font-semibold"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>데모 계정으로 1초 체험 로그인</span>
            </Button>

            <div className="pt-2 text-center text-xs text-slate-500">
              아직 Interview Lab 계정이 없으신가요?{' '}
              <Link
                to="/signup"
                className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4 ml-1"
              >
                무료 회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
