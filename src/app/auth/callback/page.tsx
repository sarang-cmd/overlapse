'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

// Supabase OAuth redirects here with the session in the URL hash/query
// The supabase client auto-handles the exchange; we just redirect to dashboard
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        router.replace('/auth/sign-in?error=callback_failed');
        return;
      }
      router.replace('/dashboard');
    };
    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-300 flex items-center justify-center" style={{ fontFamily: '"Fragment Mono", monospace' }}>
      <div className="text-center">
        <div className="text-2xl mb-4 animate-pulse">⏳</div>
        <p className="text-[12px] text-zinc-400">Completing sign-in…</p>
        <p className="text-[10px] text-zinc-600 mt-2">
          <Link href="/dashboard">Click here if not redirected</Link>
        </p>
      </div>
    </div>
  );
}
