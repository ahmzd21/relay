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
    "bg-gradient-to-r from-accent to-accent-deep text-white shadow-card",
  dark: "bg-chrome text-white",
  outline: "bg-surface border border-border text-muted",
  success: "bg-success/10 border border-success/25 text-success",
  warning: "bg-warning/10 border border-warning/25 text-warning",
  danger: "bg-danger/10 border border-danger/25 text-danger",
  info: "bg-info/10 border border-info/25 text-info",
  muted: "bg-canvas text-muted border border-border",
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
      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider ${variantStyles[variant]} ${sizeStyles[size]} ${pill ? "rounded-full" : "rounded"} ${className}`}
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
