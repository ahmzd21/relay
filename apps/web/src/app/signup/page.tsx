'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Input, Button } from '@/components/ui';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                    }) => void;
                    prompt: () => void;
                };
                oauth2: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        callback: (response: { access_token: string }) => void;
                    }) => { requestAccessToken: () => void };
                };
            };
        };
    }
}

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getStrengthLabel(score: number): string {
  if (score <= 1) return 'Weak';
  if (score <= 3) return 'Fair';
  if (score === 4) return 'Strong';
  return 'Very Strong';
}

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setIsGoogleLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google sign-in failed');
      }

      router.push(data.isNewUser ? '/onboarding' : '/dashboard');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed');
      setIsGoogleLoading(false);
    }
  }, [router]);

  const triggerGoogleSignIn = () => {
    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '432546754961-schqiqqncgmef7fstqmsl09fct7j1nos.apps.googleusercontent.com',
        scope: 'email profile',
        callback: (response) => {
          if (response.access_token) {
            handleGoogleResponse({ credential: response.access_token });
          }
        },
      });
      client.requestAccessToken();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      setSubmittedEmail(email);
      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to sign up');
      setIsLoading(false);
    }
  };

  const passwordScore = getPasswordStrength(password);

  return (
    <div className="min-h-screen text-[#1c1b1b] selection:bg-black selection:text-white overflow-x-hidden font-helvetica">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

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
              <a className="text-[11px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.1em]" href="#">Privacy</a>
              <a className="text-[11px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.1em]" href="#">Terms</a>
              <a className="text-[11px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.1em]" href="#">Security</a>
            </div>
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.1em]">&copy; 2026 Relay AI</span>
          </footer>
        </section>

        {/* Right Side / Mobile Form */}
        <main className="relative z-10 w-full lg:w-[50%] flex flex-col justify-between items-center p-6 md:p-10 bg-[#FAF9F5] min-h-screen">

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

          <div className="relative z-10 w-full max-w-[420px] my-auto py-12 space-y-6 lg:space-y-8">
            <div className="text-left">
              <h1 className="text-3xl lg:text-[48px] font-bold font-helvetica mb-2 text-slate-900 tracking-tight">Join Relay</h1>
              <p className="text-slate-600 text-[15px]">
                Create your account and start translating in seconds.
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
                    We sent a verification link to<br />
                    <span className="font-bold text-slate-900">{submittedEmail}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Didn&apos;t receive it? Check your spam folder or{' '}
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch('/api/auth/resend-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: submittedEmail }),
                      });
                    }}
                    className="text-[#FF416C] font-bold hover:underline"
                  >
                    resend email
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm font-medium">
                    {errorMsg}
                  </div>
                )}

                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                              i < passwordScore
                                ? passwordScore <= 1
                                  ? 'bg-rose-500'
                                  : passwordScore <= 3
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-500'
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[11px] font-bold tracking-wide ${
                        passwordScore <= 1
                          ? 'text-rose-500'
                          : passwordScore <= 3
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                      }`}>
                        {getStrengthLabel(passwordScore)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    icon="arrow_forward"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-[1px] flex-grow bg-[#c4c7c7]/40"></div>
                  <span className="text-[12px] text-slate-400 uppercase tracking-widest font-bold">or</span>
                  <div className="h-[1px] flex-grow bg-[#c4c7c7]/40"></div>
                </div>

                <Button
                  type="button"
                  variant="white"
                  size="lg"
                  fullWidth
                  onClick={triggerGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-slate-900 text-[15px] font-semibold">
                    {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                  </span>
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-slate-500">
              Already have an account? <Link className="text-slate-900 font-bold hover:underline transition-all" href="/login">Log in</Link>
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
