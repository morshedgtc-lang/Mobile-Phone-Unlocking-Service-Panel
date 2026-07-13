'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-bg-dark">
      {/* Animated gradient mesh */}
      <div
        className="absolute inset-0 animate-gradient-mesh"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(59,130,246,0.22) 0%, transparent 60%),' +
            'radial-gradient(ellipse 70% 70% at 75% 65%, rgba(139,92,246,0.22) 0%, transparent 55%),' +
            'radial-gradient(ellipse 60% 60% at 50% 90%, rgba(6,182,212,0.18) 0%, transparent 55%)',
        }}
      />

      {/* Floating glow orbs */}
      <div className="absolute top-[15%] left-[12%] w-[28rem] h-[28rem] rounded-full bg-neon-blue/20 blur-[100px] animate-float-orb animate-glow-pulse" />
      <div
        className="absolute bottom-[10%] right-[10%] w-[36rem] h-[36rem] rounded-full bg-neon-purple/20 blur-[120px] animate-float-orb"
        style={{ animationDelay: '3s' }}
      />
      <div
        className="absolute top-[55%] left-[55%] w-[20rem] h-[20rem] rounded-full bg-accent/15 blur-[80px] animate-float-orb"
        style={{ animationDelay: '1.5s' }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] mx-4 animate-card-enter">
        <div className="relative rounded-[32px] bg-glass backdrop-blur-2xl border border-glass-border shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-500 hover:shadow-[0_25px_70px_rgba(59,130,246,0.25)] before:absolute before:inset-0 before:rounded-[32px] before:bg-gradient-to-br before:from-white/[0.08] before:to-transparent before:pointer-events-none">

          {/* Top neon bar */}
          <div className="absolute -top-px left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-primary-400/60 to-transparent rounded-full" />
          {/* Bottom neon bar */}
          <div className="absolute -bottom-px left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-neon-purple/60 to-transparent rounded-full" />

          <div className="p-8 sm:p-10">
            {/* Logo / header */}
            <div className="text-center mb-9">
              <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-3xl bg-gradient-to-br from-primary-500 to-secondary mb-5 shadow-[0_8px_30px_rgba(59,130,246,0.45)] animate-glow-pulse">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-[2rem] font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary-400 via-white to-secondary bg-clip-text text-transparent">
                  Phone Unlock Pro
                </span>
              </h1>
              <p className="mt-2 text-sm text-white/50 font-medium tracking-wide">
                Professional GSM Service Panel
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm backdrop-blur-sm animate-card-enter">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.12em]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@unlock.com"
                  className="w-full px-4 py-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400/50 transition-all backdrop-blur-sm text-[15px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.12em]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400/50 transition-all backdrop-blur-sm text-[15px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-[14px] rounded-2xl bg-gradient-to-r from-primary-500 to-secondary text-white font-semibold text-[15px] tracking-wide transition-all duration-300 hover:shadow-[0_10px_40px_rgba(59,130,246,0.5)] hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2.5">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-7 text-center text-sm text-white/40">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="text-primary-400 hover:text-primary-300 font-semibold transition-colors underline underline-offset-4 decoration-primary-400/30"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-white/20 font-medium tracking-wide">
          © 2024 Phone Unlock Pro · Enterprise GSM Platform
        </p>
      </div>
    </div>
  );
}
