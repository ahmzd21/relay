'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Button } from '@/components/ui';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="relative z-10 w-full max-w-[420px] my-auto py-12 space-y-6 lg:space-y-8">
        <div className="text-center space-y-6 py-8">
          <div className="w-16 h-16 mx-auto bg-danger/10 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-danger text-[32px]">link_off</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink mb-2">Invalid Link</h2>
            <p className="text-muted text-sm">This password reset link is invalid or missing a token.</p>
          </div>
          <Link href="/forgot-password" className="inline-block text-sm text-ink font-bold hover:underline transition-all">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      router.push('/login?reset=true');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reset password');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[420px] my-auto py-12 space-y-6 lg:space-y-8">
      <div className="text-left">
        <h1 className="text-3xl lg:text-[48px] font-bold mb-2 text-ink tracking-tight">Reset Password</h1>
        <p className="text-muted text-[15px]">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <Input
          label="New Password"
          type="password"
          placeholder="Create a secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
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
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-muted">
        <Link className="text-ink font-bold hover:underline transition-all" href="/login">Back to Sign In</Link>
      </p>
    </div>
  );
}

import AuthShell from '@/components/AuthShell';

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="relative z-10 w-full max-w-[420px] my-auto py-12 text-center text-faint">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
