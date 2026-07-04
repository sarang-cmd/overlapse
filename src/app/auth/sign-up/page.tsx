'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth';
import { Mail, Lock, ArrowRight, AlertCircle, User } from 'lucide-react';

export default function SignUpPage() {
  const { signUpWithEmail, signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setSubmitting(false);
      return;
    }

    const { error } = await signUpWithEmail(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setSuccess('Check your email for a confirmation link, then sign in.');
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-200 flex items-center justify-center p-6" style={{ fontFamily: '"Fragment Mono", monospace' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center mb-8">
          <span className="text-3xl font-bold">
            <span className="text-white">Over</span><span className="text-[#ff6a1a]">lapse</span>
          </span>
        </Link>

        <div className="bg-white/[0.015] border border-white/[0.08] rounded-2xl p-6">
          <h1 className="text-lg text-white mb-1">Create account</h1>
          <p className="text-[11px] text-zinc-500 mb-6">Free forever. Supabase auth, no card needed.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-[11px] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Display name (optional)</label>
              <div className="relative mt-1">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-[12px] text-zinc-200 outline-none focus:border-[#ff6a1a]/50"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Email</label>
              <div className="relative mt-1">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-[12px] text-zinc-200 outline-none focus:border-[#ff6a1a]/50"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Password (min 6 chars)</label>
              <div className="relative mt-1">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-[12px] text-zinc-200 outline-none focus:border-[#ff6a1a]/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#ff6a1a] text-black py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wider hover:bg-[#ff7f3a] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating…' : 'Create account'}
              {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[11px] text-zinc-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="text-[#ff6a1a] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-6">
          <Link href="/" className="hover:text-zinc-400">← Back to landing</Link>
        </p>
      </div>
    </div>
  );
}
