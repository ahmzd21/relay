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
  const { isAuthenticated } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [deviceCount, setDeviceCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>({ email: true, push: true });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pushEnabled = !!fcmToken;

  // Load notification preferences (returns null when the request fails).
  const loadPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/preferences', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  }, []);

  // Fetch preferences when the user signs in.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    loadPreferences()
      .then((data) => {
        if (cancelled || !data) return;
        setPreferences(data.preferences);
        setDeviceCount(data.deviceCount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadPreferences]);

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

  // Register the service worker, then restore an existing push token on login.
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    let cancelled = false;

    const init = async () => {
      try {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) return;
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = await getMessagingInstance();
        if (cancelled || !messaging) return;
        if (Notification.permission !== 'granted') return;
        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        if (cancelled || !token) return;
        setFcmToken(token);
        await subscribeToken(token);
      } catch {
        // silently fail
      }
    };

    init();
    return () => {
      cancelled = true;
    };
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
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        if (token) {
          setFcmToken(token);
          await subscribeToken(token);
        }
      }
    } catch {
      // silently fail
    }
  }, [subscribeToken]);

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
