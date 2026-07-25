'use client';

import React, { useState, Suspense, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [verifiedMsg, setVerifiedMsg] = useState<string | null>(
        searchParams.get('verified') === 'true' ? 'Email verified successfully! You can now sign in.' : null
    );
    const [resetMsg, setResetMsg] = useState<string | null>(
        searchParams.get('reset') === 'true' ? 'Password has been reset successfully. You can now sign in.' : null
    );

    const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
        setIsGoogleLoading(true);
        setErrorMsg(null);
        setVerifiedMsg(null);

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
        setVerifiedMsg(null);
        setResetMsg(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                if (data.requiresVerification) {
                    setErrorMsg('Please verify your email before logging in. Check your inbox for the verification link.');
                } else {
                    throw new Error(data.error || 'Failed to sign in');
                }
                setIsLoading(false);
                return;
            }

            setIsLoading(false);
            router.push(data.isNewUser ? '/onboarding' : '/dashboard');
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Failed to sign in');
            setIsLoading(false);
        }
    };

    return (
        <div className="relative z-10 w-full max-w-[420px] my-auto py-12 space-y-[40px] lg:space-y-[32px]">
            <div className="text-left">
                <h1 className="text-[36px] lg:text-[48px] font-bold font-helvetica mb-[8px] text-slate-900 tracking-tight">Welcome Back</h1>
                <p className="text-slate-600 text-[15px]">
                    Sign in to your account and pick up where you left off.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-[16px]">
                <div className="space-y-[4px]">
                    {verifiedMsg && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 text-sm font-medium">
                            {verifiedMsg}
                        </div>
                    )}
                    {resetMsg && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 text-sm font-medium">
                            {resetMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm font-medium">
                            {errorMsg}
                        </div>
                    )}
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
                <div className="space-y-[4px]">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold font-['Inter'] text-slate-400 ml-4 mb-2">Password</label>
                    <div className="relative">
                        <input
                            className="auth-input w-full px-6 py-4 rounded-full border border-[#c4c7c7]/30 
                            text-slate-900 bg-white/50 
                            placeholder:text-slate-400 text-[15px]"
                            placeholder="Enter your password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                    </div>
                    <div className="text-right mr-6">
                        <Link href="/forgot-password" className="inline-block text-[10px] uppercase tracking-[0.1em] font-bold font-['Inter'] text-slate-500 hover:text-slate-900 transition-all mb-2">
                            Forgot Password?
                        </Link>
                    </div>
                </div>

                <div className="pt-[16px]">
                    <button className="cta-button w-full py-4 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white rounded-full text-[15px] font-bold shadow-xl shadow-[#FF416C]/20 flex items-center justify-center gap-2 group cursor-pointer" type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-3">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            <>
                                Sign In
                                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-4 py-4">
                    <div className="h-[1px] flex-grow bg-[#c4c7c7]/40"></div>
                    <span className="text-[12px] text-slate-400 uppercase tracking-widest font-bold">or</span>
                    <div className="h-[1px] flex-grow bg-[#c4c7c7]/40"></div>
                </div>

                <button
                    type="button"
                    onClick={triggerGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="google-button flex items-center justify-center gap-3 w-full py-4 px-6 border border-[#c4c7c7]/60 rounded-full font-medium bg-white hover:bg-white transition-all duration-300 shadow-sm disabled:opacity-50 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
                >
                    {isGoogleLoading ? (
                        <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    )}
                    <span className="text-slate-900 text-[15px] font-semibold">
                        {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                    </span>
                </button>
            </form>

            <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account? <Link className="text-slate-900 font-bold hover:underline transition-all" href="/signup">Sign up</Link>
            </p>
        </div>
    );
}

import Script from 'next/script';

export default function LoginPage() {
    return (
        <div className="min-h-screen text-[#1c1b1b] selection:bg-black selection:text-white overflow-x-hidden font-helvetica">
            <Script 
                src="https://accounts.google.com/gsi/client" 
                strategy="afterInteractive"
            />
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

                    <Suspense fallback={<div className="relative z-10 w-full max-w-[420px] my-auto py-12 text-center text-slate-400">Loading...</div>}>
                        <LoginForm />
                    </Suspense>

                </main>
            </div>
        </div>
    );
}
