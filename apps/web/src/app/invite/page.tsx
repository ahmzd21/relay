'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';

interface InviteDetails {
  email: string;
  role: string;
  workspace: { id: string; name: string; type: string };
  invitedBy: string;
  expiresAt: string;
  hasAccount: boolean;
  isAlreadyMember: boolean;
}

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth();
  const { refetchWorkspaces } = useWorkspace();

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(() => !!token);
  const [error, setError] = useState<string | null>(() => token ? null : 'No invite link provided.');
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invalid invite');
        } else {
          setInvite(data.invite);
        }
      } catch {
        setError('Failed to load invite details.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to accept invite');
        return;
      }
      setAccepted(true);
      await refetchWorkspaces();
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch {
      setError('Failed to accept invite.');
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-muted">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="bg-surface border border-border rounded-2xl shadow-card p-8 max-w-md w-full mx-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-xl bg-danger/10 flex items-center justify-center mx-auto border border-danger/20">
            <span className="material-symbols-outlined text-danger text-[32px]">error</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-ink">Invite Error</h1>
            <p className="text-sm text-muted">{error}</p>
          </div>
          <Link href="/dashboard">
            <Button variant="gradient" fullWidth>
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="bg-surface border border-border rounded-2xl shadow-card p-8 max-w-md w-full mx-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-xl bg-success/10 flex items-center justify-center mx-auto border border-emerald-200">
            <span className="material-symbols-outlined text-success text-[32px]">check_circle</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-ink">Welcome to {invite?.workspace.name}!</h1>
            <p className="text-sm text-muted">You&apos;re now a member. Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="bg-surface border border-border rounded-2xl shadow-card p-8 max-w-md w-full mx-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-xl bg-chrome flex items-center justify-center mx-auto shadow-lg">
            <span className="material-symbols-outlined text-white text-[32px]">group_add</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-ink">You&apos;re Invited!</h1>
            <p className="text-sm text-muted">
              <span className="font-bold text-ink">{invite?.invitedBy}</span> invited you to join{' '}
              <span className="font-bold text-ink">{invite?.workspace.name}</span> as a{' '}
              <span className="font-bold text-accent">{invite?.role}</span>.
            </p>
            <p className="text-xs text-muted">
              This invite was sent to <span className="font-bold">{invite?.email}</span>
            </p>
          </div>
          <div className="space-y-3">
            <Link href={`/login?redirect=/invite?token=${token}`}>
              <Button variant="gradient" fullWidth icon="login">
                Sign In to Accept
              </Button>
            </Link>
            <Link href={`/signup?redirect=/invite?token=${token}`}>
              <Button variant="outline" fullWidth icon="person_add">
                Create Account
              </Button>
            </Link>
          </div>
          <p className="text-[10px] text-faint">
            Expires {invite?.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : 'soon'}
          </p>
        </div>
      </div>
    );
  }

  // User is logged in
  const emailMatch = user.email?.toLowerCase() === invite?.email.toLowerCase();

  if (!emailMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="bg-surface border border-border rounded-2xl shadow-card p-8 max-w-md w-full mx-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-xl bg-warning/10 flex items-center justify-center mx-auto border border-yellow-200">
            <span className="material-symbols-outlined text-warning text-[32px]">mail</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-ink">Wrong Account</h1>
            <p className="text-sm text-muted">
              This invite was sent to <span className="font-bold">{invite?.email}</span>, but you&apos;re signed in as <span className="font-bold">{user.email}</span>.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              variant="gradient"
              fullWidth
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                window.location.href = `/login?redirect=/invite?token=${token}`;
              }}
            >
              Sign in with {invite?.email}
            </Button>
            <Link href="/dashboard">
              <Button variant="white" fullWidth>
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (invite?.isAlreadyMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="bg-surface border border-border rounded-2xl shadow-card p-8 max-w-md w-full mx-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-xl bg-info/10 flex items-center justify-center mx-auto border border-indigo-200">
            <span className="material-symbols-outlined text-info text-[32px]">group</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-ink">Already a Member</h1>
            <p className="text-sm text-muted">
              You&apos;re already a member of <span className="font-bold text-ink">{invite?.workspace.name}</span>.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="gradient" fullWidth>
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show accept button
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="bg-surface border border-border rounded-2xl shadow-card p-8 max-w-md w-full mx-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mx-auto border border-accent/20">
          <span className="material-symbols-outlined text-accent text-[32px]">group_add</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-ink">Join {invite?.workspace.name}</h1>
          <p className="text-sm text-muted">
            <span className="font-bold text-ink">{invite?.invitedBy}</span> invited you as a{' '}
            <span className="font-bold text-accent">{invite?.role}</span>.
          </p>
          <p className="text-xs text-muted">
            This invite was sent to <span className="font-bold">{invite?.email}</span>
          </p>
        </div>
        {error && (
          <p className="text-xs text-danger text-center font-medium">{error}</p>
        )}
        <Button
          variant="gradient"
          fullWidth
          size="lg"
          isLoading={isAccepting}
          onClick={handleAccept}
          icon="group_add"
        >
          Accept Invitation
        </Button>
        <p className="text-[10px] text-faint">
          Expires {invite?.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : 'soon'}
        </p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
