"use client";
import React, { useState } from "react";
import Link from "next/link";
import PinkGlobe from "@/components/PinkGlobe";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="overflow-x-hidden bg-[#FAF9F5] text-[#1B1B1B]">
      {/* MainHeader */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-2 max-w-[1200px] w-[95%] mx-auto rounded-full mt-4 bg-black backdrop-blur-[20px] border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            className="h-8 w-8 text-white"
          >
            <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <Link
            href="/"
            className="text-lg font-helvetica font-bold tracking-tighter text-white"
          >
            Relay
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            className="text-white/60 text-sm hover:text-white transition-colors duration-300"
            href="#about"
          >
            About
          </Link>
          <Link
            className="text-white/60 text-sm hover:text-white transition-colors duration-300"
            href="#how-it-works"
          >
            How it Works
          </Link>
          <Link
            className="text-white/60 text-sm hover:text-white transition-colors duration-300"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-white/60 text-sm hover:text-white transition-colors duration-300"
            href="#pricing"
          >
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all scale-95 active:scale-90 duration-300"
          >
            Get Started
          </Link>
          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            ></span>
            <span
              className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            ></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col px-6 pt-28 pb-10 gap-6 transition-all duration-300 md:hidden ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <Link
          href="#about"
          onClick={() => setMenuOpen(false)}
          className="text-white text-xl font-bold font-helvetica border-b border-white/10 pb-4"
        >
          About
        </Link>
        <Link
          href="#features"
          onClick={() => setMenuOpen(false)}
          className="text-white text-xl font-bold font-helvetica border-b border-white/10 pb-4"
        >
          Features
        </Link>
        <Link
          href="#how-it-works"
          onClick={() => setMenuOpen(false)}
          className="text-white text-xl font-bold font-helvetica border-b border-white/10 pb-4"
        >
          How it Works
        </Link>
        <Link
          href="#pricing"
          onClick={() => setMenuOpen(false)}
          className="text-white text-xl font-bold font-helvetica border-b border-white/10 pb-4"
        >
          Pricing
        </Link>
        <Link
          href="/signup"
          onClick={() => setMenuOpen(false)}
          className="mt-4 bg-white text-black px-6 py-4 rounded-full font-bold text-center text-base"
        >
          Get Started
        </Link>
      </div>

      <main>
        {/* Hero Section */}
        <section
          className="relative pt-32 md:pt-[280px] pb-12 md:pb-24 px-6 text-center overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% -20%, #FFFDF8 0%, #FAF9F5 100%)",
          }}
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF416C]/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-20 -left-48 w-80 h-80 bg-[#FF4B2B]/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-6xl md:text-[68px] mb-6 tracking-tighter leading-none font-helvetica font-bold text-slate-900">
              Break the{" "}
              <span className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] bg-clip-text text-transparent">
                Language Barrier
              </span>
              <br className="hidden sm:inline" />
              in Every Meeting
            </h1>
            <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 md:mb-16 leading-relaxed">
              Experience crystal-clear, real-time voice-to-voice translation.
              Connect natively or bridge to your existing workflows with
              millisecond latency.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 max-w-sm sm:max-w-prose mx-auto sm:max-w-none justify-center gap-3 sm:gap-4">
              <button className="w-full bg-black text-white px-5 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg">
                <span className="material-symbols-outlined">video_call</span>
                Start Native Meeting
              </button>
              <button className="w-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-5 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg shadow-[#FF416C]/20">
                <span className="material-symbols-outlined">link</span>
                Connect Third-Party Link
              </button>
            </div>
          </div>
        </section>

        {/* Speak Your Language + Meeting UI Visual */}
        <section id="" className="py-12 md:py-28 px-6 scroll-mt-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-sm font-bold text-[#FF416C] uppercase tracking-widest mb-4 block">
                AI-Driven Orchestration
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-helvetica tracking-tight mb-8">
                Speak your language. Let Relay handle the rest.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-10">
                Every participant controls their own speaking, hearing, and
                subtitle language preferences. Our system ensures you hear your
                colleagues in your native language, simultaneously and without
                disruption.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-800 font-medium">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    ></path>
                  </svg>
                  Independent, personalized subtitle streams per user
                </li>
                <li className="flex items-center gap-3 text-slate-800 font-medium">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    ></path>
                  </svg>
                  AI-driven summaries and transcript querying via Chat Studio
                </li>
                <li className="flex items-center gap-3 text-slate-800 font-medium">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    ></path>
                  </svg>
                  Secure meeting transcripts and cloud recording storage
                </li>
              </ul>
            </div>

            {/* Redesigned Meeting Visualization (From previous setup) */}
            <div className="relative" data-purpose="collage-container">
              <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden shadow-2xl bg-[#0f1115] border border-white/10">
                {/* Meeting Grid */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-2">
                  {/* Elias */}
                  <div
                    className="rounded-2xl overflow-hidden relative"
                    style={{
                      background:
                        "linear-gradient(135deg, #2d3748 0%, #4a5568 100%)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-xl font-bold text-white font-helvetica">
                          E
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm font-bold tracking-wider">
                      Elias (English)
                    </span>
                  </div>
                  {/* Sofia — active speaker */}
                  <div
                    className="rounded-2xl overflow-hidden relative border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                    style={{
                      background:
                        "linear-gradient(135deg, #1a3a2a 0%, #2d6a4f 100%)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-xl font-bold text-white font-helvetica">
                          S
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="animate-pulse-glow h-2 w-2 rounded-full bg-green-500 block"></span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm font-bold tracking-wider">
                      Sofia (Spanish)
                    </span>
                  </div>
                  {/* Wei */}
                  <div
                    className="rounded-2xl overflow-hidden relative"
                    style={{
                      background:
                        "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-xl font-bold text-white font-helvetica">
                          W
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm font-bold tracking-wider">
                      Wei (Chinese)
                    </span>
                  </div>
                  {/* Yousef */}
                  <div
                    className="rounded-2xl overflow-hidden relative"
                    style={{
                      background:
                        "linear-gradient(135deg, #3b1f0a 0%, #7c3d12 100%)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                        <span className="text-xl font-bold text-white font-helvetica">
                          Y
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm font-bold tracking-wider">
                      Yousef (Arabic)
                    </span>
                  </div>
                </div>

                {/* Subtitle Overlay */}
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-[75%] bg-black rounded-2xl p-3 sm:p-2 border border-white/10 text-center shadow-2xl">
                  <p className="text-white font-medium text-xs sm:text-xs md:text-base italic">
                    &quot;El diseño de la nueva interfaz se ve muy bien&quot;
                  </p>
                  <p className="text-slate-400 text-[8px] sm:text-[10px] mt-1 uppercase tracking-widest font-bold">
                    Sofia is speaking Spanish
                  </p>
                </div>
              </div>

              {/* Restyled UI Element */}
              <div className="absolute -top-24 -right-8 p-4 rounded-2xl w-48 xl:w-56 border border-white/10 bg-black shadow-2xl hidden lg:block">
                <div className="text-[10px] uppercase tracking-widest mb-3 font-medium flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4B2B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF416C]"></span>
                  </div>
                  <span className="bg-[#FF416C] bg-clip-text text-transparent">
                    Meeting Insights
                  </span>
                </div>
                <div className="text-sm text-white font-bold mb-2">
                  Key Action Items
                </div>
                <ul className="text-[12px] font-medium text-slate-400 space-y-2">
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined">
                      arrow_right_alt
                    </span>{" "}
                    Finalize API schema
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined">
                      arrow_right_alt
                    </span>{" "}
                    Schedule vendor sync
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Cards */}
        <section className="py-12 md:py-28 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-bold text-[#FF416C] uppercase tracking-widest block mb-4">
              Core Technology
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-helvetica mb-6 text-slate-900">
              A Complete Intelligence Ecosystem
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Beyond just translation, Relay provides a suite of intelligent
              tools designed to bridge language gaps effortlessly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-lg shadow-[#FF416C]/20">
                <span className="material-symbols-outlined text-white">
                  record_voice_over
                </span>
              </div>
              <h3 className="text-2xl font-bold font-helvetica text-slate-900">
                Simultaneous Delivery
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Seamlessly toggle between voice-to-voice neural synthesis and
                live captioning. Relay preserves emotional tone and vocal
                characteristics across 40+ languages.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-lg shadow-[#FF416C]/20">
                <span className="material-symbols-outlined text-white">
                  hub
                </span>
              </div>
              <h3 className="text-2xl font-bold font-helvetica text-slate-900">
                Platform Bridge
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                No need to switch. Our native integrations for Zoom, Microsoft
                Teams, and Google Meet inject translation layers directly into
                your preferred workflow.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-lg shadow-[#FF416C]/20">
                <span className="material-symbols-outlined text-white">
                  analytics
                </span>
              </div>
              <h3 className="text-2xl font-bold font-helvetica text-slate-900">
                AI Query Studio
              </h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Go beyond transcripts. Ask natural language questions about your
                meeting history, generate semantic summaries, and track
                cross-cultural sentiment trends.
              </p>
            </div>
          </div>
        </section>

        {/* About */}
        <section
          id="about"
          className="py-16 md:py-28 bg-black text-white px-4 md:px-6 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-sm font-bold text-[#FF416C] uppercase tracking-widest block mb-4">
                Our Mission
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-helvetica tracking-tight">
                About Relay
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              {/* Left — Mission */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold font-helvetica tracking-tight leading-tight mb-8">
                  Language should never be the reason a great idea gets{" "}
                  <span className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] bg-clip-text text-transparent">
                    lost in translation
                  </span>
                </h3>
                <div className="space-y-5 text-white/60 text-lg leading-relaxed">
                  <p>
                    Relay was built on a simple belief: every voice deserves to
                    be understood, no matter what language it speaks. We saw
                    teams struggling with miscommunication, meetings where half
                    the room was lost, and brilliant ideas dying because of
                    language barriers.
                  </p>
                  <p>
                    Our AI-first platform translates speech in real-time at 40ms
                    latency — fast enough that conversation flows naturally. No
                    awkward pauses. No context lost. Just human connection,
                    across every language.
                  </p>
                </div>
              </div>

              {/* Right — Visual */}
              <div className="relative flex items-center justify-center w-full min-h-[400px]">
                <PinkGlobe />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works — Option D: Two-Column Alternating */}
        <section
          id="how-it-works"
          className="py-16 md:py-28 bg-black text-white px-4 md:px-6 scroll-mt-20 overflow-hidden"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-24">
              <span className="text-sm font-bold text-[#FF416C] uppercase tracking-widest block mb-4">
                Simple by Design
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-helvetica tracking-tight">
                How Relay Works
              </h2>
              <p className="text-white/60 text-lg mt-6 max-w-xl mx-auto">
                Three steps. Any platform. Every language.
              </p>
            </div>

            <div className="space-y-8">
              {/* Step 1 — text left, visual right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-10 hover:border-[#FF416C]/30 transition-all">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#FF416C] flex items-center justify-center text-white font-black text-base shadow-lg shadow-[#FF416C]/30">
                      1
                    </div>
                    <h3 className="text-2xl font-bold font-helvetica">
                      Start or Join
                    </h3>
                  </div>
                  <p className="text-white/60 leading-relaxed">
                    Launch a native Relay meeting, or paste a Zoom, Teams, or
                    Google Meet link. Relay silently bridges in as your personal
                    translation layer — no installs required for others.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-wider">
                    <span>Mode</span>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 rounded bg-white/10 text-white/50">
                        Native
                      </span>
                      <span className="px-2 py-1 rounded bg-white/10 text-white/50">
                        External
                      </span>
                    </div>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-8 bg-white/10 rounded-lg text-[10px] text-white/40 flex items-center px-3">
                      meet.google.com/abc-xyz-def
                    </div>
                    <div className="h-8 px-4 rounded-lg bg-[#FF416C] text-white text-[10px] font-bold flex items-center">
                      Join
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 — visual left, text right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-10 hover:border-[#FF416C]/30 transition-all">
                <div className="md:order-2">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#FF416C] flex items-center justify-center text-white font-black text-base shadow-lg shadow-[#FF416C]/30">
                      2
                    </div>
                    <h3 className="text-2xl font-bold font-helvetica">
                      Set Your Languages
                    </h3>
                  </div>
                  <p className="text-white/60 leading-relaxed">
                    Each participant picks the language they speak and the
                    language they want to hear — voice output or live subtitles.
                    Completely independent per user, no coordination needed.
                  </p>
                </div>
                <div className="md:order-1 rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-wider">
                    <span>Language to Speak</span>
                    <span className="text-white/70 font-bold normal-case">
                      English 🇬🇧
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-wider">
                    <span>Language to Hear</span>
                    <span className="text-white/70 font-bold normal-case">
                      Spanish 🇪🇸
                    </span>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-wider">
                    <span>Output mode</span>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 rounded bg-[#FF416C] text-white font-bold">
                        Voice
                      </span>
                      <span className="px-2 py-1 rounded bg-white/10 text-white/50">
                        Subtitles
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 — text left, visual right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-3xl border border-white/10 bg-white/[0.05] p-5 sm:p-10 hover:border-[#FF416C]/30 transition-all">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#FF416C] flex items-center justify-center text-white font-black text-base shadow-lg shadow-[#FF416C]/30">
                      3
                    </div>
                    <h3 className="text-2xl font-bold font-helvetica">
                      Relay Does the Rest
                    </h3>
                  </div>
                  <p className="text-white/60 leading-relaxed">
                    Speak naturally. Relay translates in real-time at 40ms
                    latency, delivers audio privately per participant, and
                    generates a full multilingual summary when the call ends.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF416C] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF416C]"></span>
                    </div>
                    <span className="text-[11px] text-white/60">
                      Live translation active — 40ms latency
                    </span>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <p className="text-[11px] text-white/50 italic leading-relaxed">
                    &quot;El nuevo diseño se ve increíble...&quot;
                  </p>
                  <p className="text-[10px] text-[#FF416C] font-bold uppercase tracking-wider">
                    → Heard in English
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 md:py-28 bg-[#FAF9F5] overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-sm font-bold text-[#FF416C] uppercase tracking-widest block mb-4">
                Trusted Worldwide
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-helvetica text-slate-900">
                What Global Teams Say
              </h2>
              <p className="text-slate-600 text-lg mt-6 max-w-2xl mx-auto">
                Trusted by distributed teams across 40+ countries to break down
                language barriers in every meeting.
              </p>
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
                  <div className="bg-black p-6 sm:p-10 rounded-2xl shadow-sm border border-white/10 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg hover:border-[#FF416C]/30 transition-all">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">
                        &quot;Relay has completely transformed how our
                        engineering teams across Berlin, Beijing, and New York
                        collaborate. The latency is practically
                        non-existent.&quot;
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center font-bold text-white">
                        MK
                      </div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">
                          Marcus K.
                        </h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">
                          VP of Engineering
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 2 */}
                  <div className="bg-black p-6 sm:p-10 rounded-2xl shadow-sm border border-white/10 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg hover:border-[#FF416C]/30 transition-all">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">
                        &quot;The Silent Capture Bot is genius. We use it on all
                        our client Zoom calls now. Our Spanish-speaking partners
                        don't even know we're using translation software.&quot;
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center font-bold text-white">
                        SL
                      </div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">
                          Sarah L.
                        </h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">
                          Agency Director
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 3 */}
                  <div className="bg-black p-6 sm:p-10 rounded-2xl shadow-sm border border-white/10 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg hover:border-[#FF416C]/30 transition-all">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star_half
                        </span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">
                        &quot;Having the semantic whiteboard auto-translate
                        technical architecture diagrams into Chinese in
                        real-time has saved us hours of miscommunication.&quot;
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center font-bold text-white">
                        WC
                      </div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">
                          Wei C.
                        </h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">
                          Product Architect
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 4 */}
                  <div className="bg-black p-6 sm:p-10 rounded-2xl shadow-sm border border-white/10 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg hover:border-[#FF416C]/30 transition-all">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">
                        &quot;Finally, a tool that respects accents and regional
                        dialects. Relay handles complex conversations flawlessly
                        during our board meetings.&quot;
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center font-bold text-white">
                        AJ
                      </div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">
                          Aisha J.
                        </h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">
                          Chief Operations Officer
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 5 */}
                  <div className="bg-black p-6 sm:p-10 rounded-2xl shadow-sm border border-white/10 flex flex-col justify-between w-[280px] sm:w-[400px] flex-shrink-0 cursor-default hover:shadow-lg hover:border-[#FF416C]/30 transition-all">
                    <div>
                      <div className="flex text-amber-400 mb-6 gap-1">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star_half
                        </span>
                      </div>
                      <p className="text-white/80 mb-8 leading-relaxed italic">
                        &quot;The AI Query Studio is a game-changer. I no longer
                        have to scrub through hours of recordings to find
                        specific decisions made in our global syncs.&quot;
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center font-bold text-white">
                        TP
                      </div>
                      <div>
                        <h5 className="font-bold text-white font-helvetica">
                          Tom P.
                        </h5>
                        <p className="text-xs text-white/50 uppercase tracking-wider">
                          Product Manager
                        </p>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="py-16 md:py-28 px-4 md:px-6 max-w-7xl mx-auto overflow-hidden"
        >
          <div className="text-center mb-24">
            <span className="text-sm font-bold text-[#FF416C] uppercase tracking-widest block mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-helvetica mb-6">
              Everything You Need
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Beyond translation. A full suite of intelligent tools built for
              multilingual teams.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "translate",
                label: "Real-Time Translation",
                desc: "Voice-to-voice neural translation across 40+ languages with 40ms latency.",
              },
              {
                icon: "subtitles",
                label: "Dynamic Subtitles",
                desc: "Personalized subtitle streams per participant with independent language preferences.",
              },
              {
                icon: "record_voice_over",
                label: "Voice Synthesis",
                desc: "Preserves emotional tone and vocal characteristics across language boundaries.",
              },
              {
                icon: "draw",
                label: "Interactive Whiteboards",
                desc: "Collaborative canvases with real-time translation for diagrams and sketches.",
              },
              {
                icon: "smart_toy",
                label: "AI Summaries",
                desc: "Automatic action items, key decisions, and semantic summaries after every meeting.",
              },
              {
                icon: "security",
                label: "Encrypted Recording",
                desc: "Secure cloud storage for transcripts, recordings, and meeting artifacts.",
              },
            ].map((feature) => (
              <div
                key={feature.icon}
                className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-[#FF416C]/20">
                  <span className="material-symbols-outlined text-white text-[28px]">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-helvetica text-slate-900 mb-3">
                  {feature.label}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-12 md:py-28 px-6 scroll-mt-20 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <span className="text-sm font-bold text-[#FF416C] uppercase tracking-widest block mb-4">
                Pricing
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-helvetica text-slate-900">
                Flexible Plans
              </h2>
              <p className="text-slate-600 text-lg mt-6 max-w-2xl mx-auto">
                Start free. Scale as your team grows. No hidden fees, no
                surprises.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {/* Guest */}
              <div className="bg-white rounded-2xl p-5 sm:p-10 border border-slate-200 flex flex-col h-full shadow-sm hover:shadow-xl transition-shadow">
                <div className="flex-grow">
                  <h4 className="text-2xl font-bold font-helvetica mb-4 text-slate-900">
                    Guest
                  </h4>
                  <div className="text-5xl font-bold text-slate-900 mb-8">
                    $0{" "}
                    <span className="text-base font-normal text-slate-500">
                      / meeting
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                    Perfect for one-time sessions where speed and privacy are
                    paramount.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <span className="material-symbols-outlined text-black text-lg">
                        check
                      </span>{" "}
                      Ephemeral sessions
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <span className="material-symbols-outlined text-black text-lg">
                        check
                      </span>{" "}
                      3 languages / call
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <span className="material-symbols-outlined text-black text-lg">
                        check
                      </span>{" "}
                      Standard Voice
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="block text-center w-full border border-slate-900 py-3 rounded-full font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Start Free
                </Link>
              </div>

              {/* Registered */}
              <div className="bg-white rounded-2xl p-5 sm:p-10 border-2 border-black flex flex-col h-full relative shadow-2xl md:scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#FF416C]/20">
                  Most Popular
                </div>
                <div className="flex-grow">
                  <h4 className="text-2xl font-bold font-helvetica mb-4 text-slate-900">
                    Registered
                  </h4>
                  <div className="text-5xl font-bold text-slate-900 mb-8">
                    $29{" "}
                    <span className="text-base font-normal text-slate-500">
                      / month
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                    The professional standard for individual creators and global
                    consultants.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <span className="material-symbols-outlined text-black text-lg">
                        check
                      </span>{" "}
                      Full Transcripts & Summaries
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <span className="material-symbols-outlined text-black text-lg">
                        check
                      </span>{" "}
                      40+ Language Library
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <span className="material-symbols-outlined text-black text-lg">
                        check
                      </span>{" "}
                      AI Query Studio Access
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="block text-center w-full bg-black text-white py-3 rounded-full font-bold hover:bg-slate-800 transition-colors"
                >
                  Go Pro
                </Link>
              </div>

              {/* Organization */}
              <div className="bg-white rounded-2xl p-5 sm:p-10 border-2 border-slate-200 flex flex-col h-full shadow-sm hover:shadow-xl transition-shadow">
                <div className="flex-grow">
                  <h4 className="text-2xl font-bold font-helvetica mb-4 text-slate-900">
                    Organization
                  </h4>
                  <div className="text-5xl font-bold text-slate-900 mb-8">
                    Custom
                  </div>
                  <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                    Global scale solutions with advanced security and
                    management.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <span className="material-symbols-outlined text-black text-lg">
                        check
                      </span>{" "}
                      Admin Control Panel
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <span className="material-symbols-outlined text-black text-lg">
                        check
                      </span>{" "}
                      Custom Voice Training
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-800">
                      <span className="material-symbols-outlined text-black text-lg">
                        check
                      </span>{" "}
                      SSO & Audit Logs
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="block text-center w-full border border-slate-900 py-3 rounded-full font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* DarkFooter */}
      <footer className="w-full bg-black py-16 md:py-20 px-6 flex flex-col md:flex-row justify-between items-start gap-10 border-t border-white/10 mt-0">
        <div className="mb-8 md:mb-0">
          <div className="flex items-center gap-2 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              className="h-8 w-8 text-white"
            >
              <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <h2 className="font-helvetica font-bold text-2xl text-white">
              Relay
            </h2>
          </div>
          <p className="text-white/70 text-sm max-w-[300px]">
            © 2026 Relay AI. Meetings without borders.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 block">
              PRODUCT
            </span>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="text-white/70 hover:text-white transition-colors"
                  href="#features"
                >
                  Native Platform
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 hover:text-white transition-colors"
                  href="#how-it-works"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 hover:text-white transition-colors"
                  href="#"
                >
                  Query Studio
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 block">
              COMPANY
            </span>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="text-white/70 hover:text-white transition-colors"
                  href="#"
                >
                  Resources
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 hover:text-white transition-colors"
                  href="#"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 hover:text-white transition-colors"
                  href="#"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 block">
              SOCIAL
            </span>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="text-white/70 hover:text-white transition-colors"
                  href="#"
                >
                  X / Twitter
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 hover:text-white transition-colors"
                  href="#"
                >
                  LinkedIn
                </Link>
              </li>
              <li>
                <Link
                  className="text-white/70 hover:text-white transition-colors"
                  href="#"
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
