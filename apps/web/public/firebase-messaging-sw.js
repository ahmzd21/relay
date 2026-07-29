importScripts(
  "https://www.gstatic.com/firebasejs/11.7.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.7.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBzb3oqzRWRDgGFR3fMeJK_G2YaqI93jfE",
  authDomain: "relay-906a7.firebaseapp.com",
  projectId: "relay-906a7",
  storageBucket: "relay-906a7.firebasestorage.app",
  messagingSenderId: "935925203257",
  appId: "1:935925203257:web:4bf8dc2cedaf7e3ae168e8",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "Relay";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/favicon.ico",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
