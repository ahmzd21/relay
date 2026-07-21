'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface SidebarProps {
  currentPath?: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const pathname = usePathname() || currentPath;
  const { isOrganization, hasPermission } = useWorkspace();

  // 1. Instantly check localStorage during render to avoid the "expanded-then-closed" flash
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebar-collapsed');
      return savedState === 'true';
    }
    return false; // Server-side render default
  });

  // 2. Hydration guard prevents SSR/client mismatches
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  // Context-aware navigation items
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/dashboard/native-meeting', label: 'Native Meeting', icon: 'video_camera_front' },
    { href: '/dashboard/external-meeting', label: 'External Meeting', icon: 'link' },
    { href: '/dashboard/statistics', label: 'Statistics', icon: 'bar_chart' },
    // Organization-specific items (Team management is now in Settings)
    ...(isOrganization() ? [
      { href: '/dashboard/channels', label: 'Channels', icon: 'tag' },
    ] : []),
    // Billing - only show for personal workspace or org owner
    ...(isOrganization() && hasPermission('owner') ? [
      { href: '/dashboard/billing', label: 'Billing', icon: 'payments', permission: 'owner' as const },
    ] : [
      { href: '/dashboard/billing', label: 'Billing', icon: 'payments' },
    ]),
  ].filter(item => !item.permission || hasPermission(item.permission));

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  // Keep layout shell completely stable with correct width during initial hydration
  if (!isMounted) {
    // If the browser knows it should be collapsed before rendering, prepare the thin shell
    const initialCollapsed = typeof window !== 'undefined' && localStorage.getItem('sidebar-collapsed') === 'true';
    return (
      <aside
        className={`border-r border-[#D9D7D0]/40 hidden md:block bg-[#Fdfbf7] h-screen sticky top-0 ${initialCollapsed ? 'w-20' : 'w-64'
          }`}
      />
    );
  }

  return (
    <aside
      className={`border-r border-[#D9D7D0]/40 hidden md:flex flex-col justify-between bg-[#Fdfbf7] transition-all duration-300 ease-in-out h-screen sticky top-0 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div>
        {/* Logo Header with Interactive SVG Toggle */}
        <div className={`h-20 flex items-center border-b border-[#D9D7D0]/40 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'
          }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-black/5 rounded-full transition-colors flex-shrink-0"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className="h-6 w-6 text-black transition-transform duration-500 ease-in-out"
                style={{
                  transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'
                }}
              >
                <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            {/* Brand Text */}
            <span
              className={`text-xl font-bold tracking-tighter text-black transition-all duration-300 origin-left ${isCollapsed ? 'opacity-0 max-w-0 scale-0' : 'opacity-100 max-w-[100px] scale-100'
                }`}
            >
              Relay
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl font-medium text-sm transition-all relative ${isCollapsed ? 'justify-center h-11 w-11 mx-auto p-0' : 'gap-3 px-4 py-3'
                  } ${active
                    ? 'bg-black text-white shadow-md shadow-black/5'
                    : 'text-[#8C8880] hover:text-black hover:bg-black/5'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{item.icon}</span>
                <span
                  className={`transition-all duration-300 origin-left whitespace-nowrap ${isCollapsed ? 'opacity-0 max-w-0 scale-0 pointer-events-none absolute' : 'opacity-100 max-w-[200px] scale-100'
                    }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 space-y-2 mb-4 border-t border-[#D9D7D0]/40 pt-6">
        {/* Settings */}
        <Link
          href="/dashboard/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={`flex items-center rounded-xl font-medium text-sm transition-all relative ${isCollapsed ? 'justify-center h-11 w-11 mx-auto p-0' : 'gap-3 px-4 py-3'
            } ${isActive('/dashboard/settings')
              ? 'bg-black text-white shadow-md shadow-black/5'
              : 'text-[#8C8880] hover:text-black hover:bg-black/5'
            }`}
        >
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">settings</span>
          <span
            className={`transition-all duration-300 origin-left whitespace-nowrap ${isCollapsed ? 'opacity-0 max-w-0 scale-0 pointer-events-none absolute' : 'opacity-100 max-w-[200px] scale-100'
              }`}
          >
            Settings
          </span>
        </Link>

        {/* Sign Out */}
        <button
          title={isCollapsed ? 'Sign Out' : undefined}
          className={`flex items-center text-left text-rose-500 hover:bg-rose-50 rounded-xl font-medium text-sm transition-all ${isCollapsed ? 'justify-center h-11 w-11 mx-auto p-0' : 'w-full gap-3 px-4 py-3'
            }`}
        >
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
          <span
            className={`transition-all duration-300 origin-left whitespace-nowrap ${isCollapsed ? 'opacity-0 max-w-0 scale-0 pointer-events-none absolute' : 'opacity-100 max-w-[200px] scale-100'
              }`}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}