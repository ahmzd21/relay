'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function NativeMeetingPage() {
  const router = useRouter();
  const { currentWorkspace, isOrganization, hasPermission } = useWorkspace();

  const [joinLink, setJoinLink] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'transcripts' | 'whiteboards'>('all');

  const handleStartMeeting = () => {
    const meetingId = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/meeting/${meetingId}`);
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinLink.trim()) return;
    const meetingId = joinLink.split('/').pop() || joinLink;
    router.push(`/meeting/${meetingId}`);
  };

  const filters = [
    { key: 'all' as const, label: 'All' },
    { key: 'transcripts' as const, label: 'Transcripts' },
    { key: 'whiteboards' as const, label: 'Whiteboards' },
  ];

  const recentMeetings = [
    {
      id: 'R902',
      title: 'MENA Expansion Strategy',
      time: '2h 45m ago',
      duration: '45m',
      languages: ['AR', 'EN'],
      aiReady: true,
      participants: [
        { initials: 'ET', color: 'bg-indigo-950 text-indigo-400 border-indigo-900/50' },
        { initials: 'SK', color: 'bg-indigo-900 text-indigo-300 border-indigo-800/50' },
        { initials: '+3', color: 'bg-slate-800 text-slate-200 border-slate-700/50' },
      ],
      status: 'ended',
    },
    {
      id: 'J881',
      title: 'Tokyo Creative Workshop',
      time: 'Yesterday',
      duration: '1h 20m',
      languages: ['JP', 'EN'],
      aiReady: true,
      participants: [
        { initials: 'YS', color: 'bg-slate-800 text-slate-200 border-slate-700/50' },
        { initials: 'MK', color: 'bg-slate-700 text-slate-300 border-slate-600/50' },
      ],
      status: 'ended',
    },
    {
      id: 'P120',
      title: 'Paris Sync: Design Ops',
      time: '2 days ago',
      duration: '30m',
      languages: ['EN', 'FR'],
      aiReady: false,
      participants: [
        { initials: 'PL', color: 'bg-emerald-950 text-emerald-400 border-emerald-900/50' },
      ],
      status: 'ended',
    },
    {
      id: 'T001',
      title: 'Global Town Hall',
      time: 'Last week',
      duration: '1h 45m',
      languages: ['EN'],
      aiReady: false,
      participants: [
        { initials: '120+', color: 'bg-slate-800 text-slate-200 border-slate-700/50' },
      ],
      status: 'ended',
    },
  ];

  const filteredMeetings = activeFilter === 'all'
    ? recentMeetings
    : activeFilter === 'transcripts'
      ? recentMeetings.filter(m => m.aiReady)
      : recentMeetings.filter(m => m.languages.length > 1);

  const meetingTemplates = [
    { icon: 'bolt', label: 'Quick Huddle', duration: '15m', participants: '2–4', desc: 'Fast sync with instant translation' },
    { icon: 'groups', label: 'Team Standup', duration: '30m', participants: '5–10', desc: 'Daily or weekly team check-in' },
    { icon: 'handshake', label: 'Client Call', duration: '45m', participants: '3–8', desc: 'External meeting with live captions' },
    { icon: 'science', label: 'Workshop', duration: '90m', participants: '10–30', desc: 'Collaborative session with whiteboard' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1c1b1b] flex font-helvetica selection:bg-black selection:text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <DashboardHeader
          searchPlaceholder={isOrganization() ? "Search team meetings, transcripts..." : "Search meetings, transcripts, or people..."}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-10">

            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold font-helvetica tracking-tight text-slate-900 mb-2">
                  {isOrganization() ? currentWorkspace.name : 'Native Meeting'}
                </h1>
                <p className="text-slate-600 text-lg">
                  {isOrganization()
                    ? `Team meeting hub — create, manage, and review sessions.`
                    : 'Start a meeting with real-time AI translation and live captions.'}
                </p>
              </div>
              {isOrganization() && (
                <span className={`self-start px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  currentWorkspace.role === 'owner'
                    ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm shadow-[#FF416C]/20'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {currentWorkspace.role}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Create Meeting — Dark Card */}
              <div className="lg:col-span-1 bg-[#0f1115] text-white rounded-2xl p-8 shadow-md shadow-black/20 relative overflow-hidden group flex flex-col justify-between min-h-[220px] border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF416C]/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF416C]/20 mb-5 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-white text-[24px]">video_call</span>
                    </div>
                    <h2 className="text-2xl font-bold font-helvetica tracking-tight text-white mb-2">
                      {isOrganization() ? 'Start Team Meeting' : 'New Meeting'}
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                      {isOrganization()
                        ? 'Launch a meeting with your team with real-time translation.'
                        : 'Start an instant session with real-time intelligence.'}
                    </p>
                  </div>
                  <button
                    onClick={handleStartMeeting}
                    className="mt-6 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-8 py-3.5 rounded-full font-bold text-sm hover:scale-105 transition-all duration-200 shadow-lg shadow-[#FF416C]/20 flex items-center justify-center gap-2 group/btn w-fit"
                  >
                    {isOrganization() ? 'Start Team Meeting' : 'Start Now'}
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-0.5 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Quick Join — Light Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-[#c4c7c7]/30 shadow-sm relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 hover:border-[#FF416C]/30 transition-all duration-300">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#FF416C]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-[#FF416C]/20">
                      <span className="material-symbols-outlined text-white text-[24px]">link</span>
                    </div>
                    <h2 className="text-2xl font-bold font-helvetica tracking-tight text-slate-900 mb-2">
                      Join a Meeting
                    </h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                      Enter a Relay link or ID to instantly connect with real-time translation.
                    </p>
                  </div>
                  <form className="flex gap-3 mt-auto" onSubmit={handleJoinMeeting}>
                    <input
                      type="text"
                      value={joinLink}
                      onChange={(e) => setJoinLink(e.target.value)}
                      placeholder="Paste meeting link..."
                      className="flex-1 bg-[#FAF9F5] border border-[#c4c7c7]/30 rounded-full py-3 px-5 text-[15px] text-[#1c1b1b] placeholder:text-[#8C8880]/60 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!joinLink.trim()}
                      className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-[#FF416C]/20"
                    >
                      Join
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Recent Meetings */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold font-helvetica tracking-tight text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8C8880] text-[20px]">history</span>
                  Recent Meetings
                </h2>
                <div className="flex gap-1 bg-white border border-[#c4c7c7]/30 p-1 rounded-xl self-start sm:self-auto">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase font-helvetica transition-all ${
                        activeFilter === f.key
                          ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMeetings.length === 0 ? (
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FF416C]/20">
                    <span className="material-symbols-outlined text-white text-[32px]">videocam_off</span>
                  </div>
                  <h3 className="text-lg font-bold font-helvetica text-slate-900 mb-2">No meetings found</h3>
                  <p className="text-slate-500 text-sm">
                    {activeFilter === 'all'
                      ? 'Start your first meeting to see it here.'
                      : `No ${activeFilter} meetings yet.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMeetings.map((meeting) => (
                    <Link
                      key={meeting.id}
                      href={`/dashboard/native-meeting/${meeting.id}`}
                      className="bg-[#0f1115] border border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:border-[#FF416C]/30 hover:-translate-y-0.5 transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            meeting.aiReady
                              ? 'bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] text-white border-[#FF416C]/30'
                              : 'bg-white/10 text-slate-400 border-white/10'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">
                              {meeting.aiReady ? 'translate' : 'forum'}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            {meeting.aiReady && (
                              <span className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase font-helvetica shadow-sm shadow-[#FF416C]/20">
                                AI Ready
                              </span>
                            )}
                            <span className="bg-white/10 border border-white/10 text-white/60 px-2 py-0.5 rounded text-[9px] font-bold font-helvetica">
                              {meeting.languages.join(' | ')}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-bold text-white mb-1 group-hover:text-[#FF416C] transition-colors font-helvetica">
                          {meeting.title}
                        </h3>
                        <p className="text-white/50 text-xs mb-4">
                          {meeting.time} · {meeting.duration} · #{meeting.id}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2 overflow-hidden py-1">
                          {meeting.participants.map((p, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-full border-2 border-[#0f1115] ${p.color} flex items-center justify-center text-[8px] font-bold`}
                            >
                              {p.initials}
                            </div>
                          ))}
                        </div>
                        <span className="material-symbols-outlined text-white/30 text-[18px] group-hover:text-[#FF416C] transition-colors">arrow_forward</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Org-Only: Usage Stats */}
            {isOrganization() && hasPermission('owner') && (
              <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold font-helvetica tracking-tight text-slate-900 mb-5">Usage & Limits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minutes Used</span>
                      <span className="text-sm font-bold text-slate-900">847 / 2,000</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] rounded-full" style={{ width: '42%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meetings This Month</span>
                      <span className="text-sm font-bold text-slate-900">24</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team Members Active</span>
                      <span className="text-sm font-bold text-slate-900">9 / 12</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Meeting Templates */}
            <div>
              <h2 className="text-xl font-bold font-helvetica tracking-tight text-slate-900 mb-5">
                Meeting Templates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {meetingTemplates.map((template) => (
                  <button
                    key={template.label}
                    onClick={handleStartMeeting}
                    className="group bg-white border border-[#c4c7c7]/30 rounded-2xl p-5 text-left hover:border-[#FF416C]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-white text-[20px]">
                          {template.icon}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8C8880] bg-[#FAF9F5] border border-[#c4c7c7]/30 px-2 py-1 rounded-lg">
                        {template.duration}
                      </span>
                    </div>
                    <h3 className="font-bold font-helvetica text-slate-900 mb-1 group-hover:text-[#FF416C] transition-colors">
                      {template.label}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {template.desc}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <span className="material-symbols-outlined text-[#8C8880] text-[14px]">
                        group
                      </span>
                      <span className="text-[10px] font-bold text-[#8C8880] uppercase tracking-wider">
                        {template.participants} people
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
