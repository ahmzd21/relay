'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface NativeMeetingRecord {
  id: string;
  title: string;
  roomName: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  participantCount: number;
  languages: string[];
  durationMinutes: number | null;
}

function formatRelative(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const meetingTemplates = [
  { icon: 'bolt', label: 'Quick Huddle', duration: '15m', participants: '2–4', desc: 'Fast sync with instant translation' },
  { icon: 'groups', label: 'Team Standup', duration: '30m', participants: '5–10', desc: 'Daily or weekly team check-in' },
  { icon: 'handshake', label: 'Client Call', duration: '45m', participants: '3–8', desc: 'External meeting with live captions' },
  { icon: 'science', label: 'Workshop', duration: '90m', participants: '10–30', desc: 'Collaborative session with whiteboard' },
];

export default function NativeMeetingPage() {
  const router = useRouter();
  const { currentWorkspace, isOrganization, hasPermission } = useWorkspace();
  const isOrg = isOrganization();

  const [joinLink, setJoinLink] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'transcripts' | 'whiteboards'>('all');
  const [recentMeetings, setRecentMeetings] = useState<NativeMeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (isOrg) params.set('workspaceId', currentWorkspace.id);
      const res = await fetch(`/api/meetings?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecentMeetings(data);
      }
    } catch (e) {
      console.warn('Could not fetch meetings:', e);
    } finally {
      setLoading(false);
    }
  }, [isOrg, currentWorkspace.id]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleStartMeeting = () => {
    const roomName = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/meeting/${roomName}?create=1`);
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinLink.trim()) return;
    const rawId = joinLink.split('/').pop() || joinLink;
    const meetingId = rawId.split(/[?#]/)[0];
    if (!meetingId) return;
    router.push(`/meeting/${meetingId}`);
  };

  const filteredMeetings =
    activeFilter === 'all'
      ? recentMeetings
      : activeFilter === 'transcripts'
        ? recentMeetings.filter((m) => m.status === 'ended')
        : recentMeetings.filter((m) => m.languages.length > 1);

  return (
    <>
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader
          searchPlaceholder={isOrg ? 'Search team meetings, transcripts...' : 'Search meetings, transcripts, or people...'}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink mb-2">
                  {isOrg ? currentWorkspace.name : 'Native Meeting'}
                </h1>
                <p className="text-muted text-lg">
                  {isOrg
                    ? 'Team meeting hub — create, manage, and review sessions.'
                    : 'Start a meeting with real-time AI translation and live captions.'}
                </p>
              </div>
              {isOrg && (
                <span className={`self-start px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  currentWorkspace.role === 'owner'
                    ? 'bg-accent text-white shadow-sm '
                    : 'bg-canvas text-muted border border-border'
                }`}>
                  {currentWorkspace.role}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Meeting — Dark Card */}
              <div className="lg:col-span-1 bg-surface text-ink rounded-xl p-8 shadow-pop relative overflow-hidden group flex flex-col justify-between min-h-[220px] border border-border">
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-chrome rounded-xl flex items-center justify-center shadow-lg  mb-5 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-white text-[24px]">video_call</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">
                      {isOrg ? 'Start Team Meeting' : 'New Meeting'}
                    </h2>
                    <p className="text-muted text-sm leading-relaxed max-w-xs">
                      {isOrg
                        ? 'Launch a meeting with your team with real-time translation.'
                        : 'Start an instant session with real-time intelligence.'}
                    </p>
                  </div>
                  <button
                    onClick={handleStartMeeting}
                    className="mt-6 bg-accent text-white px-8 py-3.5 rounded-full font-bold text-sm hover:scale-105 transition-all duration-200 shadow-lg  flex items-center justify-center gap-2 group/btn w-fit"
                  >
                    {isOrg ? 'Start Team Meeting' : 'Start Now'}
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
                    <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">Join a Meeting</h2>
                    <p className="text-muted text-sm mb-6 leading-relaxed">
                      Enter a Relay link or ID to instantly connect with real-time translation.
                    </p>
                  </div>
                  <form className="flex flex-col sm:flex-row gap-3 mt-auto" onSubmit={handleJoinMeeting}>
                    <input
                      type="text"
                      value={joinLink}
                      onChange={(e) => setJoinLink(e.target.value)}
                      placeholder="Paste meeting link..."
                      className="flex-1 bg-canvas border border-border/30 rounded-full py-3 px-5 text-[15px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink focus:ring-1 focus:ring-black/5 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!joinLink.trim()}
                      className="bg-accent text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg "
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
                <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                  <span className="material-symbols-outlined text-muted text-[20px]">history</span>
                  Recent Meetings
                </h2>
                <div className="flex gap-1 bg-surface border border-border/30 p-1 rounded-xl self-start sm:self-auto">
                  {[
                    { key: 'all' as const, label: 'All' },
                    { key: 'transcripts' as const, label: 'Transcripts' },
                    { key: 'whiteboards' as const, label: 'Whiteboards' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                        activeFilter === f.key
                          ? 'bg-accent text-white shadow-sm'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-surface border border-border rounded-xl p-5 shadow-card animate-pulse min-h-[170px]">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-chrome/20" />
                        <div className="w-16 h-3 bg-chrome/20 rounded" />
                      </div>
                      <div className="w-32 h-4 bg-chrome/20 rounded mb-2" />
                      <div className="w-48 h-3 bg-chrome/20 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-card">
                  <div className="w-16 h-16 bg-chrome rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ">
                    <span className="material-symbols-outlined text-white text-[32px]">videocam_off</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-2">No meetings found</h3>
                  <p className="text-muted text-sm">
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
                      className="bg-surface border border-border p-5 rounded-xl shadow-card hover:shadow-pop hover:border-accent/30 hover:-translate-y-0.5 transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            meeting.status === 'ended'
                              ? 'bg-chrome text-white border-accent/30'
                              : 'bg-canvas text-muted border-border/20'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">
                              {meeting.status === 'ended' ? 'translate' : 'forum'}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            {meeting.status === 'ended' && (
                              <span className="bg-accent text-white px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase shadow-sm ">
                                AI Ready
                              </span>
                            )}
                            <span className="bg-canvas border border-border/20 text-muted px-2 py-0.5 rounded text-[9px] font-bold">
                              {meeting.languages.map((l) => l.toUpperCase()).join(' | ')}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                          {meeting.title}
                        </h3>
                        <p className="text-muted text-xs mb-4">
                          {formatRelative(meeting.startedAt)} · {meeting.durationMinutes ? `${meeting.durationMinutes}m` : 'In progress'} · #{meeting.roomName}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-6 h-6 rounded-full bg-border text-ink flex items-center justify-center text-[8px] font-bold">
                          {meeting.participantCount}
                        </div>
                        <span className="material-symbols-outlined text-faint text-[18px] group-hover:text-accent transition-colors">
                          arrow_forward
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Org-Only: Usage Stats */}
            {isOrg && hasPermission('owner') && (
              <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                <h2 className="text-xl font-bold tracking-tight text-ink mb-5">Usage & Limits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Meetings This Month</span>
                      <span className="text-sm font-bold text-ink">{recentMeetings.length}</span>
                    </div>
                    <div className="h-2 bg-canvas rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(recentMeetings.length * 4, 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Duration</span>
                      <span className="text-sm font-bold text-ink">
                        {Math.round(recentMeetings.reduce((s, m) => s + (m.durationMinutes || 0), 0) / 60 * 10) / 10}h
                      </span>
                    </div>
                    <div className="h-2 bg-canvas rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Members</span>
                      <span className="text-sm font-bold text-ink">{recentMeetings.filter((m) => m.status === 'active').length > 0 ? 'Active' : 'Idle'}</span>
                    </div>
                    <div className="h-2 bg-canvas rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Meeting Templates */}
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink mb-5">Meeting Templates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {meetingTemplates.map((template) => (
                  <button
                    key={template.label}
                    onClick={handleStartMeeting}
                    className="group bg-surface border border-border/30 rounded-xl p-5 text-left hover:border-accent/30 hover:shadow-card hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-chrome flex items-center justify-center shadow-md  group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-white text-[20px]">{template.icon}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted bg-canvas border border-border/30 px-2 py-1 rounded-lg">
                        {template.duration}
                      </span>
                    </div>
                    <h3 className="font-bold text-ink mb-1 group-hover:text-accent transition-colors">{template.label}</h3>
                    <p className="text-muted text-xs leading-relaxed">{template.desc}</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <span className="material-symbols-outlined text-muted text-[14px]">group</span>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{template.participants} people</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
