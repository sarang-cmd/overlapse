/**
 * Firebase initialization + FCM (Firebase Cloud Messaging) for web push notifications.
 *
 * Uses the `overlapse-functions` Firebase project (separate from `overlapse-dev` hosting).
 * VAPID keys are in .env.local.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_PUBLIC_KEY;

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (err) {
      console.warn('Firebase init failed:', err);
    }
  } else {
    app = getApps()[0];
  }
}

/**
 * Initialize FCM messaging (client-side only).
 * Returns null if not supported (Safari < 16.4, etc).
 */
export async function initMessaging(): Promise<Messaging | null> {
  if (!app || typeof window === 'undefined') return null;
  if (messaging) return messaging;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.info('FCM not supported in this browser');
      return null;
    }
    messaging = getMessaging(app);
    return messaging;
  } catch (err) {
    console.warn('FCM init failed:', err);
    return null;
  }
}

/**
 * Request notification permission and get FCM token.
 * Token should be saved to profiles.push_token in Supabase.
 *
 * Returns:
 *   - token string on success
 *   - null if permission denied or not supported
 */
export async function requestNotificationPermission(): Promise<string | null> {
  const msg = await initMessaging();
  if (!msg || !VAPID_PUBLIC_KEY) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('Notification permission denied');
      return null;
    }

    const token = await getToken(msg, { vapidKey: VAPID_PUBLIC_KEY });
    return token;
  } catch (err) {
    console.warn('Failed to get FCM token:', err);
    return null;
  }
}

/**
 * Subscribe to incoming push notifications while the app is open.
 * Use this to show in-app toasts when a push arrives.
 */
export async function onPushMessage(callback: (payload: any) => void): Promise<() => void> {
  const msg = await initMessaging();
  if (!msg) return () => {};

  return onMessage(msg, (payload) => {
    callback(payload);
  });
}

/**
 * Check if push notifications are supported in this browser.
 */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status.
 */
export function getPermissionStatus(): 'default' | 'granted' | 'denied' | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}
