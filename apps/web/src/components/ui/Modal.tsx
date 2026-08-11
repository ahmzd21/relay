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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-chrome/50 backdrop-blur-sm">
      <div
        className={`bg-surface rounded-2xl shadow-float border border-border w-full max-w-md mx-4 overflow-hidden ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between p-6 pb-0">
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all cursor-pointer"
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
