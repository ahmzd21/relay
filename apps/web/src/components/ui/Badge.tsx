import React from "react";

type BadgeVariant =
  | "gradient"
  | "dark"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

type BadgeSize = "xs" | "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  pill?: boolean;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gradient:
    "bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm shadow-[#FF416C]/20",
  dark: "bg-[#FFFDF8] text-[#1c1b1b] border border-[#E4E0D6]",
  outline:
    "bg-white border border-[#E4E0D6]/30 text-slate-600",
  success:
    "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600",
  warning:
    "bg-amber-50 text-amber-600 border border-amber-200",
  danger:
    "bg-rose-500/10 border border-rose-500/30 text-rose-500",
  info:
    "bg-indigo-50 text-indigo-600 border border-indigo-200",
  muted:
    "bg-slate-100 text-slate-600 border border-slate-200",
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: "px-2 py-0.5 text-[9px]",
  sm: "px-2.5 py-0.5 text-[10px]",
  md: "px-3 py-1 text-[10px]",
};

export default function Badge({
  children,
  variant = "gradient",
  size = "sm",
  pill = true,
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider ${variantStyles[variant]} ${sizeStyles[size]} ${pill ? "rounded-full" : "rounded"} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
