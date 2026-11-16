import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video,
  User as UserIcon,
  Mail,
  Lock,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ROLE_PRESETS = [
  '백엔드 개발자',
  '프론트엔드 개발자',
  '풀스택 개발자',
  'AI / 데이터 엔지니어',
  '모바일 앱 개발자',
  '데브옵스 / 클라우드',
  'PM / 서비스 기획',
  '기타 직무',
];

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('백엔드 개발자');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '미입력', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) {
      return { level: 1, label: '약함 (6자 이상 권장)', color: 'bg-amber-500' };
    }
    if (score <= 2) {
      return { level: 2, label: '보통', color: 'bg-blue-500' };
    }
    return { level: 3, label: '안전함', color: 'bg-emerald-500' };
  }, [password]);

  const isPasswordMatch =
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    password === passwordConfirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('이름(또는 닉네임)을 입력해 주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상으로 설정해 주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    if (!agreeTerms) {
      setError('서비스 이용 및 로컬 데이터 저장 안내에 동의해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signup({
        name,
        email,
        password,
        targetRole,
        bio,
      });

      if (!result.ok) {
        setError(result.error || '회원가입에 실패했습니다.');
        return;
      }

      navigate('/', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        {/* Left Info Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Video className="h-5 w-5 text-white stroke-[2.2]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                Interview Lab
              </span>
            </Link>

            <div className="space-y-3 pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                <span>30초 만에 시작하는 면접 스튜디오</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
                나만의 면접 연습 공간을
                <br />
                지금 만들어 보세요
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                희망 직무를 설정하고 예상 질문 리스트와 녹화 피드백 기록을 체계적으로 쌓아갈 수 있습니다.
              </p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3.5">
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                회원가입 후 제공되는 기능
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>직무별 기본 면접 질문 세트 및 무제한 질문 추가</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>웹캠·마이크·화면공유 무제한 연습 및 시도별 영상 비교</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>구간별 타임스탬프 피드백 & 5점 척도 자가진단 리포트</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-xs text-slate-400 leading-relaxed">
            모든 영상과 연습 데이터는 외부 서버로 전송되지 않으며, 사용자 브라우저의 로컬 데이터베이스(IndexedDB)에 안전하게 보관됩니다.
          </div>
        </div>

        {/* Right Signup Form */}
        <div className="lg:col-span-7 p-8 sm:p-10">
          <div className="max-w-lg mx-auto space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                회원가입
              </h2>
              <p className="text-sm text-slate-500">
                간단한 프로필 정보를 입력하고 면접 연습을 시작하세요.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-name"
                    className="text-xs font-semibold text-slate-700"
                  >
                    이름 (또는 닉네임) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="예: 김싸피"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError('');
                      }}
                      className="h-10 pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-email"
                    className="text-xs font-semibold text-slate-700"
                  >
                    이메일 주소 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      className="h-10 pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                  <span>준비 중인 희망 직무</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PRESETS.map((role) => {
                    const active = targetRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setTargetRole(role)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="signup-bio"
                  className="text-xs font-semibold text-slate-700"
                >
                  면접 목표 한 줄 다짐 (선택)
                </label>
                <Input
                  id="signup-bio"
                  type="text"
                  placeholder="예: 상반기 공채 백엔드 기술 면접 완벽 대비!"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-password"
                    className="text-xs font-semibold text-slate-700"
                  >
                    비밀번호 (6자 이상) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="비밀번호 입력"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      className="h-10 pl-10 pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all ${passwordStrength.color}`}
                          style={{
                            width: `${(passwordStrength.level / 3) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-password-confirm"
                    className="text-xs font-semibold text-slate-700"
                  >
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="signup-password-confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="비밀번호 다시 입력"
                      value={passwordConfirm}
                      onChange={(e) => {
                        setPasswordConfirm(e.target.value);
                        if (error) setError('');
                      }}
                      className="h-10 pl-10"
                      required
                    />
                  </div>
                  {passwordConfirm.length > 0 && (
                    <p
                      className={`text-[11px] font-medium pt-0.5 ${
                        isPasswordMatch ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {isPasswordMatch
                        ? '✓ 비밀번호가 일치합니다'
                        : '비밀번호가 일치하지 않습니다'}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  <strong>[필수]</strong> Interview Lab 서비스 이용약관 및 브라우저 로컬 스토리지 기반 데이터 보관 정책에 동의합니다.
                </span>
              </label>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                <span>{isSubmitting ? '가입 처리 중...' : '회원가입 완료 및 시작하기'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="pt-1 text-center text-xs text-slate-500">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4 ml-1"
              >
                로그인하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
