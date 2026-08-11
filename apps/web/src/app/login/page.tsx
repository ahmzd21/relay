'use client';

import React, { useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [verifiedMsg, setVerifiedMsg] = useState<string | null>(
        searchParams.get('verified') === 'true' ? 'Email verified successfully! You can now sign in.' : null
    );
    const [resetMsg, setResetMsg] = useState<string | null>(
        searchParams.get('reset') === 'true' ? 'Password has been reset successfully. You can now sign in.' : null
    );

    // 2FA state
    const [requires2FA, setRequires2FA] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
    const [is2FALoading, setIs2FALoading] = useState(false);
    const [useBackupCode, setUseBackupCode] = useState(false);

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

            if (data.requires2FA) {
                setTempToken(data.tempToken);
                setRequires2FA(true);
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

    const handle2FASubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIs2FALoading(true);
        setTwoFactorError(null);

        try {
            const res = await fetch('/api/auth/2fa/verify-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken, code: twoFactorCode }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Invalid code');
            }

            router.push(data.isNewUser ? '/onboarding' : '/dashboard');
        } catch (err: unknown) {
            setTwoFactorError(err instanceof Error ? err.message : 'Invalid code');
            setIs2FALoading(false);
        }
    };

    return (
        <div className="relative z-10 w-full max-w-[420px] my-auto py-12 space-y-6 lg:space-y-8">
            {requires2FA ? (
                <>
                    <div className="text-left">
                        <h1 className="text-3xl lg:text-[48px] font-bold mb-2 text-ink tracking-tight">Two-Factor Authentication</h1>
                        <p className="text-muted text-[15px]">
                            {useBackupCode
                                ? 'Enter one of your backup codes.'
                                : 'Enter the 6-digit code from your authenticator app.'}
                        </p>
                    </div>

                    <form onSubmit={handle2FASubmit} className="space-y-4">
                        {twoFactorError && (
                            <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm font-medium">
                                {twoFactorError}
                            </div>
                        )}

                        <Input
                            label={useBackupCode ? 'Backup Code' : 'Verification Code'}
                            type="text"
                            placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            required
                            maxLength={useBackupCode ? 9 : 6}
                            className={useBackupCode ? 'font-mono' : 'text-center text-2xl tracking-[0.5em] font-mono'}
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="gradient"
                                size="lg"
                                fullWidth
                                isLoading={is2FALoading}
                                icon="arrow_forward"
                            >
                                {is2FALoading ? 'Verifying...' : 'Verify'}
                            </Button>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setUseBackupCode(!useBackupCode);
                                setTwoFactorCode('');
                                setTwoFactorError(null);
                            }}
                            className="w-full text-center text-[12px] uppercase tracking-[0.1em] font-bold text-muted hover:text-ink transition-all pt-2"
                        >
                            {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
                        </button>
                    </form>
                </>
            ) : (
                <>
                    <div className="text-left">
                        <h1 className="text-3xl lg:text-[48px] font-bold mb-2 text-ink tracking-tight">Welcome Back</h1>
                        <p className="text-muted text-[15px]">
                            Sign in to your account and pick up where you left off.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {verifiedMsg && (
                            <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-success text-sm font-medium">
                                {verifiedMsg}
                            </div>
                        )}
                        {resetMsg && (
                            <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-success text-sm font-medium">
                                {resetMsg}
                            </div>
                        )}
                        {errorMsg && (
                            <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm font-medium">
                                {errorMsg}
                            </div>
                        )}

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
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <div className="text-right mt-2">
                                <Link href="/forgot-password" className="inline-block text-[10px] uppercase tracking-[0.1em] font-bold text-muted hover:text-ink transition-all">
                                    Forgot Password?
                                </Link>
                            </div>
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
                                {isLoading ? 'Signing in...' : 'Sign In'}
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
                </>
            )}

            <p className="text-center text-sm text-muted">
                Don&apos;t have an account? <Link className="text-ink font-bold hover:underline transition-all" href="/signup">Sign up</Link>
            </p>
        </div>
    );
}

import Script from 'next/script';
import AuthShell from '@/components/AuthShell';

export default function LoginPage() {
    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
            />
            <AuthShell>
                <Suspense fallback={<div className="relative z-10 w-full max-w-[420px] my-auto py-12 text-center text-faint">Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </AuthShell>
        </>
    );
}
