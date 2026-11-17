import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();

  const isMainActive = location.pathname === '/';

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
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1360px] mx-auto h-full flex items-center justify-between gap-4">
          {/* Left: Brand Logo + Navigation */}
          <div className="flex items-center h-full gap-6 lg:gap-8 overflow-x-auto no-scrollbar">
            <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
              <Video className="h-6 w-6 text-[#0B50E8] stroke-[2.2]" />
              <span className="text-[20px] font-extrabold tracking-tight text-slate-900">
                Interview Lab
              </span>
            </NavLink>

            {!isMainActive && (
              <nav className="flex items-center h-full gap-5 sm:gap-7 shrink-0">
                <NavLink
                  to="/studio"
                  className={cn(
                    'relative h-full inline-flex items-center px-1 text-[14px] sm:text-[15px] transition-colors whitespace-nowrap',
                    isStudioActive
                      ? 'text-[#0B50E8] font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  )}
                >
                  <span>연습실</span>
                  {isStudioActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[#0B50E8]" />
                  )}
                </NavLink>

                <NavLink
                  to="/records"
                  className={cn(
                    'relative h-full inline-flex items-center px-1 text-[14px] sm:text-[15px] transition-colors whitespace-nowrap',
                    isRecordsActive
                      ? 'text-[#0B50E8] font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  )}
                >
                  <span>연습 기록</span>
                  {isRecordsActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[#0B50E8]" />
                  )}
                </NavLink>

                <NavLink
                  to="/questions"
                  className={({ isActive }) =>
                    cn(
                      'relative h-full inline-flex items-center px-1 text-[14px] sm:text-[15px] transition-colors whitespace-nowrap',
                      isActive
                        ? 'text-[#0B50E8] font-bold'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>질문 관리</span>
                      {isActive && (
                        <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[#0B50E8]" />
                      )}
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    cn(
                      'relative h-full inline-flex items-center px-1 text-[14px] sm:text-[15px] transition-colors whitespace-nowrap',
                      isActive
                        ? 'text-[#0B50E8] font-bold'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>대시보드</span>
                      {isActive && (
                        <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[#0B50E8]" />
                      )}
                    </>
                  )}
                </NavLink>

                <NavLink
                  to="/guide"
                  className={cn(
                    'relative h-full inline-flex items-center gap-1.5 px-1 text-[14px] sm:text-[15px] transition-colors whitespace-nowrap',
                    isGuideActive
                      ? 'text-[#0B50E8] font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  )}
                >
                  <span>사용 가이드</span>
                  {isGuideActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[#0B50E8]" />
                  )}
                </NavLink>
              </nav>
            )}
          </div>

          {/* Right: Actions matching reference header */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {isMainActive && (
              <NavLink
                to="/records"
                className="text-sm sm:text-[15px] font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                연습 기록
              </NavLink>
            )}

            {currentUser ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  {currentUser.name}님
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors"
                  title="로그아웃"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:inline-block"
              >
                로그인
              </NavLink>
            )}

            {!isStudioActive && (
              <NavLink
                to="/studio"
                className="inline-flex items-center justify-center rounded-xl bg-[#0B50E8] hover:bg-[#0942C2] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors"
              >
                연습실 열기
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main
        className={cn(
          'flex-1 w-full',
          isMainActive
            ? 'flex flex-col'
            : 'max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6'
        )}
      >
        <Outlet />
      </main>

      {/* Footer (shown on subpages; landing page has its own 3-column feature footer strip) */}
      {!isMainActive && (
        <footer className="border-t border-slate-200/80 bg-white/80 py-6 px-4 sm:px-6 lg:px-10 mt-auto">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-[#0B50E8]" />
              <span className="font-bold text-slate-800">Interview Lab</span>
              <span>— 개인 면접 연습 & 셀프 피드백 스튜디오</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 font-medium">
              <Link to="/" className="hover:text-slate-900">
                메인페이지
              </Link>
              <Link to="/studio" className="hover:text-slate-900">
                연습실
              </Link>
              <Link to="/records" className="hover:text-slate-900">
                연습 기록
              </Link>
              <Link to="/questions" className="hover:text-slate-900">
                질문 관리
              </Link>
              <Link to="/guide" className="hover:text-slate-900">
                사용 가이드
              </Link>
              <Link to="/dashboard" className="hover:text-slate-900">
                대시보드
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
