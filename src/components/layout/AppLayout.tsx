import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Video,
  ListChecks,
  Play,
  History,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();

  const isMainActive = location.pathname === '/';

  const isQuestionsActive = location.pathname.startsWith('/questions');

  const isStudioActive =
    location.pathname.startsWith('/studio') ||
    location.pathname.startsWith('/setup') ||
    location.pathname.startsWith('/interview');

  const isRecordsActive =
    location.pathname.startsWith('/records') ||
    location.pathname.startsWith('/history') ||
    location.pathname.startsWith('/result');

  const isGuideActive = location.pathname.startsWith('/guide');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      className={cn(
        'min-h-screen text-slate-900 flex flex-col',
        isMainActive ? 'bg-white' : 'bg-[#F4F6F9]'
      )}
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-15 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-4">
          {/* Left: Brand Logo + Step-by-Step Workflow Tabs */}
          <div className="flex items-center h-full gap-6 lg:gap-8 overflow-x-auto no-scrollbar">
            <NavLink to="/" className="flex items-center gap-2 shrink-0">
              <Video className="h-5 w-5 text-[#0B50E8] stroke-[2.3]" />
              <span className="text-[18px] font-extrabold tracking-tight text-slate-900">
                Interview Lab
              </span>
            </NavLink>

            <nav className="hidden md:flex items-center h-full gap-1">
              <NavLink
                to="/questions"
                className={cn(
                  'relative h-full inline-flex items-center gap-1.5 px-3 text-[13.5px] transition-colors whitespace-nowrap',
                  isQuestionsActive
                    ? 'text-[#0B50E8] font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                )}
              >
                <ListChecks className="h-3.5 w-3.5 opacity-80" />
                <span>1. 질문 준비</span>
                {isQuestionsActive && (
                  <span className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-t-full bg-[#0B50E8]" />
                )}
              </NavLink>

              <span className="text-slate-300 text-xs select-none">›</span>

              <NavLink
                to="/studio"
                className={cn(
                  'relative h-full inline-flex items-center gap-1.5 px-3 text-[13.5px] transition-colors whitespace-nowrap',
                  isStudioActive
                    ? 'text-[#0B50E8] font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                )}
              >
                <Play className="h-3.5 w-3.5 opacity-80" />
                <span>2. 답변 녹화 (연습실)</span>
                {isStudioActive && (
                  <span className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-t-full bg-[#0B50E8]" />
                )}
              </NavLink>

              <span className="text-slate-300 text-xs select-none">›</span>

              <NavLink
                to="/records"
                className={cn(
                  'relative h-full inline-flex items-center gap-1.5 px-3 text-[13.5px] transition-colors whitespace-nowrap',
                  isRecordsActive
                    ? 'text-[#0B50E8] font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                )}
              >
                <History className="h-3.5 w-3.5 opacity-80" />
                <span>3. 영상 복기 (기록)</span>
                {isRecordsActive && (
                  <span className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-t-full bg-[#0B50E8]" />
                )}
              </NavLink>

              <span className="h-3.5 w-[1px] bg-slate-200 mx-2" />

              <NavLink
                to="/guide"
                className={cn(
                  'relative h-full inline-flex items-center gap-1 px-2.5 text-[13px] transition-colors whitespace-nowrap',
                  isGuideActive
                    ? 'text-[#0B50E8] font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                )}
              >
                <BookOpen className="h-3.5 w-3.5 opacity-75" />
                <span>가이드</span>
                {isGuideActive && (
                  <span className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-t-full bg-[#0B50E8]" />
                )}
              </NavLink>
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <NavLink
              to="/records"
              className="md:hidden text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              연습 기록
            </NavLink>

            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-100/80 px-2.5 py-1">
                <span className="text-xs font-bold text-slate-700">
                  {currentUser.name}님
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[11px] font-medium text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                로그인
              </NavLink>
            )}

            <NavLink
              to="/studio"
              className="inline-flex items-center justify-center rounded-xl bg-[#0B50E8] hover:bg-[#0942C2] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-2xs transition-colors"
            >
              연습실 열기
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        className={cn(
          'flex-1 w-full',
          isMainActive
            ? 'flex flex-col'
            : 'max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-3.5 flex flex-col'
        )}
      >
        <Outlet />
      </main>

      {/* Minimal Footer only on guide/auth/questions pages so studio & records fit 100vh */}
      {!isMainActive && !isStudioActive && !isRecordsActive && (
        <footer className="border-t border-slate-200/80 bg-white/80 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Video className="h-3.5 w-3.5 text-[#0B50E8]" />
              <span className="font-bold text-slate-800">Interview Lab</span>
              <span>— 면접 답변 녹화 & 타임스탬프 복기 스튜디오</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 font-medium">
              <Link to="/" className="hover:text-slate-900">
                홈
              </Link>
              <Link to="/questions" className="hover:text-slate-900">
                질문 준비
              </Link>
              <Link to="/studio" className="hover:text-slate-900">
                연습실
              </Link>
              <Link to="/records" className="hover:text-slate-900">
                연습 기록
              </Link>
              <Link to="/guide" className="hover:text-slate-900">
                사용 가이드
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
