'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface NotificationContextType {
  pushEnabled: boolean;
  deviceCount: number;
  preferences: NotificationPreferences;
  notifications: NotificationItem[];
  unreadCount: number;
  showBellDropdown: boolean;
  setShowBellDropdown: (v: boolean) => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  requestPushPermission: () => Promise<void>;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [deviceCount, setDeviceCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>({ email: true, push: true });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pushEnabled = !!fcmToken;

  // Fetch preferences on mount
  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/preferences', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
        setDeviceCount(data.deviceCount);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated, fetchPreferences]);

  // Subscribe token to backend
  const subscribeToken = useCallback(async (token: string) => {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });
    } catch {
      // silently fail
    }
  }, []);

  // Unsubscribe token from backend
  const unsubscribeToken = useCallback(async (token: string) => {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });
    } catch {
      // silently fail
    }
  }, []);

  // Request push permission and get FCM token
  const requestPushPermission = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const messaging = await getMessagingInstance();
        if (!messaging) return;
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) return;
        const token = await getToken(messaging, { vapidKey });
        if (token) {
          setFcmToken(token);
          await subscribeToken(token);
          await fetchPreferences();
        }
      }
    } catch {
      // silently fail
    }
  }, [subscribeToken, fetchPreferences]);

  // Restore existing token on mount
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const init = async () => {
      try {
        const messaging = await getMessagingInstance();
        if (!messaging) return;
        const permission = Notification.permission;
        if (permission === 'granted') {
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) return;
          const token = await getToken(messaging, { vapidKey });
          if (token) {
            setFcmToken(token);
            await subscribeToken(token);
          }
        }
      } catch {
        // silently fail
      }
    };

    init();
  }, [isAuthenticated, subscribeToken]);

  // Listen for foreground messages
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      const messaging = await getMessagingInstance();
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const newNotification: NotificationItem = {
          id: Date.now().toString(),
          title: payload.notification?.title || 'Relay',
          body: payload.notification?.body || '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
        };
        setNotifications((prev) => [newNotification, ...prev]);
      });
    };

    init();

    return () => unsubscribe?.();
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);

        // If push was just enabled, request permission
        if (prefs.push && !fcmToken) {
          await requestPushPermission();
        }
      }
    } catch {
      // silently fail
    }
  }, [fcmToken, requestPushPermission]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        pushEnabled,
        deviceCount,
        preferences,
        notifications,
        unreadCount,
        showBellDropdown,
        setShowBellDropdown,
        updatePreferences,
        requestPushPermission,
        dismissNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
