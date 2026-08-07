import { NextResponse } from "next/server";

const FIREBASE_SDK_URL = "https://www.gstatic.com/firebasejs/11.7.0";

export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!config.apiKey || !config.projectId || !config.messagingSenderId) {
    return new NextResponse(
      "// Firebase client config is not set; push notifications are disabled.",
      { headers: { "Content-Type": "application/javascript; charset=utf-8" } },
    );
  }

  const script = `importScripts("${FIREBASE_SDK_URL}/firebase-app-compat.js");
importScripts("${FIREBASE_SDK_URL}/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Relay";
  const options = {
    body: payload.notification?.body || "",
    icon: "/favicon.ico",
  };
  self.registration.showNotification(title, options);
});
`;

  return new NextResponse(script, {
    headers: { "Content-Type": "application/javascript; charset=utf-8" },
  });
}
