"use client";
import React from "react";

interface SegmentOption {
  key: string;
  label: string;
  icon?: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps) {
  return (
    <div
      className={`flex gap-1 bg-surface border border-border p-1 rounded-xl overflow-x-auto no-scrollbar ${className}`}
    >
      {options.map((option) => {
        const active = value === option.key;
        return (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              active
                ? "bg-gradient-to-r from-accent to-accent-deep text-white shadow-card"
                : "text-muted hover:text-ink"
            }`}
          >
            {option.icon && (
              <span className="material-symbols-outlined text-[16px]">
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
