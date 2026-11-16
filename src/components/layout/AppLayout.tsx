import React from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Video,
  ListChecks,
  LayoutDashboard,
  BookOpen,
  LogIn,
  UserPlus,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
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
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between gap-4">
          {/* Left: Brand Logo + Primary Tabs */}
          <div className="flex items-center h-full gap-6 lg:gap-9 overflow-x-auto no-scrollbar">
            <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
              <Video className="h-6 w-6 text-blue-600 stroke-[2.2]" />
              <span className="text-[20px] font-extrabold tracking-tight text-slate-900">
                Interview Lab
              </span>
            </NavLink>

            <nav className="flex items-center h-full gap-5 sm:gap-7 shrink-0">
              <NavLink
                to="/"
                end
                className={cn(
                  'relative h-full inline-flex items-center px-1 text-[14px] sm:text-[15px] transition-colors whitespace-nowrap',
                  isMainActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                )}
              >
                <span>메인</span>
                {isMainActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-blue-600" />
                )}
              </NavLink>

              <NavLink
                to="/studio"
                className={cn(
                  'relative h-full inline-flex items-center px-1 text-[14px] sm:text-[15px] transition-colors whitespace-nowrap',
                  isStudioActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                )}
              >
                <span>연습실</span>
                {isStudioActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-blue-600" />
                )}
              </NavLink>

              <NavLink
                to="/records"
                className={cn(
                  'relative h-full inline-flex items-center px-1 text-[14px] sm:text-[15px] transition-colors whitespace-nowrap',
                  isRecordsActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                )}
              >
                <span>연습 기록</span>
                {isRecordsActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-blue-600" />
                )}
              </NavLink>

              <NavLink
                to="/guide"
                className={cn(
                  'relative h-full inline-flex items-center gap-1.5 px-1 text-[14px] sm:text-[15px] transition-colors whitespace-nowrap',
                  isGuideActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                )}
              >
                <BookOpen className="h-4 w-4 hidden sm:inline" />
                <span>사용 가이드</span>
                {isGuideActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-blue-600" />
                )}
              </NavLink>
            </nav>
          </div>

          {/* Right: Secondary Quick Links + Auth Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <NavLink
              to="/questions"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                )
              }
            >
              <ListChecks className="h-3.5 w-3.5" />
              <span className="hidden md:inline">질문 관리</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                )
              }
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden md:inline">대시보드</span>
            </NavLink>

            <span className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:inline-block" />

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {currentUser.name.slice(0, 1)}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {currentUser.targetRole}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">로그아웃</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-700 hover:bg-slate-100'
                    )
                  }
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>로그인</span>
                </NavLink>

                <NavLink
                  to="/signup"
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5 hidden sm:inline" />
                  <span>회원가입</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 py-6 px-4 sm:px-6 lg:px-10 mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-600" />
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
    </div>
  );
}
