'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher';

export default function ExternalMeetingPage() {
  const [meetingLink, setMeetingLink] = useState('');

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
            {/* Workspace Switcher */}
            <WorkspaceSwitcher />
          </div>
          {/* Search - Centered */}
          <div className="hidden md:flex relative w-full max-w-md items-center">
            <span className="material-symbols-outlined absolute left-4 text-[#8C8880] text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search external meetings, integrations..."
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
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-2">External Meeting</h1>
              <p className="text-[#8C8880] text-base">Connect Relay's AI translation to your favorite meeting platforms.</p>
            </div>

            {/* Quick Join Section */}
            <div className="bg-white rounded-2xl p-8 border border-[#D9D7D0]/40 shadow-sm relative overflow-hidden hover:shadow-lg transition-all">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#FAF9F5] rounded-full flex items-center justify-center border border-[#D9D7D0]/60 mb-4">
                  <span className="material-symbols-outlined text-black text-[24px]">login</span>
                </div>
                <h2 className="text-2xl font-bold text-black mb-2 flex items-center gap-2">
                  Join External Meeting
                </h2>
                <p className="text-[#8C8880] text-sm mb-6">Paste any meeting link from Zoom, Teams, or Google Meet to add real-time translation.</p>

                <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8880]">link</span>
                    <input
                      type="text"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="Paste meeting link (zoom.us, teams.microsoft.com, meet.google.com...)"
                      className="w-full bg-white/50 border border-[#c4c7c7]/30 rounded-full py-4 pl-12 pr-4 text-[#1c1b1b] placeholder:text-[#8C8880]/60 text-[15px] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!meetingLink}
                    className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    Connect & Translate
                  </button>
                </form>
              </div>
            </div>

            {/* External Meeting Features */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-black">How External Integration Works</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature 1 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-950/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-900/50">
                      <span className="material-symbols-outlined text-indigo-400 text-[22px]">smart_toy</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 mb-2">Silent AI Assistant</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">Relay joins your meeting as a silent participant, capturing audio for translation without disrupting the call.</p>
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-950/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-900/50">
                      <span className="material-symbols-outlined text-emerald-400 text-[22px]">headphones</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 mb-2">Side-Channel Audio</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">Receive translated audio through a private side channel while the original meeting audio continues normally.</p>
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-950/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-900/50">
                      <span className="material-symbols-outlined text-amber-400 text-[22px]">subtitles</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 mb-2">Live Subtitles</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">View real-time translated subtitles in your preferred language through the Relay overlay panel.</p>
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-rose-950/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-rose-900/50">
                      <span className="material-symbols-outlined text-rose-400 text-[22px]">description</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 mb-2">Full Transcript</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">Get complete multilingual transcripts and AI-generated summaries after every external meeting.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent External Meetings */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-black">Recent External Meetings</h2>
                <button className="text-sm font-bold text-black hover:text-indigo-600 transition-colors">View All</button>
              </div>

              <div className="bg-white border border-[#D9D7D0]/40 rounded-2xl shadow-sm overflow-hidden">
                <div className="divide-y divide-[#D9D7D0]/40">
                  {/* Meeting 1 */}
                  <div className="p-5 hover:bg-[#FAF9F5] transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-blue-600 text-[20px]">videocam</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-black group-hover:text-blue-600 transition-colors">Q4 Strategy Review</h4>
                          <p className="text-[#8C8880] text-xs mt-0.5">Zoom • 2h 30m ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Translated</span>
                        <span className="material-symbols-outlined text-[#8C8880]">chevron_right</span>
                      </div>
                    </div>
                  </div>

                  {/* Meeting 2 */}
                  <div className="p-5 hover:bg-[#FAF9F5] transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-indigo-600 text-[20px]">groups</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-black group-hover:text-indigo-600 transition-colors">Product Sync with Partners</h4>
                          <p className="text-[#8C8880] text-xs mt-0.5">Microsoft Teams • Yesterday</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Translated</span>
                        <span className="material-symbols-outlined text-[#8C8880]">chevron_right</span>
                      </div>
                    </div>
                  </div>

                  {/* Meeting 3 */}
                  <div className="p-5 hover:bg-[#FAF9F5] transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-emerald-600 text-[20px]">meeting_room</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-black group-hover:text-emerald-600 transition-colors">Client Onboarding Call</h4>
                          <p className="text-[#8C8880] text-xs mt-0.5">Google Meet • 2 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Processing</span>
                        <span className="material-symbols-outlined text-[#8C8880]">chevron_right</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
