import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Video, ListChecks, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const location = useLocation();

  const isStudioActive =
    location.pathname === '/' ||
    location.pathname.startsWith('/setup') ||
    location.pathname.startsWith('/interview');

  const isRecordsActive =
    location.pathname.startsWith('/records') ||
    location.pathname.startsWith('/history') ||
    location.pathname.startsWith('/result');

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col">
      {/* Top Navigation Bar (Matches Reference Images 1 & 2) */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between gap-4">
          {/* Left: Brand Logo + Primary Tabs (연습실 | 연습 기록) */}
          <div className="flex items-center h-full gap-10">
            <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
              <Video className="h-6 w-6 text-blue-600 stroke-[2.2]" />
              <span className="text-[20px] font-extrabold tracking-tight text-slate-900">
                Interview Lab
              </span>
            </NavLink>

            <nav className="flex items-center h-full gap-7">
              <NavLink
                to="/"
                className={cn(
                  'relative h-full inline-flex items-center px-1 text-[15px] transition-colors',
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
                  'relative h-full inline-flex items-center px-1 text-[15px] transition-colors',
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
            </nav>
          </div>

          {/* Right: Secondary Quick Links (질문 일괄 관리 / 대시보드) */}
          <div className="flex items-center gap-2">
            <NavLink
              to="/questions"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                )
              }
            >
              <ListChecks className="h-3.5 w-3.5" />
              <span>질문 관리</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                )
              }
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">대시보드</span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <Outlet />
      </main>
    </div>
  );
}
