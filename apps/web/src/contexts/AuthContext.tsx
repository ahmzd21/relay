'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar: string | null;
  provider: string;
  settings: Record<string, unknown> | null;
  twoFactorEnabled: boolean;
  createdAt: string;
  hasPassword: boolean;
}

export function getUserJobRole(user: User | null): string | null {
  if (!user?.settings) return null;
  const s = user.settings as { jobRole?: string };
  return s.jobRole || null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        return data.user ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchUserData().then((u) => {
      if (cancelled) return;
      setUser(u);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchUserData]);

  const refetchUser = useCallback(async () => {
    const u = await fetchUserData();
    setUser(u);
    setIsLoading(false);
  }, [fetchUserData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
