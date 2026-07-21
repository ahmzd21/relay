'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function MainDashboardPage() {
  const [joinLink, setJoinLink] = useState('');
  const { isOrganization } = useWorkspace();

  // Personal Context Data (Freelancer / Individual)
  const upcomingMeetings = [
    { id: 1, title: 'Client Sync: Website Redesign', time: '10:00 AM', duration: '45m', platform: 'Zoom' },
    { id: 2, title: 'Interview: Frontend Dev', time: '2:30 PM', duration: '60m', platform: 'Google Meet' },
    { id: 3, title: 'Design Review', time: '4:00 PM', duration: '30m', platform: 'Native' },
  ];

  // Organization Context Data (MS Teams-like Feed)
  const orgFeed = [
    { id: 101, type: 'channel', name: '#engineering', activity: 'Sarah Chen started a live meeting', time: 'Just now', live: true },
    { id: 102, type: 'insight', name: '#marketing', activity: 'AI Transcript summary generated for "Q3 Campaign Review"', time: '2 hours ago', live: false },
    { id: 103, type: 'channel', name: '#leadership', activity: 'Elias Thompson uploaded 3 files', time: 'Yesterday', live: false },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1c1b1b] flex font-helvetica selection:bg-black selection:text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 border-b border-[#D9D7D0]/40 flex items-center justify-between px-6 md:px-10 bg-white/80 backdrop-blur-xl z-20 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 text-black">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <WorkspaceSwitcher />
          </div>
          <div className="hidden md:flex relative w-full max-w-md items-center">
            <span className="material-symbols-outlined absolute left-4 text-[#8C8880] text-[20px]">search</span>
            <input
              type="text"
              placeholder={isOrganization() ? "Search channels, logs, or team..." : "Search meetings, insights, or people..."}
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

        <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {/* Context Header */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-2">
                {isOrganization() ? 'Workspace Activity' : 'My Schedule'}
              </h1>
              <p className="text-[#8C8880] text-base">
                {isOrganization() 
                  ? 'Overview of your organization\'s channels and shared meetings.'
                  : 'Your upcoming meetings and personal AI insights.'}
              </p>
            </div>

            {/* Render Contextual Dashboard */}
            {isOrganization() ? (
              
              /* ORGANIZATION DASHBOARD (Teams-like) */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Org Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/dashboard/channels" className="bg-black text-white p-6 rounded-3xl flex items-center justify-between hover:scale-[1.02] transition-transform shadow-lg group">
                    <div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-white transition-colors">Browse Channels</h3>
                      <p className="text-white/60 text-sm">Join ongoing team discussions</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <span className="material-symbols-outlined">tag</span>
                    </div>
                  </Link>

                  <div className="bg-white border border-[#D9D7D0]/40 p-6 rounded-3xl flex items-center justify-between hover:border-black/30 transition-colors shadow-sm cursor-pointer group">
                    <div>
                      <h3 className="text-xl font-bold text-black mb-1 group-hover:text-indigo-600 transition-colors">Start Org Meeting</h3>
                      <p className="text-[#8C8880] text-sm">Create a live translation room</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <span className="material-symbols-outlined text-indigo-600">videocam</span>
                    </div>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold tracking-tight text-black mb-6">Recent Org Activity</h2>
                  <div className="space-y-4">
                    {orgFeed.map(feed => (
                      <div key={feed.id} className="flex items-start gap-4 p-4 bg-[#FAF9F5] border border-[#D9D7D0]/40 rounded-2xl">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${feed.live ? 'bg-rose-50 text-rose-600' : 'bg-white text-slate-500'}`}>
                          <span className="material-symbols-outlined text-[20px]">{feed.type === 'channel' ? 'tag' : 'lightbulb'}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black text-sm">{feed.name}</span>
                            <span className="text-[#8C8880] text-xs">• {feed.time}</span>
                          </div>
                          <p className="text-sm font-medium text-[#1c1b1b] mt-1">{feed.activity}</p>
                        </div>
                        {feed.live && (
                          <button className="bg-rose-500 text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse">Join Live</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            ) : (

              /* PERSONAL DASHBOARD (Freelancer-like) */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Personal Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/dashboard/native-meeting" className="bg-black text-white p-6 rounded-3xl flex items-center justify-between hover:scale-[1.02] transition-transform shadow-lg group">
                    <div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-white transition-colors">Start Meeting</h3>
                      <p className="text-white/60 text-sm">Instantly start a translated room</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <span className="material-symbols-outlined">add</span>
                    </div>
                  </Link>

                  <div className="bg-white border border-[#D9D7D0]/40 p-6 rounded-3xl hover:border-black/30 transition-colors shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-[#8C8880] uppercase tracking-wider mb-2">Join External Link</p>
                    <form className="flex w-full gap-2" onSubmit={e => e.preventDefault()}>
                      <input
                        type="url"
                        placeholder="Paste Zoom, Teams, or Meet link"
                        value={joinLink}
                        onChange={(e) => setJoinLink(e.target.value)}
                        className="flex-1 bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:border-black transition-all"
                      />
                      <button className="bg-black text-white px-4 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
                        Join
                      </button>
                    </form>
                  </div>
                </div>

                {/* Calendar Schedule */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold tracking-tight text-black flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#8C8880]">calendar_month</span>
                      Upcoming Meetings
                    </h2>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Synced with Google</span>
                  </div>
                  
                  <div className="space-y-3">
                    {upcomingMeetings.map(meeting => (
                      <div key={meeting.id} className="flex items-center justify-between p-4 border border-[#D9D7D0]/40 rounded-2xl hover:border-black/20 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="text-center w-14">
                            <p className="font-bold text-black text-sm">{meeting.time}</p>
                            <p className="text-[#8C8880] text-xs">{meeting.duration}</p>
                          </div>
                          <div className="w-px h-10 bg-[#D9D7D0]/40"></div>
                          <div>
                            <p className="font-bold text-black group-hover:text-indigo-600 transition-colors">{meeting.title}</p>
                            <div className="flex items-center gap-1 text-[#8C8880] text-xs mt-1">
                              <span className="material-symbols-outlined text-[14px]">{meeting.platform === 'Native' ? 'videocam' : 'link'}</span>
                              {meeting.platform}
                            </div>
                          </div>
                        </div>
                        <button className="w-8 h-8 rounded-full border border-[#D9D7D0] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}