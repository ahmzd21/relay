'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function NativeMeetingPage() {
  const [joinLink, setJoinLink] = useState('');

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1c1b1b] flex font-helvetica selection:bg-black selection:text-white">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Header */}
        <header className="h-20 border-b border-[#D9D7D0]/40 flex items-center justify-between px-6 md:px-10 bg-white/80 backdrop-blur-xl z-20 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 -ml-2 text-black">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
          {/* Search - Centered */}
          <div className="hidden md:flex relative w-full max-w-md items-center">
            <span className="material-symbols-outlined absolute left-4 text-[#8C8880] text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search meetings, insights, or people..."
              className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#8C8880] hover:text-black transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-6 bg-[#D9D7D0]"></div>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                ET
              </div>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-10">

            {/* Welcome Banner */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-2">Native Meeting</h1>
              <p className="text-[#8C8880] text-base">Create and manage Relay-native meetings with built-in AI translation and collaboration tools.</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Create Instant Meeting Card */}
              <div className="lg:col-span-1 bg-black rounded-2xl p-8 shadow-md shadow-black/20 text-left relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 mb-4">
                      <span className="material-symbols-outlined text-white">video_call</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">New Meeting</h2>
                    <p className="text-white/60 text-sm">Start an instant native session with real-time intelligence.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6">
                    h                    <button className="bg-white text-black px-6 py-3.5 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-lg text-sm flex items-center justify-center gap-2 group/btn">
                      Start Now
                      <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-0.5 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Join Meeting Input Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-[#D9D7D0]/40 shadow-md relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-[#FAF9F5] rounded-full flex items-center justify-center border border-[#D9D7D0]/60 mb-4">
                      <span className="material-symbols-outlined text-black text-[24px]">login</span>
                    </div>
                    <h2 className="text-xl font-bold text-black mb-1 flex items-center gap-2">
                      Join a Meeting
                    </h2>
                    <p className="text-[#8C8880] text-sm mb-6">Enter a Relay link or ID to instantly connect with real-time translation.</p>
                  </div>
                  <form className="flex flex-col sm:flex-row gap-3 mt-auto" onSubmit={(e) => e.preventDefault()}>
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8880]">link</span>
                      <input
                        type="text"
                        value={joinLink}
                        onChange={(e) => setJoinLink(e.target.value)}
                        placeholder="e.g. relay.ai/m/elias-room"
                        className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-2xl py-4 pl-12 pr-4 text-black focus:outline-none focus:ring-1 focus:ring-black transition-all font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!joinLink}
                      className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                    >
                      Join Now
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* Bento-Style Meetings (Col-span-8) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-2xl font-bold tracking-tight text-black flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-[#8C8880]">history</span>
                  Recent Meetings
                </h3>
                <div className="flex gap-1.5 bg-[#D9D7D0]/20 p-1 rounded-xl self-start sm:self-auto">
                  <button className="px-3 py-1.5 bg-white shadow-sm text-black rounded-lg text-[10px] font-bold tracking-wider uppercase font-['Inter'] transition-colors">All</button>
                  <button className="px-3 py-1.5 text-[#8C8880] hover:text-black rounded-lg text-[10px] font-bold tracking-wider uppercase font-['Inter'] transition-colors">Transcripts</button>
                  <button className="px-3 py-1.5 text-[#8C8880] hover:text-black rounded-lg text-[10px] font-bold tracking-wider uppercase font-['Inter'] transition-colors">Whiteboards</button>
                </div>
              </div>
            </div>

            {/* Bento Grid layout matching the detail treatment from native-meeting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Card 1 */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/50 text-indigo-400 flex items-center justify-center border border-indigo-900/50">
                      <span className="material-symbols-outlined text-[20px]">translate</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="bg-indigo-950/50 text-indigo-400 border border-indigo-900/50 px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase font-['Inter']">AI READY</span>
                      <span className="bg-slate-800 border border-slate-700/60 text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold font-['Inter']">AR | EN</span>
                    </div>
                  </div>
                  <h5 className="font-bold text-slate-100 mb-1 group-hover:text-rose-400 transition-colors">MENA Expansion Strategy</h5>
                  <p className="text-slate-400 text-xs mb-4">2h 45m ago • Session ID: #R902</p>
                </div>
                <div className="flex -space-x-2 overflow-hidden py-1">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-indigo-950 text-indigo-400 flex items-center justify-center text-[8px] font-bold">ET</div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-indigo-900 text-indigo-300 flex items-center justify-center text-[8px] font-bold">SK</div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-200">+3</div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-950/50 text-amber-400 flex items-center justify-center border border-amber-900/50">
                      <span className="material-symbols-outlined text-[20px]">draw</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="bg-indigo-950/50 text-indigo-400 border border-indigo-900/50 px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase font-['Inter']">AI READY</span>
                      <span className="bg-slate-800 border border-slate-700/60 text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold font-['Inter']">JP | EN</span>
                    </div>
                  </div>
                  <h5 className="font-bold text-slate-100 mb-1 group-hover:text-rose-400 transition-colors">Tokyo Creative Workshop</h5>
                  <p className="text-slate-400 text-xs mb-4">Yesterday • Session ID: #J881</p>
                </div>
                <div className="flex -space-x-2 overflow-hidden py-1">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-200">YS</div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300">MK</div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950/50 text-emerald-400 flex items-center justify-center border border-emerald-900/50">
                      <span className="material-symbols-outlined text-[20px]">forum</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="bg-slate-800 border border-slate-700/60 text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold font-['Inter']">EN | FR</span>
                    </div>
                  </div>
                  <h5 className="font-bold text-slate-100 mb-1 group-hover:text-rose-400 transition-colors">Paris Sync: Design Ops</h5>
                  <p className="text-slate-400 text-xs mb-4">2 days ago • Session ID: #P120</p>
                </div>
                <div className="flex -space-x-2 overflow-hidden py-1">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-emerald-950 text-emerald-400 flex items-center justify-center text-[8px] font-bold">PL</div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-950/50 text-rose-400 flex items-center justify-center border border-rose-900/50">
                      <span className="material-symbols-outlined text-[20px]">mic</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="bg-rose-950/50 text-rose-400 border border-rose-900/50 px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase font-['Inter']">ANALYZING</span>
                      <span className="bg-slate-800 border border-slate-700/60 text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold font-['Inter']">EN</span>
                    </div>
                  </div>
                  <h5 className="font-bold text-slate-100 mb-1 group-hover:text-rose-400 transition-colors">Global Town Hall</h5>
                  <p className="text-slate-400 text-xs mb-4">Last week • Session ID: #T001</p>
                </div>
                <div className="flex -space-x-2 overflow-hidden py-1">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-200">120+</div>
                </div>
              </div>

            </div>

            {/* Native Meeting Features */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-black">Native Meeting Features</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-indigo-600 text-[24px]">draw</span>
                  </div>
                  <h3 className="font-bold text-black mb-2">Interactive Whiteboards</h3>
                  <p className="text-[#8C8880] text-sm leading-relaxed">Collaborative whiteboards with real-time translation for diagrams and sketches.</p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-emerald-600 text-[24px]">smart_toy</span>
                  </div>
                  <h3 className="font-bold text-black mb-2">AI Intelligence</h3>
                  <p className="text-[#8C8880] text-sm leading-relaxed">Real-time summaries, action item extraction, and semantic search across transcripts.</p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-amber-600 text-[24px]">record_voice_over</span>
                  </div>
                  <h3 className="font-bold text-black mb-2">Voice-to-Voice Translation</h3>
                  <p className="text-[#8C8880] text-sm leading-relaxed">Neural synthesis preserves emotion and vocal characteristics across 40+ languages.</p>
                </div>

                {/* Feature 4 */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-rose-600 text-[24px]">subtitles</span>
                  </div>
                  <h3 className="font-bold text-black mb-2">Dynamic Subtitles</h3>
                  <p className="text-[#8C8880] text-sm leading-relaxed">Personalized subtitle streams per user with independent language preferences.</p>
                </div>

                {/* Feature 5 */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-blue-600 text-[24px]">security</span>
                  </div>
                  <h3 className="font-bold text-black mb-2">Secure Recording</h3>
                  <p className="text-[#8C8880] text-sm leading-relaxed">Encrypted cloud storage for transcripts, recordings, and meeting artifacts.</p>
                </div>

                {/* Feature 6 */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-purple-600 text-[24px]">groups</span>
                  </div>
                  <h3 className="font-bold text-black mb-2">Breakout Rooms</h3>
                  <p className="text-[#8C8880] text-sm leading-relaxed">Create smaller discussion groups with continued translation support.</p>
                </div>
              </div>


            </div>
          </div>
        </div>
      </main >
    </div >
  );
}
