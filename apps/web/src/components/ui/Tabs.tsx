"use client";
import React from "react";

interface Tab {
  key: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps) {
  return (
    <div
      className={`flex gap-1 bg-surface border border-border p-1 rounded-xl overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
            activeTab === tab.key
              ? "bg-gradient-to-r from-accent to-accent-deep text-white shadow-card"
              : "text-muted hover:text-ink"
          }`}
        >
          {tab.icon && (
            <span className="material-symbols-outlined text-[16px]">
              {tab.icon}
            </span>
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
