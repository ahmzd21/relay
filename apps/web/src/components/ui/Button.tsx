"use client";
import React from "react";

type ButtonVariant =
  | "gradient"
  | "black"
  | "white"
  | "outline"
  | "ghost"
  | "danger"
  | "link";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  gradient:
    "bg-gradient-to-r from-accent to-accent-deep text-white shadow-card hover:shadow-pop hover:brightness-105",
  black: "bg-chrome text-white hover:bg-chrome-raised",
  white:
    "bg-surface text-ink border border-border hover:border-border-strong hover:bg-canvas",
  outline:
    "bg-surface border border-border text-ink hover:border-ink hover:text-ink",
  ghost: "bg-transparent text-muted hover:text-ink hover:bg-canvas",
  danger: "bg-danger text-white hover:brightness-105",
  link: "bg-transparent text-accent hover:text-accent-deep",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-lg",
  lg: "px-7 py-3.5 text-[15px] rounded-xl",
};

export default function Button({
  variant = "gradient",
  size = "md",
  icon,
  iconPosition = "left",
  fullWidth = false,
  isLoading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    "font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1";

  const hoverScale =
    variant === "gradient" || variant === "black" || variant === "danger"
      ? "hover:scale-[1.02] active:scale-[0.99]"
      : "";

  if (variant === "link") {
    return (
      <button
        className={`${base} text-[11px] font-bold uppercase tracking-widest ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {icon && iconPosition === "left" && (
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
        )}
      </button>
    );
  }

  return (
    <button
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${hoverScale} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <span className="material-symbols-outlined text-[18px]">
              {icon}
            </span>
          )}
          {children}
          {icon && iconPosition === "right" && (
            <span className="material-symbols-outlined text-[18px]">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
}
