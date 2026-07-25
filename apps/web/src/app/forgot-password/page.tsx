'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-[#1c1b1b] selection:bg-black selection:text-white overflow-x-hidden font-helvetica">
      <style dangerouslySetInnerHTML={{
        __html: `
        .auth-input {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (min-width: 1024px) {
          .auth-input:focus {
              background: #ffffff !important;
              border-color: #000000 !important;
              outline: none;
              box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
          }
        }

        @media (max-width: 1023px) {
          .auth-input {
            color: #000000 !important;
          }
          .auth-input:focus {
              background: rgba(255, 255, 255, 0.9) !important;
              border-color: #FF416C !important;
              outline: none;
              box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.2);
          }
        }

        .cta-button {
            transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 24px -10px rgba(255, 65, 108, 0.3);
        }
      `}} />

      <div className="flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden min-h-screen">

        {/* Left Side (Desktop Editorial) */}
        <section className="hidden lg:flex bg-black lg:w-[50%] relative flex-col p-[128px] pb-[48px] justify-between min-h-screen">
          <div className="relative z-10 flex flex-col gap-[64px]">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-10 w-10 text-white">
                <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <Link href="/" className="text-[32px] font-bold tracking-tight font-helvetica text-white">Relay</Link>
            </div>
            <div className="max-w-lg">
              <h2 className="text-[64px] font-bold tracking-tight font-helvetica leading-[1.05] text-white mb-[64px]">
                Connect with clarity, speak with confidence.
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] mb-[16px]"></div>
              <p className="text-white/60 text-[18px] leading-relaxed font-helvetica">
                Real-time translation for meetings that matter. Break language barriers without breaking your workflow.
              </p>
            </div>
          </div>
          <footer className="relative z-10 flex flex-col items-center justify-center gap-y-4 w-full mt-auto">
            <div className="flex items-center justify-center gap-x-[64px]">
              <a className="text-[11px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.1em] font-['Inter']" href="#">Privacy</a>
              <a className="text-[11px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.1em] font-['Inter']" href="#">Terms</a>
              <a className="text-[11px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.1em] font-['Inter']" href="#">Security</a>
            </div>
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.1em] font-['Inter']">© 2026 Relay AI</span>
          </footer>
        </section>

        {/* Right Side / Mobile Form */}
        <main className="relative z-10 w-full lg:w-[50%] flex flex-col justify-between items-center p-[24px] md:p-[40px] bg-[#FAF9F5] min-h-screen lg:h-full lg:overflow-y-auto">

          {/* Ambient gradient blobs */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF416C]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-20 -left-48 w-80 h-80 bg-[#FF4B2B]/5 blur-[100px] rounded-full pointer-events-none" />

          {/* Mobile Header Brand */}
          <div className="relative z-10 w-full max-w-[420px] flex items-center gap-3 lg:hidden pt-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-8 w-8 text-slate-900">
              <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <Link href="/" className="text-[24px] font-bold tracking-tight font-helvetica text-slate-900">Relay</Link>
          </div>

          <div className="relative z-10 w-full max-w-[420px] my-auto py-12 space-y-[40px] lg:space-y-[32px]">
            <div className="text-left">
              <h1 className="text-[36px] lg:text-[48px] font-bold font-helvetica mb-[8px] text-slate-900 tracking-tight">Forgot Password</h1>
              <p className="text-slate-600 text-[15px]">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            {isSuccess ? (
              <div className="text-center space-y-6 py-8">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF416C]/20">
                  <span className="material-symbols-outlined text-white text-[32px]">mark_email_read</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-helvetica text-slate-900 mb-2">Check your email</h2>
                  <p className="text-slate-500 text-sm">
                    If an account exists with<br />
                    <span className="font-bold text-slate-900">{email}</span>, we&apos;ve sent a password reset link.
                  </p>
                </div>
                <Link href="/login" className="inline-block text-sm text-slate-900 font-bold hover:underline transition-all">
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-[16px]">
                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm font-medium">
                    {errorMsg}
                  </div>
                )}
                <div className="space-y-[4px]">
                  <label className="block text-[10px] uppercase tracking-[0.1em] font-bold font-['Inter'] text-slate-400 ml-4 mb-2">Email Address</label>
                  <input
                    className="auth-input w-full px-6 py-4 rounded-full border border-[#c4c7c7]/30 
                             text-slate-900 bg-white/50 
                             placeholder:text-slate-400 text-[15px]"
                    placeholder="name@domain.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-[16px]">
                  <button className="cta-button w-full py-4 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white rounded-full text-[15px] font-bold shadow-xl shadow-[#FF416C]/20 flex items-center justify-center gap-2 group" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <>
                        Send Reset Link
                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <p className="text-center text-sm text-slate-500">
              Remember your password? <Link className="text-slate-900 font-bold hover:underline transition-all" href="/login">Sign in</Link>
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
