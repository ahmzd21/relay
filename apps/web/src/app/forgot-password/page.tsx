'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Input, Button } from '@/components/ui';
import AuthShell from '@/components/AuthShell';

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
    <AuthShell>
      <div className="relative z-10 w-full max-w-[420px] my-auto py-12 space-y-6 lg:space-y-8">
        <div className="text-left">
          <h1 className="text-3xl lg:text-[48px] font-bold mb-2 text-ink tracking-tight">Forgot Password</h1>
          <p className="text-muted text-[15px]">
            Enter your email and we&apos;ll send you a link to reset your password.
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
                If an account exists with<br />
                <span className="font-bold text-ink">{email}</span>, we&apos;ve sent a password reset link.
              </p>
            </div>
            <Link href="/login" className="inline-block text-sm text-ink font-bold hover:underline transition-all">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="pt-2">
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                fullWidth
                isLoading={isLoading}
                icon="arrow_forward"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted">
          Remember your password? <Link className="text-ink font-bold hover:underline transition-all" href="/login">Sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
