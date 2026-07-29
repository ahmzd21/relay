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
    "bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-lg shadow-[#FF416C]/20 hover:shadow-xl hover:shadow-[#FF416C]/30",
  black: "bg-black text-white hover:bg-slate-800",
  white: "bg-white text-black border border-[#c4c7c7]/60 hover:bg-slate-50 shadow-sm",
  outline:
    "bg-white border border-[#c4c7c7]/30 text-slate-700 hover:border-[#FF416C]/30 hover:text-[#FF416C]",
  ghost: "bg-transparent text-slate-500 hover:text-slate-900",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  link: "bg-transparent text-[#FF416C] hover:text-[#FF4B2B] underline",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs rounded-xl",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-4 text-[15px] rounded-full",
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
    "font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100";

  const hoverScale =
    variant === "gradient" || variant === "black"
      ? "hover:scale-105"
      : "";

  if (variant === "link") {
    return (
      <button
        className={`${base} text-[10px] font-bold uppercase tracking-widest hover:text-[#FF4B2B] transition-colors ${className}`}
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
