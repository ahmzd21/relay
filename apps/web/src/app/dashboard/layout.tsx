'use client';

import React, { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarReady, setSidebarReady] = useState(false);
  const notifySidebarReady = useCallback(() => setSidebarReady(true), []);

  return (
    <MobileMenuProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-canvas text-ink flex selection:bg-chrome selection:text-white w-full overflow-x-hidden">
          <AuthGuard sidebarReady={sidebarReady}>
            <Sidebar onReady={notifySidebarReady} />
            {children}
          </AuthGuard>
        </div>
      </NotificationProvider>
    </MobileMenuProvider>
  );
}
