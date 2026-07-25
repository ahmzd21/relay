'use client';

import React, { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarReady, setSidebarReady] = useState(false);
  const notifySidebarReady = useCallback(() => setSidebarReady(true), []);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1c1b1b] flex font-helvetica selection:bg-black selection:text-white">
      <AuthGuard sidebarReady={sidebarReady}>
        <Sidebar onReady={notifySidebarReady} />
        {children}
      </AuthGuard>
    </div>
  );
}
