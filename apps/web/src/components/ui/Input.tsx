"use client";
import React, { useState } from "react";

type InputRadius = "full" | "xl";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  radius?: InputRadius;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  radius = "full",
  type,
  className = "",
  id,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  const radiusClass = radius === "full" ? "rounded-full" : "rounded-xl";

  const baseInput =
    "w-full bg-[#FAF9F5] border border-[#E4E0D6] py-3 px-5 text-sm text-[#1c1b1b] placeholder:text-[#8C8880]/60 focus:outline-none focus:border-[#FF416C]/40 focus:ring-1 focus:ring-[#FF416C]/10 transition-all";

  const hasLeftIcon = !!leftIcon;
  const hasRightAction = isPassword || !!rightIcon;

  const paddingLeft = hasLeftIcon ? "pl-12" : "pl-5";
  const paddingRight = hasRightAction ? "pr-14" : "pr-5";

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8880] text-[20px] pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          type={inputType}
          className={`${baseInput} ${radiusClass} ${paddingLeft} ${paddingRight} ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : ""} ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C8880] hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}

        {!isPassword && rightIcon && (
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#8C8880] text-[20px] pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
