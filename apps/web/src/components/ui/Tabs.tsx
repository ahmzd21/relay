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

export default function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={`flex gap-1 bg-[#FFFDF8] border border-[#E4E0D6] p-1 rounded-xl overflow-x-auto no-scrollbar ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase font-helvetica transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === tab.key
              ? "bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900"
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
