import { initializeApp, getApps } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasConfig =
  firebaseConfig.projectId &&
  firebaseConfig.apiKey &&
  firebaseConfig.messagingSenderId;

const app =
  hasConfig && getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0] || null;

let messagingSingleton: ReturnType<typeof getMessaging> | null = null;

export async function getMessagingInstance() {
  if (typeof window === "undefined") return null;
  if (!app) return null;
  if (messagingSingleton) return messagingSingleton;
  const supported = await isSupported();
  if (!supported) return null;
  messagingSingleton = getMessaging(app);
  return messagingSingleton;
}

export default app;
