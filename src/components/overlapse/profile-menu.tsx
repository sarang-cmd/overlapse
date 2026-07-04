'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogIn, LogOut, Settings as SettingsIcon, Users, ChevronDown, Mail, Globe } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import Toaster, { type ToasterRef } from '@/components/ui/toast';

export function ProfileMenu() {
  const { user, profile, signOut, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<{title:string; message:string; variant?: 'default'|'success'|'error'|'warning'}[]>([]);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const toasterRef = useRef<ToasterRef>(null);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const showToast = (title: string, message: string, variant: 'default'|'success'|'error'|'warning' = 'default') => {
    toasterRef.current?.show({ title, message, variant });
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) showToast('Sign-in failed', error, 'error');
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out', 'See you soon', 'default');
    router.push('/');
    setOpen(false);
  };

  // Initials for avatar
  const initials = user
    ? (user.email || '?').substring(0, 2).toUpperCase()
    : '??';

  return (
    <div className="relative" ref={menuRef}>
      <Toaster ref={toasterRef} />
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:border-[#ff6a1a]/60 transition-colors text-[10px] font-bold uppercase"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        {user ? (
          <span style={{ color: profile?.is_premium ? '#ffd166' : '#ff6a1a' }}>{initials}</span>
        ) : (
          <User className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#0a0d14]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {!user ? (
            // Signed out
            <div className="py-2">
              <div className="px-3 py-2 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-white/[0.06]">
                Welcome to Overlapse
              </div>
              <button
                onClick={() => { router.push('/auth/sign-in'); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-zinc-200 hover:bg-[#ff6a1a]/10 hover:text-[#ff6a1a] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <div className="text-left flex-1">
                  <div>Sign in with email</div>
                  <div className="text-[10px] text-zinc-500">Existing account</div>
                </div>
              </button>
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-zinc-200 hover:bg-[#ff6a1a]/10 hover:text-[#ff6a1a] transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <div className="text-left flex-1">
                  <div>Sign in with Google</div>
                  <div className="text-[10px] text-zinc-500">One-click OAuth</div>
                </div>
              </button>
              <button
                onClick={() => { router.push('/auth/sign-up'); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-zinc-200 hover:bg-[#ff6a1a]/10 hover:text-[#ff6a1a] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <div className="text-left flex-1">
                  <div>Create account</div>
                  <div className="text-[10px] text-zinc-500">New to Overlapse</div>
                </div>
              </button>
              <div className="border-t border-white/[0.06] my-1" />
              <button
                onClick={() => { router.push('/settings'); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                Settings
              </button>
            </div>
          ) : (
            // Signed in
            <div className="py-2">
              <div className="px-3 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#ff6a1a]/20 border border-[#ff6a1a]/40 flex items-center justify-center text-[12px] font-bold text-[#ff6a1a]">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-white font-medium truncate">
                      {profile?.display_name || user.email}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">{user.email}</div>
                    {profile?.is_premium && (
                      <div className="text-[9px] text-[#ffd166] uppercase tracking-wider mt-0.5">★ Premium</div>
                    )}
                  </div>
                </div>
                {profile?.home_timezone && (
                  <div className="text-[10px] text-zinc-500 mt-2">
                    Home: <span className="text-zinc-300">{profile.home_timezone}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => { router.push('/groups'); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-zinc-200 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                My Groups
              </button>
              <button
                onClick={() => { router.push('/settings'); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-zinc-200 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                Settings
              </button>
              <div className="border-t border-white/[0.06] my-1" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
