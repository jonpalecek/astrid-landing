'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="absolute top-0 w-full py-6 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Astrid</h1>
          <Link 
            href="/login"
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

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
            <span>Manage projects &amp; tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Capture ideas on the go</span>
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

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold 
                     rounded-lg transition-colors text-lg"
          >
            Get Started — Free Trial
          </Link>
          <Link
            href="#pricing"
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold 
                     rounded-lg transition-colors text-lg"
          >
            View Pricing
          </Link>
        </div>

        {/* Trial Info */}
        <p className="mt-4 text-slate-500 text-sm">
          7-day free trial • $99/month after • Cancel anytime
        </p>
      </div>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 mb-12">One plan. Everything included. No surprises.</p>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-amber-400 text-sm font-medium mb-2">PERSONAL ASSISTANT</div>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-5xl font-bold">$99</span>
              <span className="text-slate-400">/month</span>
            </div>
            
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Your own AI assistant (powered by Claude)</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Unlimited conversations via Telegram</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Project &amp; task management</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Idea capture &amp; inbox</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Web dashboard</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span className="text-slate-300">Works 24/7, never forgets</span>
              </li>
            </ul>

            <Link
              href="/login"
              className="block w-full px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 
                       font-semibold rounded-lg transition-colors text-center"
            >
              Start 7-Day Free Trial
            </Link>
            <p className="mt-3 text-slate-500 text-sm">No credit card required to start</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-800">
        <p>© 2026 Astrid. Divine strength for busy minds.</p>
      </footer>
    </main>
  );
}
