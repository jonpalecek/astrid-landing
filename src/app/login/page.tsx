'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

// Invite codes that allow signup (can be multiple)
const VALID_INVITE_CODES = ['ASTRID2026', 'EARLYADOPTER'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const supabase = createClient();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // Validate invite code
    if (!VALID_INVITE_CODES.includes(inviteCode.toUpperCase().trim())) {
      setStatus('error');
      setErrorMessage('Invalid invite code. Contact us at hello@getastrid.ai to request access.');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('idle');
      setStep('code');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      // Success! Redirect to dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleResendCode = async () => {
    setStatus('loading');
    setErrorMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold tracking-tight">Astrid</h1>
          </Link>
          <p className="mt-2 text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          {step === 'email' ? (
            <>
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 
                             text-white placeholder-slate-500 focus:outline-none focus:border-amber-500
                             transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-300 mb-2">
                    Invite code
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="XXXXXXXX"
                    required
                    autoComplete="off"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 
                             text-white placeholder-slate-500 focus:outline-none focus:border-amber-500
                             transition-colors uppercase tracking-wider"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold 
                           rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Sending...' : 'Send verification code'}
                </button>
              </form>

              <p className="mt-4 text-center text-slate-500 text-sm">
                We&apos;ll email you a 6-digit code to sign in.
              </p>

              <p className="mt-2 text-center text-slate-600 text-xs">
                Don&apos;t have an invite code?{' '}
                <a href="mailto:hello@getastrid.ai" className="text-amber-400 hover:text-amber-300">
                  Request access
                </a>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📧</div>
                <h2 className="text-xl font-semibold mb-2">Check your email</h2>
                <p className="text-slate-400">
                  We sent a code to <span className="text-white">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-2 text-center">
                    Enter verification code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    required
                    autoComplete="one-time-code"
                    autoFocus
                    className="w-full px-4 py-4 rounded-lg bg-slate-900 border border-slate-700 
                             text-white text-center text-2xl tracking-[0.5em] font-mono
                             placeholder-slate-600 focus:outline-none focus:border-amber-500
                             transition-colors"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-400 text-sm text-center">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading' || code.length !== 6}
                  className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold 
                           rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Verifying...' : 'Sign in'}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm">
                <button
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setStatus('idle');
                    setErrorMessage('');
                  }}
                  className="text-slate-400 hover:text-slate-300"
                >
                  ← Change email
                </button>
                <button
                  onClick={handleResendCode}
                  disabled={status === 'loading'}
                  className="text-amber-400 hover:text-amber-300 disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-slate-500 text-sm">
          Don&apos;t have an account? Just enter your email above to get started.
        </p>
      </div>
    </main>
  );
}
