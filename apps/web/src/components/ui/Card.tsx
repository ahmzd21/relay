import React from "react";

type CardVariant = "white" | "dark" | "gradient" | "ghost";

type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  white: "bg-[#FFFDF8] border border-[#E4E0D6] shadow-warm",
  dark: "bg-[#FFFDF8] border border-[#E4E0D6] text-[#1c1b1b]",
  gradient:
    "bg-[#FFFDF8] text-[#1c1b1b] border border-[#E4E0D6]",
  ghost: "bg-transparent",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export default function Card({
  children,
  variant = "white",
  padding = "md",
  hover = false,
  className = "",
  onClick,
}: CardProps) {
  const hoverClass = hover
    ? "hover:shadow-lg hover:-translate-y-0.5 hover:border-[#FF416C]/30 transition-all duration-300"
    : "";

  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverClass} text-left w-full ${className}`}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}
