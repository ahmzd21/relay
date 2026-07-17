'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function MainDashboardPage() {
  const [joinLink, setJoinLink] = useState('');

  // Sample data: Only AI-extracted tasks assigned to Elias (Lead Developer)
  const eliasTasks = [
    {
      id: 1,
      meeting: "MENA Expansion Strategy",
      task: "Integrate Arabic language model optimizations into the workspace translation pipeline.",
      dueDate: "Tomorrow",
    },
    {
      id: 2,
      meeting: "Product Roadmap Sync",
      task: "Review Figma prototypes for the collaborative whiteboard session and validate real-time sync performance.",
      dueDate: "Friday",
    },
    {
      id: 3,
      meeting: "Native Meeting Channel Sync",
      task: "Investigate side-channel audio latency issues reported during peak usage testing.",
      dueDate: "Last Week",
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1c1b1b] flex font-helvetica selection:bg-black selection:text-white">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Header - Unified design language */}
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
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-2">Welcome back, Elias</h1>
              <p className="text-[#8C8880] text-base">Your AI studio has extracted 3 personal action items for you today.</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Create Instant Meeting Card */}
              <div className="lg:col-span-1 bg-black rounded-2xl p-8 border border-[#D9D7D0]/40 shadow-md shadow-black/20 text-left relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 mb-4">
                      <span className="material-symbols-outlined text-white">video_call</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">New Meeting</h2>
                    <p className="text-white/60 text-sm">Start an instant native session with real-time intelligence.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6">
                    <button className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2 group/btn">
                      Start Now
                      <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-x-0.5 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Join Meeting Input Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-md relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-[#FAF9F5] rounded-full flex items-center justify-center border border-[#D9D7D0]/60 mb-4">
                      <span className="material-symbols-outlined text-black text-[24px]">login</span>
                    </div>
                    <h2 className="text-xl font-bold text-black mb-1">
                      Join External Meeting
                    </h2>
                    <p className="text-[#8C8880] text-sm mb-6">Paste any meeting link from Zoom, Teams, or Google Meet to add real-time translation.</p>
                  </div>
                  <form className="flex flex-col sm:flex-row gap-3 mt-auto" onSubmit={(e) => e.preventDefault()}>
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8880]">link</span>
                      <input
                        type="text"
                        value={joinLink}
                        onChange={(e) => setJoinLink(e.target.value)}
                        placeholder="e.g. relay.ai/m/elias-room"
                        className="w-full bg-white/50 border border-[#c4c7c7]/30 rounded-full py-4 pl-12 pr-4 text-[#1c1b1b] placeholder:text-[#8C8880]/60 text-[15px] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!joinLink}
                      className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                    >
                      Join Now
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* Secondary Grid: Schedule Left & Personal Action Items Bento Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Upcoming Schedule (Col-span-4) */}
              <div className="lg:col-span-4 bg-white border border-[#D9D7D0]/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold tracking-tight text-black flex items-center gap-2">
                      <span className="material-symbols-outlined text-[22px] text-[#8C8880]">calendar_today</span>
                      Schedule
                    </h3>
                    <button className="text-[#8C8880] hover:text-black transition-colors">
                      <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">sync</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Schedule Active Event */}
                    <div className="relative pl-5 py-2 border-l-2 border-indigo-500 bg-indigo-500/5 rounded-r-xl">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-['Inter']">In 15 Minutes</p>
                      <h5 className="text-sm font-bold text-black mt-0.5">Quarterly Review | DE-EN</h5>
                      <p className="text-[#8C8880] text-xs mt-0.5">Sarah, Klaus + 4 others</p>
                    </div>

                    {/* Event 2 */}
                    <div className="relative pl-5 py-2 border-l-2 border-[#D9D7D0]/60 group hover:border-black/30 transition-colors">
                      <p className="text-[10px] font-bold text-[#8C8880] uppercase tracking-wider font-['Inter']">14:30 PM</p>
                      <h5 className="text-sm font-bold text-black mt-0.5">Product Roadmap Sync</h5>
                      <p className="text-[#8C8880] text-xs mt-0.5">Dev Team</p>
                    </div>

                    {/* Event 3 */}
                    <div className="relative pl-5 py-2 border-l-2 border-[#D9D7D0]/60">
                      <p className="text-[10px] font-bold text-[#8C8880] uppercase tracking-wider font-['Inter']">Tomorrow</p>
                      <h5 className="text-sm font-bold text-black mt-0.5">Translation Validation</h5>
                      <p className="text-[#8C8880] text-xs mt-0.5">Localization Lead</p>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-8 py-4 border border-slate-400 text-slate-900 bg-white rounded-full font-bold text-sm hover:bg-black hover:text-white transition-all shadow-sm">
                  View Full Calendar
                </button>
              </div>

              {/* PERSONAL AI Action Items (Col-span-8) - Lead Developer Role Focus */}
              <div className="lg:col-span-8 bg-white border border-[#D9D7D0]/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold tracking-tight text-black flex items-center gap-2">
                        <span className="material-symbols-outlined text-[22px] text-[#8C8880]">assignment_turned_in</span>
                        Your Personal Action Items
                      </h3>
                      <p className="text-xs text-[#8C8880] mt-1">Smart tasks extracted by AI from your recent meetings based on your role.</p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase font-['Inter']">
                      Active
                    </span>
                  </div>

                  <div className="divide-y divide-[#D9D7D0]/30">
                    {eliasTasks.map((item) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 group/item cursor-pointer hover:bg-black/[0.01] rounded-xl px-2 -mx-2 transition-colors">

                        {/* Custom Styled Checkbox Container */}
                        <div className="flex items-center justify-center mt-1">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded-md border-2 border-[#D9D7D0] bg-[#FAF9F5] checked:bg-black checked:border-black transition-all cursor-pointer accent-black"
                          />
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-[#8C8880] leading-relaxed max-w-xl">{item.task}</p>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${item.dueDate === 'Last Week'
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : item.dueDate === 'Tomorrow'
                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                : 'bg-[#FAF9F5] text-[#8C8880] border border-[#D9D7D0]/60'
                              }`}>
                              Due: {item.dueDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="material-symbols-outlined text-[14px] text-[#8C8880]">analytics</span>
                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wide font-['Inter']">From: {item.meeting}</p>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <button className="flex-1 py-3 bg-black text-white rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all tracking-widest uppercase font-['Inter'] flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Mark Selected as Completed
                  </button>
                  <button className="py-3 px-6 border border-[#D9D7D0]/60 hover:border-black/30 bg-[#FAF9F5] rounded-xl text-[10px] font-bold text-[#8C8880] hover:text-black transition-all tracking-widest uppercase font-['Inter']">
                    View All Meeting Tasks
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}