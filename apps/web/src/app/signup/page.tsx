'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Input, Button } from '@/components/ui';
import AuthShell from '@/components/AuthShell';

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
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '432546754961-schqiqqncgmef7fstqmsl09fct7j1nos.apps.googleusercontent.com',
        callback: (response) => {
          if (response.credential) {
            handleGoogleResponse({ credential: response.credential });
          }
        },
      });
      window.google.accounts.id.prompt();
    } else {
      setErrorMsg('Google Sign-In is initializing. Please wait a second and try again.');
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
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <AuthShell>
        <div className="relative z-10 w-full max-w-[420px] my-auto py-12 space-y-6 lg:space-y-8">
          <div className="text-left">
            <h1 className="text-3xl lg:text-[48px] font-bold mb-2 text-ink tracking-tight">Join Relay</h1>
            <p className="text-muted text-[15px]">
              Create your account and start translating in seconds.
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 mx-auto bg-success/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-success text-[32px]">mark_email_read</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-ink mb-2">Check your email</h2>
                <p className="text-muted text-sm">
                  We sent a verification link to<br />
                  <span className="font-bold text-ink">{submittedEmail}</span>
                </p>
              </div>
              <p className="text-xs text-faint">
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
                  className="text-accent font-bold hover:underline"
                >
                  resend email
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm font-medium">
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
                                ? 'bg-danger/100'
                                : passwordScore <= 3
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-500'
                              : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-bold tracking-wide ${
                      passwordScore <= 1
                        ? 'text-danger'
                        : passwordScore <= 3
                          ? 'text-warning'
                          : 'text-success'
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
                <div className="h-[1px] flex-grow bg-border"></div>
                <span className="text-[12px] text-faint uppercase tracking-widest font-bold">or</span>
                <div className="h-[1px] flex-grow bg-border"></div>
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
                <span className="text-ink text-[15px] font-semibold">
                  {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </span>
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted">
            Already have an account? <Link className="text-ink font-bold hover:underline transition-all" href="/login">Log in</Link>
          </p>
        </div>
      </AuthShell>
    </>
  );
}
