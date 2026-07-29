"use client";
import React from "react";

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export default function Toggle({
  enabled,
  onToggle,
  disabled = false,
  className = "",
}: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`w-12 h-7 rounded-full relative transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        enabled
          ? "bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] shadow-sm shadow-[#FF416C]/20"
          : "bg-slate-300"
      } ${className}`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
