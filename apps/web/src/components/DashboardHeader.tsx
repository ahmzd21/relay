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
  const {
    unreadCount,
    showBellDropdown,
    setShowBellDropdown,
    notifications,
    dismissNotification,
  } = useNotifications();

  return (
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-10 bg-transparent z-20 sticky top-0">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggle}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-chrome/5 transition-colors"
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 bg-ink transition-all duration-300" />
        </button>
      </div>

      {searchPlaceholder ? (
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-md items-center">
          <span className="material-symbols-outlined absolute left-4 text-faint text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full bg-surface border border-border rounded-full py-2.5 pl-12 pr-4 text-[15px] text-ink placeholder:text-faint shadow-card focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
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
            className="relative h-9 w-9 md:h-10 md:w-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-card hover:border-border-strong hover:shadow-pop transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-ink text-[20px]">
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center px-1 rounded-full bg-gradient-to-r from-accent to-accent-deep text-white text-[9px] font-bold shadow-card">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showBellDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowBellDropdown(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-80 bg-surface border border-border rounded-xl shadow-pop overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <p className="text-sm font-bold text-ink">
                    Notifications
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <span className="material-symbols-outlined text-faint text-[32px] mb-2">
                        notifications_off
                      </span>
                      <p className="text-xs text-muted">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 border-b border-border/30 hover:bg-canvas cursor-pointer transition-colors ${!n.read ? "bg-accent/5" : ""}`}
                        onClick={() => dismissNotification(n.id)}
                      >
                        <p className="text-sm font-bold text-ink">{n.title}</p>
                        <p className="text-xs text-muted mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-faint mt-1">{n.time}</p>
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
