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
      className={`w-12 h-7 rounded-full relative transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
        enabled
          ? "bg-gradient-to-r from-accent to-accent-deep shadow-card"
          : "bg-border-strong"
      } ${className}`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-surface shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
