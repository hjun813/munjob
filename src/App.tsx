import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ensureDatabaseSeeded } from '@/db/database';
import { AppLayout } from '@/components/layout/AppLayout';
import { PracticeStudioPage } from '@/pages/PracticeStudioPage';
import { PracticeRecordsPage } from '@/pages/PracticeRecordsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { QuestionsPage } from '@/pages/QuestionsPage';

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureDatabaseSeeded().finally(() => {
      setReady(true);
    });
  }, []);

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
          {/* Primary Tabs matching reference images */}
          <Route path="/" element={<PracticeStudioPage />} />
          <Route path="/setup" element={<PracticeStudioPage />} />
          <Route path="/records" element={<PracticeRecordsPage />} />
          <Route path="/history" element={<PracticeRecordsPage />} />
          <Route path="/result/:sessionId" element={<PracticeRecordsPage />} />

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
