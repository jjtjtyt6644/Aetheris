import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: "https://aetheris-7291f-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Prevent duplicate initialization during Next.js hot reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// experimentalForceLongPolling bypasses firewalls and ad-blockers that
// block WebSockets by falling back to HTTP long-poll.
// No localCache option = SDK default (memory cache), which is the only
// cache type compatible with long-polling.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

import { getDatabase } from "firebase/database";
export const rtdb = getDatabase(app);

export default app;