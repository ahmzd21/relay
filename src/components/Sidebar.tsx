'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import WorkspaceSwitcher from './WorkspaceSwitcher';

interface SidebarProps {
  currentPath?: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const pathname = usePathname() || currentPath;
  const router = useRouter();
  const { isOrganization, hasPermission } = useWorkspace();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  // Build context adaptive dashboard options
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/dashboard/native-meeting', label: 'Native Meeting', icon: 'video_camera_front' },
    { href: '/dashboard/external-meeting', label: 'External Meeting', icon: 'link' },
    { href: '/dashboard/statistics', label: 'Statistics', icon: 'bar_chart' },
    
    // Organization channels only visible if in Org space profile
    ...(isOrganization() ? [
      { href: '/dashboard/channels', label: 'Channels', icon: 'tag' },
    ] : []),
    
    // Corporate invoices visible only to Org owners or private solo views
    ...(isOrganization() ? (hasPermission('owner') ? [
      { href: '/dashboard/billing', label: 'Corporate Billing', icon: 'payments' }
    ] : []) : [
      { href: '/dashboard/billing', label: 'Billing & Invoices', icon: 'payments' }
    ]),
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname?.startsWith(href + '/');
  };

  if (!isMounted) {
    const initialCollapsed = typeof window !== 'undefined' && localStorage.getItem('sidebar-collapsed') === 'true';
    return <aside className={`border-r border-white/10 hidden md:block bg-[#0f1115] h-screen sticky top-0 ${initialCollapsed ? 'w-20' : 'w-64'}`} />;
  }

  return (
    <aside
      className={`border-r border-white/10 hidden md:flex flex-col justify-between bg-[#0f1115] transition-all duration-300 ease-in-out h-screen sticky top-0 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div>
        {/* Logo Header with Interactive SVG Toggle */}
        <div className={`h-20 flex items-center border-b border-white/10 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'
          }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className="h-6 w-6 text-white transition-transform duration-500 ease-in-out"
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
              className={`text-xl font-bold tracking-tighter text-white transition-all duration-300 origin-left ${isCollapsed ? 'opacity-0 max-w-0 scale-0' : 'opacity-100 max-w-[100px] scale-100'
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
                className={`flex items-center rounded-xl font-medium text-sm transition-all relative ${isCollapsed ? 'justify-center h-11 w-11 mx-auto p-0' : 'gap-3 px-4 py-3'} ${
                  active
                    ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-lg shadow-[#FF416C]/20'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="transition-all duration-300 whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Settings & Sign Out footer controls */}
      <div className="p-4 space-y-2 mb-4 border-t border-white/10 pt-6">
        <Link
          href="/dashboard/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={`flex items-center rounded-xl font-medium text-sm transition-all relative ${isCollapsed ? 'justify-center h-11 w-11 mx-auto p-0' : 'gap-3 px-4 py-3'} ${
            isActive('/dashboard/settings')
              ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-lg shadow-[#FF416C]/20'
              : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">settings</span>
          {!isCollapsed && <span>Settings</span>}
        </Link>

        <button onClick={handleSignOut} className={`flex items-center text-left text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl font-medium text-sm transition-all ${isCollapsed ? 'justify-center h-11 w-11 mx-auto p-0' : 'w-full gap-3 px-4 py-3'}`}>
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
