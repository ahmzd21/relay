"use client";
import React from "react";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { useNotifications } from "@/contexts/NotificationContext";

interface DashboardHeaderProps {
  searchPlaceholder?: string;
  rightContent?: React.ReactNode;
}

export default function DashboardHeader({
  searchPlaceholder,
  rightContent,
}: DashboardHeaderProps) {
  const { toggle } = useMobileMenu();
  const { unreadCount, showBellDropdown, setShowBellDropdown, notifications, dismissNotification } = useNotifications();

  return (
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-10 bg-transparent z-20 sticky top-0">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggle}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-black/5 transition-colors"
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 bg-[#1c1b1b] transition-all duration-300" />
        </button>
      </div>

      {searchPlaceholder ? (
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-md items-center">
          <span className="material-symbols-outlined absolute left-4 text-[#8C8880] text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full bg-white border border-[#E4E0D6]/30 rounded-full py-2.5 pl-12 pr-4 text-[15px] text-[#1c1b1b] placeholder:text-[#8C8880] focus:outline-none focus:border-[#FF416C]/50 focus:ring-1 focus:ring-[#FF416C]/20 transition-all"
          />
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden sm:block">{rightContent}</div>
        <WorkspaceSwitcher />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowBellDropdown(!showBellDropdown)}
            className="relative h-9 w-9 md:h-10 md:w-10 rounded-xl bg-[#FFFDF8] border border-[#E4E0D6] flex items-center justify-center shadow-warm hover:border-[#FF416C]/30 hover:shadow-warm-md transition-all"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[#1c1b1b] text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center px-1 rounded-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white text-[9px] font-bold shadow-sm shadow-[#FF416C]/20">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showBellDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowBellDropdown(false)} />
              <div className="absolute right-0 mt-2 z-50 w-80 bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl shadow-warm-md overflow-hidden">
                <div className="p-4 border-b border-[#E4E0D6]/50">
                  <p className="text-sm font-bold font-helvetica text-slate-900">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <span className="material-symbols-outlined text-[#c4c7c7] text-[32px] mb-2">notifications_off</span>
                      <p className="text-xs text-slate-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 border-b border-[#E4E0D6]/30 hover:bg-[#F0EDE6]/50 cursor-pointer transition-colors ${!n.read ? 'bg-[#FF416C]/5' : ''}`}
                        onClick={() => dismissNotification(n.id)}
                      >
                        <p className="text-sm font-bold text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>


      </div>
    </header>
  );
}
