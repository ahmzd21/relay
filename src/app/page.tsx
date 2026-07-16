'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="overflow-x-hidden bg-[#FAF9F5] text-[#1B1B1B]">
      {/* MainHeader */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-2 max-w-[1200px] w-[95%] mx-auto rounded-full mt-4 bg-black backdrop-blur-[20px] border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-8 w-8 text-white">
            <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <Link href="/" className="text-lg font-helvetica font-bold tracking-tighter text-white">Relay</Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <div className="relative group py-2">
            <button className="text-white/60 text-sm hover:text-white transition-colors duration-300 flex items-center gap-1 cursor-default">
              Solutions
              <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-72 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 translate-y-2 group-hover:translate-y-0">
              <Link href="#integrations" className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <div className="font-bold text-white mb-0.5">Native Spaces</div>
                <div className="text-xs text-white/50">HD Meetings directly on Relay</div>
              </Link>
              <Link href="#integrations" className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <div className="font-bold text-white mb-0.5">External Integrations</div>
                <div className="text-xs text-white/50">Zoom/Teams/Meet Integration</div>
              </Link>
              <Link href="#pricing" className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors border-t border-white/5 mt-1">
                <div className="font-bold text-white mb-0.5">For Freelancers</div>
                <div className="text-xs text-white/50">Client collaboration without barriers</div>
              </Link>
              <Link href="#pricing" className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <div className="font-bold text-white mb-0.5">For Organizations</div>
                <div className="text-xs text-white/50">Enterprise scaling and management</div>
              </Link>
            </div>
          </div>
          <div className="relative group py-2">
            <button className="text-white/60 text-sm hover:text-white transition-colors duration-300 flex items-center gap-1 cursor-default">
              Features
              <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-64 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 translate-y-2 group-hover:translate-y-0">
              <Link href="#features" className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Real-Time Speech Translation</Link>
              <Link href="#features" className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Dynamic Subtitle Overlay</Link>
              <Link href="#features" className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">AI Summaries & Query Studio</Link>
              <Link href="#features" className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Interactive Shared Whiteboards</Link>
            </div>
          </div>
          <Link className="text-white/60 text-sm hover:text-white transition-colors duration-300" href="#how-it-works">How it Works</Link>
          <Link className="text-white/60 text-sm hover:text-white transition-colors duration-300" href="#pricing">Pricing</Link>
          <div className="relative group py-2">
            <button className="text-white/60 text-sm hover:text-white transition-colors duration-300 flex items-center gap-1 cursor-default">
              Resources
              <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-56 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 translate-y-2 group-hover:translate-y-0">
              <Link href="#" className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Help Center / Guides</Link>
              <Link href="#" className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">Supported Languages</Link>
              <Link href="#" className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">API & Integrations</Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/signup" className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all scale-95 active:scale-90 duration-300">Get Started</Link>
          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col px-6 pt-28 pb-10 gap-6 transition-all duration-300 md:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <Link href="#features" onClick={() => setMenuOpen(false)} className="text-white text-xl font-bold font-helvetica border-b border-white/10 pb-4">Features</Link>
        <Link href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-white text-xl font-bold font-helvetica border-b border-white/10 pb-4">How it Works</Link>
        <Link href="#pricing" onClick={() => setMenuOpen(false)} className="text-white text-xl font-bold font-helvetica border-b border-white/10 pb-4">Pricing</Link>
        <Link href="#" onClick={() => setMenuOpen(false)} className="text-white text-xl font-bold font-helvetica border-b border-white/10 pb-4">Help Center</Link>
        <Link href="#" onClick={() => setMenuOpen(false)} className="text-white text-xl font-bold font-helvetica border-b border-white/10 pb-4">Supported Languages</Link>
        <Link href="/signup" onClick={() => setMenuOpen(false)} className="mt-4 bg-white text-black px-6 py-4 rounded-full font-bold text-center text-base">Get Started</Link>
      </div>

      <main>
        {/* Hero Section */}
        <section className="pt-[280px] pb-24 px-6 text-center overflow-hidden" style={{ background: 'radial-gradient(circle at 50% -20%, #FFFDF8 0%, #FAF9F5 100%)' }}>
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-6xl md:text-[82px] mb-6 tracking-tighter leading-none font-helvetica font-bold text-slate-900">
              Break the Language <br /> Barrier in Every Meeting
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-16 leading-relaxed">
              Experience crystal-clear, real-time voice-to-voice translation. Connect natively or bridge to your existing workflows with millisecond latency.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 max-w-md sm:max-w-prose mx-auto sm:max-w-none justify-center gap-4">
              <button className="w-full bg-black text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg">
                <span className="material-symbols-outlined">video_call</span>
                Start Native Meeting
              </button>
              <button className="w-full border border-slate-400 text-slate-900 px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-black hover:text-white active:bg-black active:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined">link</span>
                Connect Third-Party Link
              </button>
            </div>
          </div>
        </section>

        {/* Speak Your Language + Meeting UI Visual */}
        <section id="features" className="py-28 px-6 scroll-mt-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 block">AI-Driven Orchestration</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-helvetica tracking-tight mb-8">Speak your language. Let Relay handle the rest.</h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-10">
                Every participant controls their own speaking, hearing, and subtitle language preferences. Our system ensures you hear your colleagues in your native language, simultaneously and without disruption.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-800 font-medium">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                  Independent, personalized subtitle streams per user
                </li>
                <li className="flex items-center gap-3 text-slate-800 font-medium">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                  AI-driven summaries and transcript querying via Chat Studio
                </li>
                <li className="flex items-center gap-3 text-slate-800 font-medium">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                  Secure meeting transcripts and cloud recording storage
                </li>
              </ul>
            </div>

            {/* Redesigned Meeting Visualization (From previous setup) */}
            <div className="relative" data-purpose="collage-container">
              <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden shadow-2xl bg-[#0f1115] border border-slate-800/50">
                {/* Meeting Grid */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-2">
                  {/* Elias */}
                  <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-xl font-bold text-white font-helvetica">E</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm font-bold tracking-wider">Elias (English)</span>
                  </div>
                  {/* Sofia — active speaker */}
                  <div className="rounded-2xl overflow-hidden relative border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]" style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #2d6a4f 100%)' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-xl font-bold text-white font-helvetica">S</span>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="animate-pulse-glow h-2 w-2 rounded-full bg-green-500 block"></span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm font-bold tracking-wider">Sofia (Spanish)</span>
                  </div>
                  {/* Wei */}
                  <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-xl font-bold text-white font-helvetica">W</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm font-bold tracking-wider">Wei (Chinese)</span>
                  </div>
                  {/* Yousef */}
                  <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #3b1f0a 0%, #7c3d12 100%)' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-xl font-bold text-white font-helvetica">Y</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm font-bold tracking-wider">Yousef (Arabic)</span>
                  </div>
                </div>

                {/* Subtitle Overlay */}
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[85%] bg-black/80 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 text-center shadow-2xl">
                  <p className="text-white font-medium text-xs sm:text-sm md:text-base italic">&quot;El diseño de la nueva interfaz se ve muy bien...&quot;</p>
                  <p className="text-slate-400 text-[8px] sm:text-[10px] mt-1 uppercase tracking-widest font-bold">Sofia is speaking Spanish</p>
                </div>
              </div>

              {/* Restyled UI Element */}
              <div className="absolute -top-6 -right-6 p-5 rounded-2xl w-56 xl:w-64 border border-slate-800 bg-[#161922] shadow-2xl hidden lg:block">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-3 font-bold flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  Meeting Insights
                </div>
                <div className="text-sm text-white font-bold mb-2">Key Action Items</div>
                <ul className="text-[13px] text-slate-400 space-y-2">
                  <li className="flex gap-2"><span className="text-slate-600 material-symbols-outlined">arrow_right_alt</span> Finalize API schema by EOD</li>
                  <li className="flex gap-2"><span className="text-slate-600 material-symbols-outlined">arrow_right_alt</span> Schedule vendor sync</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Cards */}
        <section className="py-28 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-helvetica mb-6 text-slate-900">A Complete Intelligence Ecosystem</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">Beyond just translation, Relay provides a suite of intelligent tools designed to bridge language gaps effortlessly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200">
                <span className="material-symbols-outlined text-black">record_voice_over</span>
              </div>
              <h3 className="text-2xl font-bold font-helvetica text-slate-900">Simultaneous Delivery</h3>
              <p className="text-slate-600 text-base leading-relaxed">Seamlessly toggle between voice-to-voice neural synthesis and live captioning. Relay preserves emotional tone and vocal characteristics across 40+ languages.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200">
                <span className="material-symbols-outlined text-black">hub</span>
              </div>
              <h3 className="text-2xl font-bold font-helvetica text-slate-900">Platform Bridge</h3>
              <p className="text-slate-600 text-base leading-relaxed">No need to switch. Our native integrations for Zoom, Microsoft Teams, and Google Meet inject translation layers directly into your preferred workflow.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200">
                <span className="material-symbols-outlined text-black">analytics</span>
              </div>
              <h3 className="text-2xl font-bold font-helvetica text-slate-900">AI Query Studio</h3>
              <p className="text-slate-600 text-base leading-relaxed">Go beyond transcripts. Ask natural language questions about your meeting history, generate semantic summaries, and track cross-cultural sentiment trends.</p>
            </div>
          </div>
        </section>
        {/* How It Works — Option D: Two-Column Alternating */}
        <section id="how-it-works" className="py-16 md:py-28 bg-slate-900 text-white px-4 md:px-6 scroll-mt-20 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-24">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block mb-4">Simple by Design</span>
              <h2 className="text-4xl md:text-5xl font-bold font-helvetica tracking-tight">How Relay Works</h2>
              <p className="text-white/60 text-lg mt-6 max-w-xl mx-auto">Three steps. Any platform. Every language.</p>
            </div>

            <div className="space-y-8">
              {/* Step 1 — text left, visual right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-3xl border border-white/10 bg-white/[0.02] p-10">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-rose-500/30">1</div>
                    <h3 className="text-2xl font-bold font-helvetica">Start or Join</h3>
                  </div>
                  <p className="text-white/60 leading-relaxed">Launch a native Relay meeting, or paste a Zoom, Teams, or Google Meet link. Relay silently bridges in as your personal translation layer — no installs required for others.</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-wider">
                    <span>Mode</span>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">Native</span>
                      <span className="px-2 py-1 rounded bg-white/10 text-white/50">Bridge</span>
                    </div>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-8 bg-white/10 rounded-lg text-[10px] text-white/40 flex items-center px-3">meet.google.com/abc-xyz-def</div>
                    <div className="h-8 px-4 rounded-lg bg-rose-500 text-white text-[10px] font-bold flex items-center">Join</div>
                  </div>
                </div>
              </div>

              {/* Step 2 — visual left, text right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-3xl border border-white/10 bg-white/[0.02] p-10">
                <div className="md:order-2">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-rose-500/30">2</div>
                    <h3 className="text-2xl font-bold font-helvetica">Set Your Languages</h3>
                  </div>
                  <p className="text-white/60 leading-relaxed">Each participant picks the language they speak and the language they want to hear — voice output or live subtitles. Completely independent per user, no coordination needed.</p>
                </div>
                <div className="md:order-1 rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-wider"><span>Language to Speak</span><span className="text-white/70 font-bold normal-case">English 🇬🇧</span></div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-wider"><span>Language to Hear</span><span className="text-white/70 font-bold normal-case">Spanish 🇪🇸</span></div>
                  <div className="h-px bg-white/10"></div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-wider"><span>Output mode</span>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 rounded bg-rose-500 text-white font-bold">Voice</span>
                      <span className="px-2 py-1 rounded bg-white/10 text-white/50">Subtitles</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 — text left, visual right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-3xl border border-white/10 bg-white/[0.02] p-10">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-rose-500/30">3</div>
                    <h3 className="text-2xl font-bold font-helvetica">Relay Does the Rest</h3>
                  </div>
                  <p className="text-white/60 leading-relaxed">Speak naturally. Relay translates in real-time at 40ms latency, delivers audio privately per participant, and generates a full multilingual summary when the call ends.</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-[11px] text-white/60">Live translation active — 40ms latency</span>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <p className="text-[11px] text-white/50 italic leading-relaxed">&quot;El nuevo diseño se ve increíble...&quot;</p>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">→ Heard in English</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-28 bg-[#FAF9F5] overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block mb-4">Trusted Worldwide</span>
              <h2 className="text-4xl md:text-5xl font-bold font-helvetica text-slate-900">What Global Teams Say</h2>
            </div>
          </div>

          {/* Marquee Container */}
          <div className="relative w-full flex overflow-hidden">
            {/* Gradient Fades for Marquee edges */}
            <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-32 bg-gradient-to-r from-[#FAF9F5] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-32 bg-gradient-to-l from-[#FAF9F5] to-transparent z-10 pointer-events-none"></div>

            {/* Animated Track */}
            <div className="flex w-max animate-marquee gap-8 px-4">
              {/* Double the list for seamless looping */}
              {[...Array(2)].map((_, i) => (
                <React.Fragment key={i}>
                  {/* Testimonial 1 */}
                  <div className="bg-slate-900 p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">&quot;Relay has completely transformed how our engineering teams across Berlin, Tokyo, and New York collaborate. The latency is practically non-existent.&quot;</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white/70">MK</div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">Marcus K.</h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">VP of Engineering</p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 2 */}
                  <div className="bg-slate-900 p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">&quot;The Silent Capture Bot is genius. We use it on all our client Zoom calls now. Our Spanish-speaking partners don't even know we're using translation software.&quot;</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white/70">SL</div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">Sarah L.</h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">Agency Director</p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 3 */}
                  <div className="bg-slate-900 p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">&quot;Having the semantic whiteboard auto-translate technical architecture diagrams into Chinese in real-time has saved us hours of miscommunication.&quot;</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white/70">WC</div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">Wei C.</h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">Product Architect</p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 4 */}
                  <div className="bg-slate-900 p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">&quot;Finally, a tool that respects accents and regional dialects. Relay handles complex conversations flawlessly during our board meetings.&quot;</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white/70">AJ</div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">Aisha J.</h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">Chief Operations Officer</p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 5 */}
                  <div className="bg-slate-900 p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg transition-shadow">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">&quot;The AI Query Studio is a game-changer. I no longer have to scrub through hours of recordings to find specific decisions made in our global syncs.&quot;</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white/70">TP</div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">Tom P.</h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">Product Manager</p>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Collaborative Tools */}
        <section className="py-16 md:py-28 px-4 md:px-6 max-w-7xl mx-auto overflow-hidden">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold font-helvetica mb-6">Everything You Need. In Any Language.</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">Translation is just the foundation. Relay provides a full suite of interactive tools that understand your intent.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 md:p-12 flex flex-col justify-between shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
              <div>
                <span className="material-symbols-outlined text-black text-4xl mb-6 block">draw</span>
                <h4 className="text-2xl font-bold font-helvetica mb-4 text-slate-900">Semantic Whiteboard</h4>
                <p className="text-slate-600 text-base leading-relaxed">A shared canvas that auto-translates text stickers, handwritten notes, and technical diagrams in real-time.</p>
              </div>
              <div className="w-full mt-8 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative aspect-video bg-[#0f1115]">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                {/* Sticky Notes */}
                <div className="absolute top-6 left-6 w-32 h-28 bg-[#fdf5c9] rounded shadow-lg p-3 transform -rotate-2 border border-yellow-200/50 z-10">
                  <div className="w-8 h-1.5 bg-yellow-400/40 rounded-full mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-1 bg-yellow-800/20 rounded w-full"></div>
                    <div className="h-1 bg-yellow-800/20 rounded w-5/6"></div>
                    <div className="h-1 bg-yellow-800/20 rounded w-4/6"></div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-8 w-36 h-32 bg-[#e0f2fe] rounded shadow-lg p-3 transform rotate-3 border border-blue-200/50 z-10">
                  <div className="w-8 h-1.5 bg-blue-400/40 rounded-full mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-1 bg-blue-800/20 rounded w-full"></div>
                    <div className="h-1 bg-blue-800/20 rounded w-4/6"></div>
                  </div>
                  {/* Translation Tooltip */}
                  <div className="absolute -top-6 -left-8 bg-white text-slate-900 text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 font-bold whitespace-nowrap shadow-2xl flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[12px] text-rose-500">g_translate</span>
                    Schema (EN)
                  </div>
                </div>

                {/* SVG Connection */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <path d="M 120 80 Q 180 120 220 150" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-12 flex flex-col justify-between shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
              <div>
                <span className="material-symbols-outlined text-black text-4xl mb-6 block">present_to_all</span>
                <h4 className="text-2xl font-bold font-helvetica mb-4 text-slate-900">Contextual Screen Share</h4>
                <p className="text-slate-600 text-base leading-relaxed">Share your screen and let AI provide live OCR translation of the documents or applications you&apos;re presenting.</p>
              </div>
              <div className="w-full mt-8 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative aspect-video bg-[#1e293b] flex">
                {/* Main Doc Screen */}
                <div className="flex-1 p-4 relative bg-slate-50 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded shadow-sm border border-slate-200 p-4">
                    <div className="w-24 h-3 bg-slate-200 rounded mb-6"></div>
                    <div className="space-y-3 mb-6">
                      <div className="h-1.5 bg-slate-100 rounded w-full"></div>
                      <div className="h-1.5 bg-slate-100 rounded w-5/6"></div>
                      <div className="h-1.5 bg-slate-100 rounded w-full"></div>
                    </div>
                    {/* Live OCR Highlight */}
                    <div className="relative inline-block mt-2">
                      <div className="h-4 bg-emerald-100/50 rounded w-32 border border-emerald-200"></div>
                      {/* OCR Translation Tooltip */}
                      <div className="absolute -top-8 -right-6 bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap shadow-xl z-10 flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Translated to ES
                      </div>
                    </div>
                  </div>
                </div>
                {/* Video Sidebar */}
                <div className="w-20 bg-[#0f1115] border-l border-white/10 p-2 flex flex-col gap-2 relative z-10">
                  <div className="w-full aspect-square bg-slate-800 rounded relative overflow-hidden">
                    <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[8px] px-1 rounded">Alex</span>
                  </div>
                  <div className="w-full aspect-square bg-slate-800 rounded relative overflow-hidden border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <div className="absolute top-1 right-1 flex gap-1">
                      <span className="animate-pulse-glow h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[8px] px-1 rounded">Sofia</span>
                  </div>
                  <div className="w-full aspect-square bg-slate-800 rounded relative overflow-hidden">
                    <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[8px] px-1 rounded">Wei</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-28 px-6 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-bold font-helvetica text-slate-900">Flexible Plans</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {/* Guest */}
              <div className="bg-white rounded-2xl p-10 border border-slate-200 flex flex-col h-full shadow-sm hover:shadow-xl transition-shadow">
                <div className="flex-grow">
                  <h4 className="text-2xl font-bold font-helvetica mb-4 text-slate-900">Guest</h4>
                  <div className="text-5xl font-bold text-slate-900 mb-8">$0 <span className="text-base font-normal text-slate-500">/ meeting</span></div>
                  <p className="text-slate-600 text-sm mb-8 leading-relaxed">Perfect for one-time sessions where speed and privacy are paramount.</p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800"><span className="material-symbols-outlined text-black text-lg">check</span> Ephemeral sessions</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800"><span className="material-symbols-outlined text-black text-lg">check</span> 3 languages / call</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800"><span className="material-symbols-outlined text-black text-lg">check</span> Standard Voice</li>
                  </ul>
                </div>
                <Link href="/signup" className="block text-center w-full border border-slate-900 py-3 rounded-full font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-colors">Start Free</Link>
              </div>

              {/* Registered */}
              <div className="bg-white rounded-2xl p-10 border-2 border-black flex flex-col h-full relative shadow-2xl scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Most Popular</div>
                <div className="flex-grow">
                  <h4 className="text-2xl font-bold font-helvetica mb-4 text-slate-900">Registered</h4>
                  <div className="text-5xl font-bold text-slate-900 mb-8">$29 <span className="text-base font-normal text-slate-500">/ month</span></div>
                  <p className="text-slate-600 text-sm mb-8 leading-relaxed">The professional standard for individual creators and global consultants.</p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800"><span className="material-symbols-outlined text-black text-lg">check</span> Full Transcripts & Summaries</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800"><span className="material-symbols-outlined text-black text-lg">check</span> 40+ Language Library</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800"><span className="material-symbols-outlined text-black text-lg">check</span> AI Query Studio Access</li>
                  </ul>
                </div>
                <Link href="/signup" className="block text-center w-full bg-black text-white py-3 rounded-full font-bold hover:bg-slate-800 transition-colors">Go Pro</Link>
              </div>

              {/* Organization */}
              <div className="bg-white rounded-2xl p-10 border border-slate-200 flex flex-col h-full shadow-sm hover:shadow-xl transition-shadow">
                <div className="flex-grow">
                  <h4 className="text-2xl font-bold font-helvetica mb-4 text-slate-900">Organization</h4>
                  <div className="text-5xl font-bold text-slate-900 mb-8">Custom</div>
                  <p className="text-slate-600 text-sm mb-8 leading-relaxed">Global scale solutions with advanced security and management.</p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800"><span className="material-symbols-outlined text-black text-lg">check</span> Admin Control Panel</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800"><span className="material-symbols-outlined text-black text-lg">check</span> Custom Voice Training</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800"><span className="material-symbols-outlined text-black text-lg">check</span> SSO & Audit Logs</li>
                  </ul>
                </div>
                <Link href="/signup" className="block text-center w-full border border-slate-900 py-3 rounded-full font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-colors">Contact Sales</Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* DarkFooter */}
      <footer className="w-full bg-black py-16 md:py-20 px-6 flex flex-col md:flex-row justify-between items-start gap-10 border-t border-white/10 mt-0">
        <div className="mb-8 md:mb-0">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-8 w-8 text-white">
              <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <h2 className="font-helvetica font-bold text-2xl text-white">Relay</h2>
          </div>
          <p className="text-white/70 text-sm max-w-[300px]">© 2024 Relay AI. Meetings without borders.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 block">PRODUCT</span>
            <ul className="space-y-2 text-sm">
              <li><Link className="text-white/70 hover:text-white transition-colors" href="#features">Native Platform</Link></li>
              <li><Link className="text-white/70 hover:text-white transition-colors" href="#how-it-works">Integrations</Link></li>
              <li><Link className="text-white/70 hover:text-white transition-colors" href="#">Query Studio</Link></li>
            </ul>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 block">COMPANY</span>
            <ul className="space-y-2 text-sm">
              <li><Link className="text-white/70 hover:text-white transition-colors" href="#">Resources</Link></li>
              <li><Link className="text-white/70 hover:text-white transition-colors" href="#">Privacy</Link></li>
              <li><Link className="text-white/70 hover:text-white transition-colors" href="#">Terms</Link></li>
            </ul>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 block">SOCIAL</span>
            <ul className="space-y-2 text-sm">
              <li><Link className="text-white/70 hover:text-white transition-colors" href="#">X / Twitter</Link></li>
              <li><Link className="text-white/70 hover:text-white transition-colors" href="#">LinkedIn</Link></li>
              <li><Link className="text-white/70 hover:text-white transition-colors" href="#">GitHub</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
