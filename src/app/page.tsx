'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, source: 'landing' }]);

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - email already exists
          setErrorMessage('You\'re already on the list! We\'ll be in touch soon.');
          setStatus('success');
        } else {
          throw error;
        }
      } else {
        setStatus('success');
      }
      setEmail('');
    } catch (err) {
      console.error('Error joining waitlist:', err);
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        
        {/* Logo / Name */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            Astrid
          </h1>
          <p className="mt-2 text-xl md:text-2xl text-slate-400 font-light">
            Your AI Executive Assistant
          </p>
        </div>

        {/* Hero Tagline */}
        <div className="max-w-2xl mb-8">
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-medium">
            Imagine having a brilliant assistant who never sleeps, never forgets, 
            and always has your back. That&apos;s{' '}
            <span className="text-amber-400">Astrid</span> — and she makes you unstoppable.
          </p>
        </div>

        {/* Emotional Hook */}
        <div className="max-w-2xl mb-8">
          <p className="text-base md:text-lg text-slate-400 leading-relaxed">
            That mental weight you carry everywhere — the follow-ups, the ideas you 
            can&apos;t forget, the things that keep you up at night? Offload them to Astrid. 
            She captures, organizes, and acts, so you can focus on what only{' '}
            <span className="italic">you</span> can do.
          </p>
          <p className="mt-4 text-amber-400 font-semibold">
            That&apos;s not just productivity. That&apos;s superhuman.
          </p>
        </div>

        {/* Value Props */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm md:text-base text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Chat naturally via Telegram</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Capture ideas by email</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Offload tasks, never drop the ball</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Works while you sleep</span>
          </div>
        </div>

        {/* Brilliance Closer */}
        <div className="max-w-xl mb-12">
          <p className="text-sm md:text-base text-slate-500 leading-relaxed">
            Astrid doesn&apos;t just keep you organized. She adds a layer of brilliance 
            to everything you do — thinking ahead, connecting dots, and making sure 
            nothing slips through the cracks.
          </p>
        </div>

        {/* Email Signup */}
        <div className="w-full max-w-md">
          {status === 'success' ? (
            <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-6">
              <p className="text-green-400 font-medium">
                🎉 You&apos;re on the list!
              </p>
              <p className="text-slate-400 text-sm mt-2">
                {errorMessage || "We'll notify you when Astrid is ready."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 
                           text-white placeholder-slate-500 focus:outline-none focus:border-amber-500
                           transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold 
                           rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           whitespace-nowrap"
                >
                  {status === 'loading' ? 'Joining...' : 'Get Early Access'}
                </button>
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-sm">{errorMessage}</p>
              )}
              <p className="text-slate-500 text-sm">
                Be the first to know when Astrid launches. No spam, ever.
              </p>
            </form>
          )}
        </div>

        {/* Coming Soon Badge */}
        <div className="mt-16">
          <span className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-400">
            Coming Soon — 2026
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full py-6 text-center text-slate-500 text-sm">
        <p>© 2026 Astrid. Divine strength for busy minds.</p>
      </footer>
    </main>
  );
}
