'use client';

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

// ============================================================
// Profile type — extends Supabase User with our profiles table fields
// ============================================================

export interface OverlapseProfile {
  id: string;
  email: string;
  display_name: string | null;
  home_timezone: string | null;
  is_premium: boolean;
  push_token: string | null;
  world_clock_cities: string[] | null;
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: OverlapseProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<OverlapseProfile>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<OverlapseProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from profiles table
  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) {
        // Profile doesn't exist yet — create it
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const newProfile = {
              id: uid,
              email: userData.user.email || '',
              display_name: userData.user.user_metadata?.full_name || null,
              home_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              is_premium: false,
              push_token: null,
              world_clock_cities: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'],
            };
            const { data: inserted, error: insertErr } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select()
              .single();
            if (!insertErr && inserted) {
              setProfile(inserted as OverlapseProfile);
              return;
            }
          }
        }
        console.warn('Profile fetch error:', error.message);
        return;
      }
      setProfile(data as OverlapseProfile);
    } catch (err) {
      console.warn('Profile fetch failed:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { home_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const updateProfile = async (updates: Partial<OverlapseProfile>) => {
    if (!user) return { error: 'Not signed in' };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (!error) {
      await refreshProfile();
    }
    return { error: error?.message ?? null };
  };

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Convenience hook for components that only need user/profile
export function useUser() {
  const { user, profile, loading } = useAuth();
  return { user, profile, loading };
}
