'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface AuthGuardProps {
  children: React.ReactNode;
  // Called by child components (e.g. Sidebar) when they have finished their
  // own initialization so we know it's safe to reveal the UI.
  onSidebarReady?: (notify: () => void) => void;
}

// We export the callback setter so the layout can pass it to Sidebar.
export function useAuthGuard() {
  const [sidebarReady, setSidebarReady] = useState(false);
  const notifySidebarReady = useCallback(() => setSidebarReady(true), []);
  return { sidebarReady, notifySidebarReady };
}

export default function AuthGuard({
  children,
  sidebarReady,
}: {
  children: React.ReactNode;
  sidebarReady: boolean;
}) {
  const { isLoading: authLoading } = useAuth();
  const { isLoading: workspaceLoading } = useWorkspace();

  const isLoading = authLoading || workspaceLoading || !sidebarReady;

  return (
    <>
      {/* Overlay – shown while anything is still loading */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF9F5]">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="animate-spin h-8 w-8 text-[#FF416C]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Loading…
            </span>
          </div>
        </div>
      )}

      {/* Always render children so Sidebar can mount and call notifySidebarReady */}
      <div className={`flex flex-1${isLoading ? ' invisible' : ''}`}>{children}</div>
    </>
  );
}
