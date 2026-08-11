"use client";
import React from "react";
import Link from "next/link";

interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * Shared split-screen shell for auth pages.
 * Left: dark editorial panel (chrome). Right: light form area.
 */
export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen text-ink bg-canvas selection:bg-chrome selection:text-white overflow-x-hidden">
      <div className="flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden min-h-screen">
        {/* Left — dark editorial panel */}
        <section className="hidden lg:flex bg-chrome lg:w-[50%] relative flex-col p-[96px] pb-[48px] justify-between min-h-screen">
          <div className="relative z-10 flex flex-col gap-[56px]">
            <Link href="/" className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className="h-10 w-10 text-white"
              >
                <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-[28px] font-bold tracking-tight text-white">
                Relay
              </span>
            </Link>
            <div className="max-w-lg">
              <h2 className="text-[56px] font-bold tracking-tight leading-[1.05] text-white mb-[40px]">
                Connect with clarity, speak with confidence.
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-accent to-accent-deep mb-[16px]"></div>
              <p className="text-white/50 text-[18px] leading-relaxed">
                Real-time translation for meetings that matter. Break language
                barriers without breaking your workflow.
              </p>
            </div>
          </div>
          <footer className="relative z-10 flex flex-col items-center justify-center gap-y-4 w-full mt-auto">
            <div className="flex items-center justify-center gap-x-[64px]">
              {["Privacy", "Terms", "Security"].map((item) => (
                <a
                  key={item}
                  className="text-[11px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.1em]"
                  href="#"
                >
                  {item}
                </a>
              ))}
            </div>
            <span className="text-[11px] font-bold text-white/25 uppercase tracking-[0.1em]">
              &copy; 2026 Relay AI
            </span>
          </footer>
        </section>

        {/* Right — form area */}
        <main className="relative z-10 w-full lg:w-[50%] flex flex-col justify-between items-center p-6 md:p-10 bg-canvas min-h-screen lg:h-full lg:overflow-y-auto">
          {/* Mobile brand */}
          <div className="relative z-10 w-full max-w-[420px] flex items-center gap-3 lg:hidden pt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="h-8 w-8 text-ink"
            >
              <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <Link href="/" className="text-[24px] font-bold tracking-tight">
              Relay
            </Link>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
