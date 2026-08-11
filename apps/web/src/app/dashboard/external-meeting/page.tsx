'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';

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
    date: '2026-08-07',
    duration: '2h 15m',
    status: 'translated',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-border text-ink' },
      { name: 'Sarah Chen', initials: 'SC', color: 'bg-border text-ink' },
      { name: 'Marcus Klein', initials: 'MK', color: 'bg-border text-ink' },
    ],
    languages: ['English', 'Spanish'],
  },
  {
    id: 'ext-2',
    title: 'Product Sync with Partners',
    platform: 'Microsoft Teams',
    url: 'https://teams.microsoft.com/l/meetup-join/abc',
    time: '10:00',
    date: '2026-08-06',
    duration: '45m',
    status: 'translated',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-border text-ink' },
      { name: 'Yousef Al-Rashid', initials: 'YA', color: 'bg-border text-ink' },
    ],
    languages: ['English', 'Arabic'],
  },
  {
    id: 'ext-3',
    title: 'Client Onboarding Call',
    platform: 'Google Meet',
    url: 'https://meet.google.com/abc-xyz-def',
    time: '16:00',
    date: '2026-08-05',
    duration: '30m',
    status: 'processing',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-border text-ink' },
      { name: 'Sofia Martinez', initials: 'SM', color: 'bg-border text-ink' },
    ],
    languages: ['English', 'French'],
  },
  {
    id: 'ext-4',
    title: 'Engineering Standup',
    platform: 'Zoom',
    url: 'https://zoom.us/j/987654321',
    time: '09:00',
    date: '2026-08-04',
    duration: '15m',
    status: 'translated',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-border text-ink' },
      { name: 'Wei Zhang', initials: 'WZ', color: 'bg-border text-ink' },
      { name: 'Priya Sharma', initials: 'PS', color: 'bg-border text-ink' },
      { name: 'Marcus Klein', initials: 'MK', color: 'bg-border text-ink' },
    ],
    languages: ['English'],
  },
  {
    id: 'ext-5',
    title: 'Investor Update Call',
    platform: 'Google Meet',
    url: 'https://meet.google.com/xyz-abc-123',
    time: '11:00',
    date: '2026-08-02',
    duration: '1h',
    status: 'ended',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-border text-ink' },
      { name: 'David Park', initials: 'DP', color: 'bg-border text-ink' },
      { name: 'Elena Rostova', initials: 'ER', color: 'bg-border text-ink' },
    ],
    languages: ['English', 'Japanese'],
  },
];

const PLATFORM_ICONS: Record<string, { icon: string; color: string; bg: string; name: string }> = {
  Zoom: { icon: 'videocam', color: 'text-blue-600', bg: 'bg-blue-50', name: 'Zoom' },
  'Google Meet': { icon: 'groups', color: 'text-success', bg: 'bg-success/10', name: 'Google Meet' },
  'Microsoft Teams': { icon: 'meeting_room', color: 'text-info', bg: 'bg-info/10', name: 'Microsoft Teams' },
};

