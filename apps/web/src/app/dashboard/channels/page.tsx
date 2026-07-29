'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';

export default function ChannelsPage() {
  const [activeChannel, setActiveChannel] = useState('engineering');

  const channels = [
    { id: 'general', name: 'General', unread: 0 },
    { id: 'engineering', name: 'Engineering', unread: 3 },
    { id: 'marketing', name: 'Marketing', unread: 0 },
    { id: 'leadership', name: 'Leadership', unread: 1 },
  ];

  const meetings = [
    {
      id: 1,
      title: 'Sprint Planning',
      host: 'Sarah Chen',
      time: '10:00 AM',
      status: 'live',
      participants: 8,
      language: 'English, Mandarin',
    },
    {
      id: 2,
      title: 'Architecture Review',
      host: 'Elias Thompson',
      time: 'Yesterday',
      status: 'recorded',
      participants: 4,
      language: 'English',
    },
  ];

  return (
    <>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        
        <DashboardHeader
          searchPlaceholder="Search channels, messages, or files..."
        />

        {/* Channels Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Channels Sidebar (Inner) */}
          <div className="w-64 border-r border-[#D9D7D0]/40 bg-white/50 flex flex-col hidden md:flex">
            <div className="p-4 border-b border-[#D9D7D0]/40 flex items-center justify-between">
              <h2 className="font-bold text-black text-sm">All Channels</h2>
              <button className="text-[#8C8880] hover:text-black transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    activeChannel === channel.id 
                      ? 'bg-black text-white shadow-md' 
                      : 'hover:bg-black/5 text-[#8C8880] hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] opacity-70">tag</span>
                    <span className="font-medium text-sm">{channel.name}</span>
                  </div>
                  {channel.unread > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {channel.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Content Area */}
          <div className="flex-1 flex flex-col bg-white">
            
            {/* Channel Header */}
            <div className="h-16 border-b border-[#D9D7D0]/40 px-6 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-black opacity-40 text-[24px]">tag</span>
                <h2 className="text-xl font-bold text-black capitalize">{activeChannel}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 mr-4">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">ET</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">SC</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold">MR</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">+12</div>
                </div>
                <button className="bg-black text-white px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-md">
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                  Meet Now
                </button>
              </div>
            </div>

            {/* Feed / Activity */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-8 pb-32">
              
              <div className="text-center py-6">
                <p className="text-xs font-bold text-[#8C8880] uppercase tracking-wider">Today, July 21st</p>
              </div>

              {/* Feed Item: Meeting */}
              {meetings.map((meeting) => (
                <div key={meeting.id} className="bg-[#FAF9F5] border border-[#D9D7D0]/40 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                        meeting.status === 'live' ? 'bg-rose-50' : 'bg-indigo-50'
                      }`}>
                        <span className={`material-symbols-outlined text-[24px] ${
                          meeting.status === 'live' ? 'text-rose-600' : 'text-indigo-600'
                        }`}>
                          {meeting.status === 'live' ? 'podcasts' : 'play_circle'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-black text-lg">{meeting.title}</h4>
                        <div className="flex items-center gap-2 text-[#8C8880] text-sm mt-1">
                          <span className="font-medium">{meeting.host}</span>
                          <span>•</span>
                          <span>{meeting.time}</span>
                        </div>
                      </div>
                    </div>
                    {meeting.status === 'live' ? (
                      <button className="bg-rose-500 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-rose-600 transition-colors shadow-md animate-pulse">
                        Join Live Translation
                      </button>
                    ) : (
                      <button className="bg-white border border-[#D9D7D0] text-black px-5 py-2.5 rounded-full font-bold text-sm hover:bg-black hover:text-white transition-colors shadow-sm">
                        View Summary & Transcript
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-6 flex items-center gap-4 border-t border-[#D9D7D0]/40 pt-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C8880] bg-white px-3 py-1.5 rounded-lg border border-[#D9D7D0]/40">
                      <span className="material-symbols-outlined text-[16px]">groups</span>
                      {meeting.participants} Joined
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C8880] bg-white px-3 py-1.5 rounded-lg border border-[#D9D7D0]/40">
                      <span className="material-symbols-outlined text-[16px]">translate</span>
                      {meeting.language}
                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* Message Input Placeholder */}
            <div className="p-6 bg-white border-t border-[#D9D7D0]/40">
              <div className="bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-2xl p-2 pr-4 flex items-center gap-3">
                <button className="p-2 text-[#8C8880] hover:text-black transition-colors rounded-xl hover:bg-black/5">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                </button>
                <input
                  type="text"
                  placeholder={`Message #${activeChannel}...`}
                  className="flex-1 bg-transparent text-sm focus:outline-none text-black"
                />
                <button className="bg-black text-white w-8 h-8 rounded-xl flex items-center justify-center hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </>
  );
}
