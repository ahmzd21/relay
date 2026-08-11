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
  white: "bg-surface border border-border shadow-card",
  dark: "bg-chrome border border-border text-ink",
  gradient: "bg-surface text-ink border border-border shadow-card",
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
    ? "hover:shadow-pop hover:-translate-y-0.5 hover:border-border-strong transition-all duration-300"
    : "";

  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverClass} text-left w-full ${className}`}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}
