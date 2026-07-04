'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import {
  requestNotificationPermission,
  onPushMessage,
  isPushSupported,
  getPermissionStatus,
} from '@/lib/firebase/messaging';
import { Bell, BellOff, Check } from 'lucide-react';

interface PushNotificationManagerProps {
  /** Where to render: 'settings' (full card) or 'compact' (button only) */
  variant?: 'settings' | 'compact';
}

/**
 * Manages FCM push notification permission and token registration.
 * Used in settings page (full card) and optionally as a compact button elsewhere.
 */
export function PushNotificationManager({ variant = 'settings' }: PushNotificationManagerProps) {
  const { user, updateProfile, profile } = useAuth();
  const [status, setStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    setStatus(getPermissionStatus());
    setRegistered(!!profile?.push_token);
  }, [profile]);

  // Listen for incoming push messages (foreground notifications)
  useEffect(() => {
    let unsub: (() => void) | undefined;
    onPushMessage((payload) => {
      console.log('FCM message received:', payload);
      // Optionally show an in-app toast here
    }).then((u) => (unsub = u));
    return () => unsub?.();
  }, []);

  const handleEnable = async () => {
    setRegistering(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setStatus('granted');
        if (user) {
          await updateProfile({ push_token: token });
        }
        setRegistered(true);
      } else {
        setStatus(getPermissionStatus());
      }
    } finally {
      setRegistering(false);
    }
  };

  if (status === 'unsupported') {
    if (variant === 'compact') return null;
    return (
      <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-lg text-[11px] text-yellow-400">
        Push notifications are not supported in this browser. Try Chrome, Firefox, or Edge.
      </div>
    );
  }

  if (variant === 'compact') {
    if (status === 'granted' && registered) {
      return (
        <button
          disabled
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[11px] uppercase tracking-wider"
          title="Push notifications enabled"
        >
          <Bell className="w-3.5 h-3.5" /> On
        </button>
      );
    }
    return (
      <button
        onClick={handleEnable}
        disabled={registering}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ff6a1a]/15 border border-[#ff6a1a]/30 text-[#ff6a1a] text-[11px] uppercase tracking-wider hover:bg-[#ff6a1a]/25 disabled:opacity-50"
      >
        <Bell className="w-3.5 h-3.5" /> {registering ? 'Enabling…' : 'Enable push'}
      </button>
    );
  }

  // Settings variant
  return (
    <div className="p-4 bg-black/20 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {status === 'granted' ? (
            <Bell className="w-5 h-5 text-green-400" />
          ) : (
            <BellOff className="w-5 h-5 text-zinc-400" />
          )}
          <div>
            <div className="text-[12px] text-zinc-200">Push notifications (FCM)</div>
            <div className="text-[10px] text-zinc-500">
              Get notified when a group member posts a new meeting suggestion
            </div>
          </div>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${
            status === 'granted'
              ? 'bg-green-500/15 text-green-400'
              : status === 'denied'
              ? 'bg-red-500/15 text-red-400'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {status === 'granted' ? (registered ? 'Active' : 'Permission granted') : status === 'denied' ? 'Blocked' : 'Off'}
        </span>
      </div>

      {status === 'denied' && (
        <div className="text-[11px] text-zinc-500 leading-relaxed">
          Push notifications are blocked in your browser settings. To re-enable, click the lock icon in your
          browser&apos;s address bar and reset the notification permission.
        </div>
      )}

      {status === 'default' && (
        <button
          onClick={handleEnable}
          disabled={registering}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ff6a1a] text-black text-[11px] uppercase tracking-wider font-bold hover:bg-[#ff7f3a] disabled:opacity-50"
        >
          <Bell className="w-3.5 h-3.5" />
          {registering ? 'Requesting permission…' : 'Enable push notifications'}
        </button>
      )}

      {status === 'granted' && registered && (
        <div className="text-[11px] text-green-400 flex items-center gap-2">
          <Check className="w-3.5 h-3.5" /> Push notifications enabled. Your device is registered.
        </div>
      )}

      {status === 'granted' && !registered && (
        <button
          onClick={handleEnable}
          disabled={registering}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ff6a1a] text-black text-[11px] uppercase tracking-wider font-bold hover:bg-[#ff7f3a] disabled:opacity-50"
        >
          {registering ? 'Registering…' : 'Register this device'}
        </button>
      )}
    </div>
  );
}

export default PushNotificationManager;
