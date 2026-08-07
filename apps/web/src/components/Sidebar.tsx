"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useMobileMenu } from "@/contexts/MobileMenuContext";

interface SidebarProps {
  currentPath?: string;
  onReady?: () => void;
}

export default function Sidebar({ currentPath, onReady }: SidebarProps) {
  const pathname = usePathname() || currentPath;
  const router = useRouter();
  const { isOrganization, hasPermission } = useWorkspace();
  const { isOpen: isMobileOpen, close: closeMobile } = useMobileMenu();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Sign out failed", err);
      setIsSigningOut(false);
    }
  };

  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('sidebar-collapsed') === 'true') {
        setIsCollapsed(true);
      }
    } catch {
      // ignore
    }
    const timer = setTimeout(() => {
      setIsMounted(true);
      onReady?.();
    }, 50);
    return () => clearTimeout(timer);
  }, [onReady]);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "home" },
    {
      href: "/dashboard/native-meeting",
      label: "Native Meeting",
      icon: "video_camera_front",
    },
    {
      href: "/dashboard/external-meeting",
      label: "External Meeting",
      icon: "link",
    },
    { href: "/dashboard/statistics", label: "Statistics", icon: "bar_chart" },
    ...(isOrganization()
      ? [{ href: "/dashboard/channels", label: "Channels", icon: "tag" }]
      : []),
    ...(isOrganization()
      ? hasPermission("owner")
        ? [
            {
              href: "/dashboard/billing",
              label: "Corporate Billing",
              icon: "payments",
            },
          ]
        : []
      : [
          {
            href: "/dashboard/billing",
            label: "Billing & Invoices",
            icon: "payments",
          },
        ]),
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const sidebarContent = (
    <>
      <div>
        {/* Logo Header */}
        <div
          className={`h-20 flex items-center border-b border-[#E4E0D6] ${
            isMounted ? "transition-all duration-300" : ""
          } ${isCollapsed ? "justify-center px-0" : "justify-between px-6"}`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-[#FF416C]/10 rounded-full transition-colors flex-shrink-0 hidden md:flex"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className={`h-6 w-6 text-slate-900 ${isMounted ? "transition-transform duration-500 ease-in-out" : ""}`}
                style={{
                  transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                }}
              >
                <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </button>

            <span
              className={`text-xl font-bold tracking-tighter text-slate-900 origin-left ${
                isMounted ? "transition-all duration-300" : ""
              } ${
                isCollapsed
                  ? "opacity-0 max-w-0 scale-0"
                  : "opacity-100 max-w-[100px] scale-100"
              }`}
            >
              Relay
            </span>
          </div>

          {/* Mobile close button */}
          <button
            onClick={closeMobile}
            className="md:hidden p-2 hover:bg-[#FF416C]/10 rounded-full transition-colors text-[#8C8880] hover:text-slate-900"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
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
                onClick={closeMobile}
                className={`flex items-center rounded-xl font-medium text-sm transition-all relative ${isCollapsed ? "justify-center h-11 w-11 mx-auto p-0" : "gap-3 px-4 py-3"} ${
                  active
                    ? "bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-lg shadow-[#FF416C]/20"
                    : "text-[#8C8880] hover:text-slate-900 hover:bg-[#FF416C]/5"
                }`}
              >
                <span className="material-symbols-outlined text-[20px] flex-shrink-0">
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="transition-all duration-300 whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Settings & Sign Out */}
      <div className="p-4 space-y-2 mb-4 border-t border-[#E4E0D6] pt-6">
        <Link
          href="/dashboard/settings"
          title={isCollapsed ? "Settings" : undefined}
          onClick={closeMobile}
          className={`flex items-center rounded-xl font-medium text-sm transition-all relative ${isCollapsed ? "justify-center h-11 w-11 mx-auto p-0" : "gap-3 px-4 py-3"} ${
            isActive("/dashboard/settings")
              ? "bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-lg shadow-[#FF416C]/20"
              : "text-[#8C8880] hover:text-slate-900 hover:bg-[#FF416C]/5"
          }`}
        >
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">
            settings
          </span>
          {!isCollapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={`flex items-center text-left text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 rounded-xl font-medium text-sm transition-all hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isCollapsed ? "justify-center h-11 w-11 mx-auto p-0" : "w-full gap-3 px-4 py-3"}`}
        >
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">
            logout
          </span>
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`border-r border-[#E4E0D6] hidden md:flex flex-col justify-between bg-[#F0EDE6] h-screen sticky top-0 ${
          isMounted ? "transition-all duration-300 ease-in-out" : ""
        } ${isCollapsed ? "w-20" : "w-64"}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay — full-screen like landing page */}
      <div
        className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col px-4 md:px-10 pb-10 transition-all duration-300 md:hidden overflow-y-auto ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* Top header matching DashboardHeader position */}
        <div className="h-16 flex items-center justify-between flex-shrink-0">
          <button
            onClick={closeMobile}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex flex-col gap-1.5"
            aria-label="Close menu"
          >
            <span className="block w-5 h-0.5 bg-white rotate-45 translate-y-2 transition-all duration-300" />
            <span className="block w-5 h-0.5 bg-white opacity-0 transition-all duration-300" />
            <span className="block w-5 h-0.5 bg-white -rotate-45 -translate-y-2 transition-all duration-300" />
          </button>
        </div>

        <div className="flex flex-col gap-6 pt-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`text-xl font-bold font-helvetica border-b border-white/10 pb-4 transition-colors ${active ? "text-[#FF416C]" : "text-white"}`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/dashboard/settings"
            onClick={closeMobile}
            className={`text-xl font-bold font-helvetica border-b border-white/10 pb-4 transition-colors ${isActive("/dashboard/settings") ? "text-[#FF416C]" : "text-white"}`}
          >
            Settings
          </Link>
          <button
            onClick={() => { closeMobile(); handleSignOut(); }}
            className="mt-4 bg-white text-black px-6 py-4 rounded-full font-bold text-center text-base hover:bg-gray-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {isSigningOut && (
        <div className="fixed inset-0 z-[999] bg-[#FAF9F5] flex flex-col items-center justify-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#FF416C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 font-bold font-helvetica text-sm tracking-wide">Signing out...</p>
        </div>
      )}
    </>
  );
}
