import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ensureDatabaseSeeded } from '@/db/database';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { MainPage } from '@/pages/MainPage';
import { PracticeStudioPage } from '@/pages/PracticeStudioPage';
import { PracticeRecordsPage } from '@/pages/PracticeRecordsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { QuestionsPage } from '@/pages/QuestionsPage';
import { GuidePage } from '@/pages/GuidePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';

export function App() {
  const [ready, setReady] = useState(false);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    Promise.all([ensureDatabaseSeeded(), initializeAuth()]).finally(() => {
      setReady(true);
    });
  }, [initializeAuth]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex items-center justify-center">
        <div className="text-sm text-slate-500 font-medium">
          Interview Lab 스튜디오를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Main Landing & Home Hub */}
          <Route path="/" element={<MainPage />} />

          {/* Practice Studio & Records */}
          <Route path="/studio" element={<PracticeStudioPage />} />
          <Route path="/setup" element={<PracticeStudioPage />} />
          <Route path="/interview" element={<PracticeStudioPage />} />
          <Route path="/records" element={<PracticeRecordsPage />} />
          <Route path="/history" element={<PracticeRecordsPage />} />
          <Route path="/result/:sessionId" element={<PracticeRecordsPage />} />

          {/* Usage Guide */}
          <Route path="/guide" element={<GuidePage />} />

          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Secondary / Management Views */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
