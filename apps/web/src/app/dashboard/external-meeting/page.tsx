'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface ExternalMeeting {
  id: string;
  title: string;
  platform: 'Zoom' | 'Google Meet' | 'Microsoft Teams';
  url: string;
  time: string;
  date: string;
  duration: string;
  status: 'translated' | 'processing' | 'ended';
  participants: { name: string; initials: string; color: string }[];
  languages: string[];
}

const MOCK_MEETINGS: ExternalMeeting[] = [
  {
    id: 'ext-1',
    title: 'Q4 Strategy Review',
    platform: 'Zoom',
    url: 'https://zoom.us/j/123456789',
    time: '14:30',
    date: new Date(Date.now() - 2 * 3600000).toISOString().split('T')[0],
    duration: '2h 15m',
    status: 'translated',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Sarah Chen', initials: 'SC', color: 'bg-rose-100 text-rose-700' },
      { name: 'Marcus Klein', initials: 'MK', color: 'bg-purple-100 text-purple-700' },
    ],
    languages: ['English', 'Spanish'],
  },
  {
    id: 'ext-2',
    title: 'Product Sync with Partners',
    platform: 'Microsoft Teams',
    url: 'https://teams.microsoft.com/l/meetup-join/abc',
    time: '10:00',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    duration: '45m',
    status: 'translated',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Yousef Al-Rashid', initials: 'YA', color: 'bg-amber-100 text-amber-700' },
    ],
    languages: ['English', 'Arabic'],
  },
  {
    id: 'ext-3',
    title: 'Client Onboarding Call',
    platform: 'Google Meet',
    url: 'https://meet.google.com/abc-xyz-def',
    time: '16:00',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    duration: '30m',
    status: 'processing',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Sofia Martinez', initials: 'SM', color: 'bg-emerald-100 text-emerald-700' },
    ],
    languages: ['English', 'French'],
  },
  {
    id: 'ext-4',
    title: 'Engineering Standup',
    platform: 'Zoom',
    url: 'https://zoom.us/j/987654321',
    time: '09:00',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    duration: '15m',
    status: 'translated',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Wei Zhang', initials: 'WZ', color: 'bg-blue-100 text-blue-700' },
      { name: 'Priya Sharma', initials: 'PS', color: 'bg-pink-100 text-pink-700' },
      { name: 'Marcus Klein', initials: 'MK', color: 'bg-purple-100 text-purple-700' },
    ],
    languages: ['English'],
  },
  {
    id: 'ext-5',
    title: 'Investor Update Call',
    platform: 'Google Meet',
    url: 'https://meet.google.com/xyz-abc-123',
    time: '11:00',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    duration: '1h',
    status: 'translated',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
    ],
    languages: ['English', 'Japanese'],
  },
];

const PLATFORM_ICONS: Record<string, { icon: string; color: string; bg: string; name: string }> = {
  Zoom: { icon: 'videocam', color: 'text-blue-600', bg: 'bg-blue-50', name: 'Zoom' },
  'Google Meet': { icon: 'groups', color: 'text-emerald-600', bg: 'bg-emerald-50', name: 'Google Meet' },
  'Microsoft Teams': { icon: 'meeting_room', color: 'text-indigo-600', bg: 'bg-indigo-50', name: 'Microsoft Teams' },
};

