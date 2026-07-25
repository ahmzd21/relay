"use client";
import React from "react";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

interface DashboardHeaderProps {
  searchPlaceholder?: string;
  rightContent?: React.ReactNode;
}

export default function DashboardHeader({
  searchPlaceholder,
  rightContent,
}: DashboardHeaderProps) {
  return (
    <header className="h-20 flex items-center justify-between px-6 md:px-10 bg-transparent z-20 sticky top-0">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 -ml-2 text-white/50">
          <span className="material-symbols-outlined">menu</span>
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
            className="w-full bg-white border border-[#c4c7c7]/30 rounded-full py-2.5 pl-12 pr-4 text-[15px] text-[#1c1b1b] placeholder:text-[#8C8880] focus:outline-none focus:border-[#FF416C]/50 focus:ring-1 focus:ring-[#FF416C]/20 transition-all"
          />
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
        {rightContent}
        <button className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20 transition-colors">
          <span className="material-symbols-outlined text-white text-[18px]">
            notifications
          </span>
        </button>
        <WorkspaceSwitcher />
      </div>
    </header>
  );
}
