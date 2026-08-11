'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  onConfirm: () => void;
  loading?: boolean;
  icon?: string;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
  loading = false,
  icon = 'logout',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => cancelButtonRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const confirmButtonClass =
    variant === 'destructive'
      ? 'bg-danger/100 hover:bg-danger text-white shadow-lg shadow-rose-500/20'
      : 'bg-gradient-to-r from-accent to-accent-deep text-white shadow-lg ';

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-chrome/60 backdrop-blur-sm"
        onClick={() => !loading && onOpenChange(false)}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-[380px] mx-4 bg-surface rounded-2xl shadow-2xl p-6 space-y-5"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          variant === 'destructive' ? 'bg-danger/10' : 'bg-canvas'
        }`}>
          <span className={`material-symbols-outlined text-[24px] ${
            variant === 'destructive' ? 'text-danger' : 'text-muted'
          }`}>
            {icon}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="text-[17px] font-semibold text-ink tracking-tight">{title}</h3>
          <p className="text-[14px] text-muted leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            ref={cancelButtonRef}
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-muted hover:text-ink hover:bg-canvas transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50 flex items-center gap-2 ${confirmButtonClass}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing out...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
