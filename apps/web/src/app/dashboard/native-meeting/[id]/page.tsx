'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

interface Meeting {
  id: string;
  title: string;
  roomName: string;
  status: string;
  startedAt: string;
  endedAt: string;
  participantCount: number;
  languages: string[];
  summary: string;
  actionItems: string[];
  transcript: { speaker: string; time: string; text: string }[];
  durationMinutes: number;
  creator: { fullName: string; avatar: string };
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-border/50 rounded-xl ${className ?? ''}`} />;
}

function LoadingSkeleton() {
  return (
    <>
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <SkeletonBlock className="h-5 w-48" />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock className="h-10 w-64" />
                    <SkeletonBlock className="h-6 w-16 rounded-full" />
                  </div>
                  <SkeletonBlock className="h-5 w-80" />
                </div>
                <div className="flex gap-2">
                  <SkeletonBlock className="h-10 w-24" />
                  <SkeletonBlock className="h-10 w-24" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonBlock key={i} className="h-28" />
              ))}
            </div>
            <SkeletonBlock className="h-40" />
            <SkeletonBlock className="h-12 w-72" />
            <SkeletonBlock className="h-64" />
          </div>
        </div>
      </main>
    </>
  );
}

function ErrorState({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  return (
    <>
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <button
                onClick={() => router.push('/dashboard/native-meeting')}
                className="flex items-center gap-2 text-sm font-bold text-muted hover:text-ink transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Native Meetings
              </button>
            </div>
            <div className="bg-surface border border-border rounded-xl p-12 shadow-card text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-warning text-[32px]">search_off</span>
              </div>
              <h2 className="text-xl font-bold text-ink">Meeting not found</h2>
              <p className="text-sm text-muted max-w-md mx-auto">
                The meeting with ID <span className="font-bold text-ink">{meetingId}</span> could not be found or may have been removed.
              </p>
              <button
                onClick={() => router.push('/dashboard/native-meeting')}
                className="bg-accent text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:brightness-105 transition-all"
              >
                Return to Meetings
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'actions'>('summary');
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!meetingId) return;

    setLoading(true);
    setError(false);

    fetch(`/api/meetings/${meetingId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setMeeting(data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [meetingId]);

  if (loading) return <LoadingSkeleton />;
  if (error || !meeting) return <ErrorState meetingId={meetingId} />;

  const durationLabel = meeting.durationMinutes
    ? meeting.durationMinutes >= 60
      ? `${Math.floor(meeting.durationMinutes / 60)}h ${meeting.durationMinutes % 60 ? `${meeting.durationMinutes % 60}m` : ''}`
      : `${meeting.durationMinutes}m`
    : '—';

  const languagesLabel = meeting.languages?.length ? meeting.languages.join(' + ') : '—';

  const formattedDate = meeting.endedAt
    ? new Date(meeting.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : meeting.startedAt
    ? new Date(meeting.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const formattedTime = meeting.startedAt
    ? new Date(meeting.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '—';

  const statusDisplay = meeting.status === 'ended' ? 'Ended' : meeting.status === 'active' ? 'Live' : meeting.status;

  return (
    <>
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Back + Title */}
            <div className="space-y-4">
              <button
                onClick={() => router.push('/dashboard/native-meeting')}
                className="flex items-center gap-2 text-sm font-bold text-muted hover:text-ink transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Native Meetings
              </button>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
                      {meeting.title}
                    </h1>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-canvas text-muted border border-border">
                      {statusDisplay}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {formattedTime} · {durationLabel}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">translate</span>
                      {languagesLabel}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-surface border border-border/30 text-ink/80 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-canvas transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Export
                  </button>
                  <button className="bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:brightness-105 hover:scale-105 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-black/5">
                    <span className="material-symbols-outlined text-[16px]">videocam</span>
                    Replay
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Duration', value: durationLabel, icon: 'schedule', color: 'text-muted bg-canvas' },
                { label: 'Languages', value: `${meeting.languages?.length ?? 0}`, icon: 'translate', color: 'text-info bg-info/10' },
                { label: 'Participants', value: `${meeting.participantCount ?? 0}`, icon: 'group', color: 'text-success bg-success/10' },
                { label: 'AI Analysis', value: meeting.summary ? 'Complete' : 'Pending', icon: 'smart_toy', color: meeting.summary ? 'text-success bg-success/10' : 'text-warning bg-warning/10' },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface border border-border rounded-xl p-4 shadow-card">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                    <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                  </div>
                  <p className="text-xl font-bold text-ink">{stat.value}</p>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Creator */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
              <h2 className="text-lg font-bold tracking-tight text-ink mb-4">Created by</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-border text-ink flex items-center justify-center text-[12px] font-bold">
                  {meeting.creator?.fullName
                    ? meeting.creator.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                    : '?'}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{meeting.creator?.fullName ?? 'Unknown'}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider">Organizer</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-canvas p-1 rounded-xl w-fit">
              {([
                { key: 'summary' as const, label: 'AI Summary' },
                { key: 'transcript' as const, label: 'Transcript' },
                { key: 'actions' as const, label: 'Action Items' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${
                    activeTab === tab.key
                      ? 'bg-surface shadow-sm text-ink'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'summary' && (
              <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-info text-[20px]">smart_toy</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">AI-Generated Summary</h3>
                    <p className="text-[10px] text-muted uppercase tracking-widest">Powered by Relay Intelligence</p>
                  </div>
                </div>
                {meeting.summary ? (
                  <p className="text-ink/80 leading-relaxed text-[15px]">{meeting.summary}</p>
                ) : (
                  <p className="text-muted text-[15px] italic">Summary is being generated. Check back soon.</p>
                )}
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center">
                      <span className="material-symbols-outlined text-muted text-[20px]">description</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">Full Transcript</h3>
                      <p className="text-[10px] text-muted uppercase tracking-widest">{meeting.transcript?.length ?? 0} messages</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold text-muted uppercase tracking-widest hover:text-ink transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    Download
                  </button>
                </div>
                {meeting.transcript?.length ? (
                  <div className="space-y-4">
                    {meeting.transcript.map((entry, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="text-right w-12 flex-shrink-0">
                          <span className="text-[11px] font-bold text-faint">{entry.time}</span>
                        </div>
                        <div className="w-px bg-border/60 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-ink mb-0.5">{entry.speaker}</p>
                          <p className="text-sm text-ink/80 leading-relaxed">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm italic">No transcript available for this meeting.</p>
                )}
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-warning text-[20px]">checklist</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">Action Items</h3>
                    <p className="text-[10px] text-muted uppercase tracking-widest">{meeting.actionItems?.length ?? 0} items extracted</p>
                  </div>
                </div>
                {meeting.actionItems?.length ? (
                  <div className="space-y-3">
                    {meeting.actionItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-canvas border border-border/20 rounded-xl">
                        <div className="w-5 h-5 rounded border border-border/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] text-faint font-bold">{i + 1}</span>
                        </div>
                        <p className="text-sm text-ink/80 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm italic">No action items extracted yet.</p>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
