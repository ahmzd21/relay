"use client";
import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  hint?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  hint,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`group bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-card transition-all duration-300 ${className}`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {icon && (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-canvas border border-border flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-accent text-[20px] sm:text-[22px]">
              {icon}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-2xl sm:text-3xl font-bold text-ink leading-none">
            {value}
          </p>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mt-1">
            {label}
          </p>
        </div>
      </div>
      {hint && <p className="text-xs text-faint mt-3">{hint}</p>}
    </div>
  );
}