export default function ExternalMeetingPage() {
  const router = useRouter();
  const { isOrganization } = useWorkspace();

  const [meetingLink, setMeetingLink] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'zoom' | 'meet' | 'teams'>('all');

  // Load from localStorage
  const [meetings, setMeetings] = useState<ExternalMeeting[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('relay-external-meetings');
    if (saved) {
      try { setMeetings(JSON.parse(saved)); } catch { setMeetings(MOCK_MEETINGS); }
    } else {
      setMeetings(MOCK_MEETINGS);
    }
  }, []);

  useEffect(() => {
    if (meetings.length > 0) {
      localStorage.setItem('relay-external-meetings', JSON.stringify(meetings));
    }
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    if (activeTab === 'all') return meetings;
    const platformMap = { zoom: 'Zoom', meet: 'Google Meet', teams: 'Microsoft Teams' };
    return meetings.filter(m => m.platform === platformMap[activeTab]);
  }, [meetings, activeTab]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingLink.trim()) return;
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      const newMeeting: ExternalMeeting = {
        id: 'ext-' + Date.now(),
        title: 'External Meeting',
        platform: meetingLink.includes('zoom') ? 'Zoom' : meetingLink.includes('teams') ? 'Microsoft Teams' : 'Google Meet',
        url: meetingLink,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        duration: '0m',
        status: 'translated',
        participants: [{ name: 'You', initials: 'Y', color: 'bg-indigo-100 text-indigo-700' }],
        languages: ['English'],
      };
      setMeetings(prev => [newMeeting, ...prev]);
      setMeetingLink('');
    }, 2000);
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'zoom' as const, label: 'Zoom' },
    { key: 'meet' as const, label: 'Google Meet' },
    { key: 'teams' as const, label: 'Teams' },
  ];

  return (
    <>

      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader searchPlaceholder="Search external meetings, integrations..." />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-10">

            {/* Page Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-helvetica tracking-tight text-slate-900 mb-2">External Meeting</h1>
              <p className="text-slate-600 text-lg">Connect Relay's AI translation to Zoom, Teams, or Google Meet.</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Connect Platform — Dark Card */}
              <div className="lg:col-span-1 bg-[#0f1115] text-white rounded-2xl p-8 shadow-md shadow-black/20 relative overflow-hidden group flex flex-col justify-between min-h-[220px] border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF416C]/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF416C]/20 mb-5 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-white text-[24px]">hub</span>
                    </div>
                    <h2 className="text-2xl font-bold font-helvetica tracking-tight text-white mb-2">
                      Connect a Platform
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                      Link your Zoom, Google Meet, or Teams account for seamless translation.
                    </p>
                  </div>
                  <button className="mt-6 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-8 py-3.5 rounded-full font-bold text-sm hover:scale-105 transition-all duration-200 shadow-lg shadow-[#FF416C]/20 flex items-center justify-center gap-2 group/btn w-fit">
                    Connect Account
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
                    <h2 className="text-2xl font-bold font-helvetica tracking-tight text-slate-900 mb-2">Join External Meeting</h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">Paste a Zoom, Google Meet, or Teams link to join with live translation overlay.</p>
                  </div>

                   <form className="flex flex-col sm:flex-row gap-3 mt-auto" onSubmit={handleJoin}>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="Paste meeting link..."
                      className="flex-1 bg-[#FAF9F5] border border-[#c4c7c7]/30 rounded-full py-3 px-5 text-[15px] text-[#1c1b1b] placeholder:text-[#8C8880]/60 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
                      disabled={isConnecting}
                    />
                    <button
                      type="submit"
                      disabled={!meetingLink.trim() || isConnecting}
                      className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-[#FF416C]/20"
                    >
                      {isConnecting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          Join
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Supported Platforms */}
            <div>
              <h2 className="text-xl font-bold font-helvetica tracking-tight text-slate-900 mb-5">
                Supported Platforms
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: 'videocam', name: 'Zoom', desc: 'HD video, breakout rooms, and live translation overlays', users: '2M+' },
                  { icon: 'groups', name: 'Google Meet', desc: 'Instant join, live captions, and multilingual transcripts', users: '1.5M+' },
                  { icon: 'meeting_room', name: 'Microsoft Teams', desc: 'Enterprise integration, channel meetings, and AI notes', users: '1M+' },
                ].map((platform) => (
                  <div
                    key={platform.name}
                    className="group bg-white border border-[#c4c7c7]/30 rounded-2xl p-5 hover:border-[#FF416C]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-white text-[20px]">
                          {platform.icon}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8C8880] bg-[#FAF9F5] border border-[#c4c7c7]/30 px-2 py-1 rounded-lg">
                        {platform.users} users
                      </span>
                    </div>
                    <h3 className="font-bold font-helvetica text-slate-900 mb-1 group-hover:text-[#FF416C] transition-colors">
                      {platform.name}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {platform.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent External Meetings */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold font-helvetica tracking-tight text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8C8880] text-[20px]">history</span>
                  Recent External Meetings
                </h2>
                <div className="flex gap-1 bg-white border border-[#c4c7c7]/30 p-1 rounded-xl self-start sm:self-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase font-helvetica transition-all ${
                        activeTab === tab.key
                          ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMeetings.length === 0 ? (
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FF416C]/20">
                    <span className="material-symbols-outlined text-white text-[32px]">link_off</span>
                  </div>
                  <h3 className="text-lg font-bold font-helvetica text-slate-900 mb-2">No external meetings found</h3>
                  <p className="text-slate-500 text-sm">
                    {activeTab === 'all' ? 'Paste a meeting link above to get started.' : `No ${activeTab === 'meet' ? 'Google Meet' : activeTab === 'teams' ? 'Teams' : 'Zoom'} meetings yet.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMeetings.map((meeting) => {
                    const platform = PLATFORM_ICONS[meeting.platform];
                    return (
                    <Link
                      key={meeting.id}
                      href={`/dashboard/external-meeting/${meeting.id}`}
                      className="bg-[#0f1115] border border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:border-[#FF416C]/30 hover:-translate-y-0.5 transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            meeting.status === 'translated'
                              ? 'bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] text-white border-[#FF416C]/30'
                              : meeting.status === 'processing'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-white/10 text-slate-400 border-white/10'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">{platform.icon}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-helvetica ${
                              meeting.status === 'translated'
                                ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm shadow-[#FF416C]/20'
                                : meeting.status === 'processing'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-white/10 text-white/40 border border-white/10'
                            }`}>
                              {meeting.status}
                            </span>
                            <span className="bg-white/10 border border-white/10 text-white/60 px-2 py-0.5 rounded text-[9px] font-bold font-helvetica">
                              {meeting.languages.slice(0, 2).join(' → ')}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-bold text-white mb-1 group-hover:text-[#FF416C] transition-colors font-helvetica">
                          {meeting.title}
                        </h3>
                        <p className="text-white/50 text-xs mb-4">
                          {platform.name} · {formatDate(meeting.date)} at {formatTime(meeting.time)} · {meeting.duration}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2 overflow-hidden py-1">
                          {meeting.participants.slice(0, 4).map((p, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-full border-2 border-[#0f1115] ${p.color} flex items-center justify-center text-[8px] font-bold`}
                              title={p.name}
                            >
                              {p.initials}
                            </div>
                          ))}
                          {meeting.participants.length > 4 && (
                            <div className="w-6 h-6 rounded-full border-2 border-[#0f1115] bg-white/10 text-white/60 flex items-center justify-center text-[8px] font-bold">
                              +{meeting.participants.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-white/30 text-[18px] group-hover:text-[#FF416C] transition-colors">arrow_forward</span>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