export default function ExternalMeetingPage() {
  const [meetingLink, setMeetingLink] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'zoom' | 'meet' | 'teams'>('all');

  const [meetings, setMeetings] = useState<ExternalMeeting[]>(MOCK_MEETINGS);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('relay-external-meetings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMeetings(parsed);
        }
      }
    } catch {
      // ignore
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
        participants: [{ name: 'You', initials: 'Y', color: 'bg-border text-ink' }],
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
    try {
      const date = new Date(dateStr + 'T12:00:00Z');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
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
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink mb-2">External Meeting</h1>
              <p className="text-muted text-lg">Connect Relay&apos;s AI translation to Zoom, Teams, or Google Meet.</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Connect Platform — Dark Card */}
              <div className="lg:col-span-1 bg-surface text-ink rounded-xl p-8 shadow-pop relative overflow-hidden group flex flex-col justify-between min-h-[220px] border border-border">                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-chrome rounded-xl flex items-center justify-center shadow-lg  mb-5 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-white text-[24px]">hub</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">
                      Connect a Platform
                    </h2>
                    <p className="text-muted text-sm leading-relaxed max-w-xs">
                      Link your Zoom, Google Meet, or Teams account for seamless translation.
                    </p>
                  </div>
                  <button className="mt-6 bg-accent text-white px-8 py-3.5 rounded-full font-bold text-sm hover:scale-105 transition-all duration-200 shadow-lg  flex items-center justify-center gap-2 group/btn w-fit">
                    Connect Account
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-0.5 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Quick Join — Light Card */}
              <div className="lg:col-span-2 bg-surface rounded-xl p-8 border border-border/30 shadow-card relative overflow-hidden group hover:shadow-pop hover:-translate-y-1 hover:border-accent/30 transition-all duration-300">
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-chrome flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg ">
                      <span className="material-symbols-outlined text-white text-[24px]">link</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">Join External Meeting</h2>
                    <p className="text-muted text-sm mb-6 leading-relaxed">Paste a Zoom, Google Meet, or Teams link to join with live translation overlay.</p>
                  </div>

                   <form className="flex flex-col sm:flex-row gap-3 mt-auto" onSubmit={handleJoin}>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="Paste meeting link..."
                      className="flex-1 bg-canvas border border-border/30 rounded-full py-3 px-5 text-[15px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink focus:ring-1 focus:ring-black/5 transition-all"
                      disabled={isConnecting}
                    />
                    <button
                      type="submit"
                      disabled={!meetingLink.trim() || isConnecting}
                      className="bg-accent text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg "
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
              <h2 className="text-xl font-bold tracking-tight text-ink mb-5">
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
                    className="group bg-surface border border-border/30 rounded-xl p-5 hover:border-accent/30 hover:shadow-card hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-chrome flex items-center justify-center shadow-md  group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-white text-[20px]">
                          {platform.icon}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-muted bg-canvas border border-border/30 px-2 py-1 rounded-lg">
                        {platform.users} users
                      </span>
                    </div>
                    <h3 className="font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                      {platform.name}
                    </h3>
                    <p className="text-muted text-xs leading-relaxed">
                      {platform.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent External Meetings */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                  <span className="material-symbols-outlined text-muted text-[20px]">history</span>
                  Recent External Meetings
                </h2>
                <div className="flex gap-1 bg-surface border border-border/30 p-1 rounded-xl self-start sm:self-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                        activeTab === tab.key
                          ? 'bg-accent text-white shadow-sm'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMeetings.length === 0 ? (
                <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-card">
                  <div className="w-16 h-16 bg-chrome rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ">
                    <span className="material-symbols-outlined text-white text-[32px]">link_off</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-2">No external meetings found</h3>
                  <p className="text-muted text-sm">
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
                      className="bg-surface border border-border p-5 rounded-xl shadow-card hover:shadow-pop hover:border-accent/30 hover:-translate-y-0.5 transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            meeting.status === 'translated'
                              ? 'bg-chrome text-white border-accent/30'
                              : meeting.status === 'processing'
                                ? 'bg-warning/10 text-warning border-warning/30'
                                : 'bg-canvas text-muted border-border/20'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">{platform.icon}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              meeting.status === 'translated'
                                ? 'bg-accent text-white shadow-sm '
                                : meeting.status === 'processing'
                                  ? 'bg-warning/10 text-warning border border-warning/30'
                                  : 'bg-canvas text-muted border border-border/20'
                            }`}>
                              {meeting.status}
                            </span>
                            <span className="bg-canvas border border-border/20 text-muted px-2 py-0.5 rounded text-[9px] font-bold">
                              {meeting.languages.slice(0, 2).join(' → ')}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                          {meeting.title}
                        </h3>
                        <p className="text-muted text-xs mb-4">
                          {platform.name} · {formatDate(meeting.date)} at {formatTime(meeting.time)} · {meeting.duration}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2 overflow-hidden py-1">
                          {meeting.participants.slice(0, 4).map((p, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-full border-2 border-surface ${p.color} flex items-center justify-center text-[8px] font-bold`}
                              title={p.name}
                            >
                              {p.initials}
                            </div>
                          ))}
                          {meeting.participants.length > 4 && (
                            <div className="w-6 h-6 rounded-full border-2 border-surface bg-canvas text-muted flex items-center justify-center text-[8px] font-bold">
                              +{meeting.participants.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-faint text-[18px] group-hover:text-accent transition-colors">arrow_forward</span>
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
