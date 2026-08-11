import React from "react";

export interface AvatarPerson {
  initials: string;
  name?: string;
  className?: string;
}

const defaultTones = [
  "bg-canvas text-ink border-border",
  "bg-canvas text-ink border-border",
];

interface AvatarStackProps {
  people: AvatarPerson[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export default function AvatarStack({
  people,
  max = 3,
  size = "sm",
  className = "",
}: AvatarStackProps) {
  const visible = people.slice(0, max);
  const rest = people.length - visible.length;
  const sizeClass =
    size === "sm" ? "w-6 h-6 text-[8px]" : "w-9 h-9 text-[10px]";

  return (
    <div className={`flex -space-x-1.5 ${className}`}>
      {visible.map((person, i) => (
        <div
          key={i}
          title={person.name}
          className={`rounded-full border-2 border-surface flex items-center justify-center font-bold ${sizeClass} ${
            person.className || defaultTones[i % defaultTones.length]
          }`}
        >
          {person.initials}
        </div>
      ))}
      {rest > 0 && (
        <div
          className={`rounded-full border-2 border-surface bg-canvas text-muted flex items-center justify-center font-bold ${sizeClass}`}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}
