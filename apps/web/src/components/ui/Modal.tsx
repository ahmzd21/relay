"use client";
import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className={`bg-[#FFFDF8] rounded-2xl shadow-2xl border border-[#E4E0D6] w-full max-w-md mx-4 overflow-hidden ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between p-6 pb-0">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-[#E4E0D6] flex items-center justify-center text-[#8C8880] hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
