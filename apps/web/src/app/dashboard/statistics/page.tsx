'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';
import { useWorkspace } from '@/contexts/WorkspaceContext';

const TIME_PERIODS = ['7d', '30d', '90d'] as const;
type TimePeriod = typeof TIME_PERIODS[number];

interface StatsData {
  summary: {
    totalMeetings: number;
    translationHours: number;
    languagesUsed: number;
    teamMembers: number;
    activeNow: number;
    meetingsChange: string;
    hoursChange: string;
    languagesChange: string;
    membersChange: string;
  };
  meetingActivity: Array<{ label: string; value: number }>;
  translationVolume: Array<{ label: string; value: number }>;
  languages: Array<{ name: string; percentage: number; meetings: number }>;
  platforms: Array<{ name: string; percentage: number }>;
  topContributors: Array<{ id: string; name: string; avatar: string | null; meetings: number; hours: number; languages: number }>;
  recentActivity: Array<{ id: string; title: string; date: string; duration: string; languages: string[]; platform: string; participants: number }>;
  usage: { minutesUsed: number; minutesLimit: number; tier: string };
}

function formatRelativeDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHr = Math.floor(diffMs / 3600000);
  if (diffHr < 1) return 'Just now';
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 0) return 'Today';
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const EMPTY_STATS: StatsData = {
  summary: {
    totalMeetings: 0, translationHours: 0, languagesUsed: 0,
    teamMembers: 0, activeNow: 0,
    meetingsChange: '—', hoursChange: '—', languagesChange: '—', membersChange: '—',
  },
  meetingActivity: [], translationVolume: [], languages: [], platforms: [],
  topContributors: [], recentActivity: [],
  usage: { minutesUsed: 0, minutesLimit: 20000, tier: 'FREE' },
};

export default function StatisticsPage() {
  const { isOrganization, currentWorkspace, hasPermission } = useWorkspace();
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const [stats, setStats] = useState<StatsData>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const isOrg = isOrganization();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (isOrg) params.set('workspaceId', currentWorkspace.id);
      const res = await fetch(`/api/statistics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [period, isOrg, currentWorkspace.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const { summary, meetingActivity, translationVolume, languages, platforms, topContributors, recentActivity, usage } = stats;
  const maxActivity = Math.max(...meetingActivity.map((d) => d.value), 1);
  const maxVolume = Math.max(...translationVolume.map((d) => d.value), 1);
  const usagePercent = usage.minutesLimit > 0 ? Math.round((usage.minutesUsed / usage.minutesLimit) * 100) : 0;

  return (
    <>
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader searchPlaceholder={isOrg ? 'Search team stats, members...' : 'Search your stats, meetings...'} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-7xl mx-auto space-y-10">

            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink mb-2">
                  {isOrg ? `${currentWorkspace.name} Statistics` : 'Your Statistics'}
                </h1>
                <p className="text-muted text-lg">
                  {isOrg ? 'Team-wide usage analytics and insights.' : 'Your personal meeting activity and translation usage.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 bg-surface border border-border/30 p-1 rounded-xl overflow-x-auto no-scrollbar">
                  {TIME_PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                        period === p
                          ? 'bg-accent text-white shadow-sm'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              /* Loading Skeleton */
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-surface border border-border rounded-xl p-6 shadow-card animate-pulse">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-chrome/20" />
                        <div className="w-16 h-3 bg-chrome/20 rounded" />
                      </div>
                      <div className="w-20 h-8 bg-chrome/20 rounded mb-2" />
                      <div className="w-24 h-3 bg-chrome/20 rounded" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card animate-pulse h-64" />
                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card animate-pulse h-64" />
                </div>
              </div>
            ) : summary.totalMeetings === 0 ? (
              /* Empty State */
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-[64px] text-muted/20 mb-4">videocam</span>
                <h3 className="font-bold text-ink text-xl mb-2">No meetings yet</h3>
                <p className="text-muted text-sm max-w-md mx-auto">
                  Once you start joining meetings, your usage statistics and analytics will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {isOrg ? (
                    <>
                      <MetricCard icon="videocam" color="text-info bg-info/10" value={summary.totalMeetings.toLocaleString()} label="Total Meetings" change={summary.meetingsChange} />
                      <MetricCard icon="schedule" color="text-success bg-success/10" value={`${summary.translationHours}h`} label="Translation Hours" change={summary.hoursChange} />
                      <MetricCard icon="group" color="text-warning bg-warning/10" value={`${summary.teamMembers}`} label="Team Members" change={summary.membersChange} />
                      <MetricCard icon="cell_tower" color="text-danger bg-danger/10" value={`${summary.activeNow}`} label="Active Now" change="Real-time" />
                    </>
                  ) : (
                    <>
                      <MetricCard icon="videocam" color="text-info bg-info/10" value={`${summary.totalMeetings}`} label="Your Meetings" change={summary.meetingsChange} />
                      <MetricCard icon="schedule" color="text-success bg-success/10" value={`${summary.translationHours}h`} label="Translation Time" change={summary.hoursChange} />
                      <MetricCard icon="translate" color="text-warning bg-warning/10" value={`${summary.languagesUsed}`} label="Languages Used" change={summary.languagesChange} />
                      <MetricCard icon="cell_tower" color="text-danger bg-danger/10" value={`${summary.activeNow}`} label="Active Now" change="Real-time" />
                    </>
                  )}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Meeting Activity */}
                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold tracking-tight text-ink">
                        {isOrg ? 'Team Meeting Activity' : 'Your Meeting Activity'}
                      </h2>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                        {period === '7d' ? 'This Week' : period === '30d' ? 'This Month' : 'This Quarter'}
                      </span>
                    </div>
                    {meetingActivity.length > 0 ? (
                      <div className="h-48 flex items-end gap-2">
                        {meetingActivity.map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-[10px] font-bold text-muted">{item.value}</span>
                            <div
                              className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-default"
                              style={{
                                height: `${maxActivity > 0 ? (item.value / maxActivity) * 100 : 0}%`,
                                background: 'var(--color-accent)',
                              }}
                              title={`${item.label}: ${item.value} meetings`}
                            />
                            <span className="text-[11px] text-muted font-medium">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted text-sm">No data for this period</div>
                    )}
                  </div>

                  {/* Translation Volume */}
                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold tracking-tight text-ink">
                        {isOrg ? 'Team Translation Volume' : 'Your Translation Volume'}
                      </h2>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Meetings translated</span>
                    </div>
                    {translationVolume.length > 0 ? (
                      <div className="h-48 flex items-end gap-2">
                        {translationVolume.map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-[10px] font-bold text-muted">{item.value}</span>
                            <div
                              className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-default"
                              style={{
                                height: `${maxVolume > 0 ? (item.value / maxVolume) * 100 : 0}%`,
                                background: 'var(--color-accent)',
                              }}
                              title={`${item.label}: ${item.value} meetings`}
                            />
                            <span className="text-[11px] text-muted font-medium">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted text-sm">No data for this period</div>
                    )}
                  </div>
                </div>

                {/* Language Breakdown + Platform Usage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Language Breakdown */}
                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold tracking-tight text-ink">Language Breakdown</h2>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{languages.length} languages</span>
                    </div>
                    {languages.length > 0 ? (
                      <div className="space-y-4">
                        {languages.map((lang, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-ink">{lang.name}</span>
                              <span className="text-xs text-muted">{lang.percentage}% · {lang.meetings} uses</span>
                            </div>
                            <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${lang.percentage}%`, background: 'var(--color-accent)' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted text-sm">No language data yet</div>
                    )}
                  </div>

                  {/* Platform Usage */}
                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold tracking-tight text-ink">Platform Usage</h2>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">By meeting type</span>
                    </div>
                    {platforms.length > 0 ? (
                      <div className="space-y-4">
                        {platforms.map((platform, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-ink">{platform.name}</span>
                              <span className="text-xs text-muted">{platform.percentage}%</span>
                            </div>
                            <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${platform.percentage}%`, background: 'var(--color-accent)' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted text-sm">No platform data yet</div>
                    )}
                  </div>
                </div>

                {/* Top Members (Org only) */}
                {isOrg && topContributors.length > 0 && (
                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold tracking-tight text-ink">Top Contributors</h2>
                      {hasPermission('owner') && (
                        <Link href="/dashboard/settings" className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-accent-deep transition-colors">
                          Manage Members →
                        </Link>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topContributors.map((member, i) => (
                        <div key={member.id} className="flex items-center gap-4 p-4 bg-canvas border border-border/20 rounded-xl hover:border-accent/30 hover:shadow-card transition-all duration-300 group">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-chrome text-white flex items-center justify-center text-[11px] font-bold group-hover:scale-110 transition-transform overflow-hidden">
                              {member.avatar ? (
                                <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                              )}
                            </div>
                            {i < 3 && (
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${
                                i === 0 ? 'bg-accent' : 'bg-border-strong'
                              }`}>
                                {i + 1}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-ink truncate group-hover:text-accent transition-colors">{member.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-muted">{member.meetings} meetings</span>
                              <span className="text-[10px] text-muted">{member.hours}h</span>
                              <span className="text-[10px] text-muted">{member.languages} langs</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {recentActivity.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold tracking-tight text-ink">Recent Activity</h2>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                        Last {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentActivity.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="bg-surface border border-border p-5 rounded-xl shadow-card hover:shadow-pop hover:border-accent/30 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                              meeting.platform === 'Native'
                                ? 'bg-accent text-white border-accent/30'
                                : 'bg-canvas text-muted border-border/20'
                            }`}>
                              <span className="material-symbols-outlined text-[20px]">
                                {meeting.platform === 'Native' ? 'videocam' : 'videocam'}
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              {meeting.languages.length > 0 && (
                                <span className="bg-canvas border border-border/20 text-muted px-2 py-0.5 rounded text-[9px] font-bold">
                                  {meeting.languages.slice(0, 2).join(' + ')}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                meeting.platform === 'Native'
                                  ? 'bg-accent text-white shadow-sm'
                                  : 'bg-canvas text-muted border border-border/20'
                              }`}>
                                {meeting.platform}
                              </span>
                            </div>
                          </div>
                          <h3 className="font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                            {meeting.title}
                          </h3>
                          <p className="text-muted text-xs">
                            {formatRelativeDate(meeting.date)} · {meeting.duration} · {meeting.participants} participants
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usage Summary (Owner only) */}
                {isOrg && hasPermission('owner') && (
                  <div className="bg-surface border border-border rounded-xl p-6 shadow-card relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-chrome flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[24px]">payments</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-ink">Workspace Usage</h3>
                          <p className="text-xs text-muted">
                            {Math.round(usage.minutesUsed / 60)}h of {Math.round(usage.minutesLimit / 60)}h monthly limit used
                          </p>
                        </div>
                      </div>
                      <Link href="/dashboard/billing" className="bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        Manage Billing
                      </Link>
                    </div>
                    <div className="mt-4 w-full h-2 bg-border/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(usagePercent, 100)}%`, background: 'var(--color-accent)' }} />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-muted">0h</span>
                      <span className="text-[10px] text-muted">{Math.round(usage.minutesLimit / 60)}h</span>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </main>
    </>
  );
}

function MetricCard({ icon, color, value, label, change }: {
  icon: string;
  color: string;
  value: string;
  label: string;
  change: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card hover:shadow-pop hover:border-accent/30 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className="flex items-center gap-1 text-accent text-[10px] font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-accent text-[12px]">trending_up</span>
          {change}
        </span>
      </div>
      <p className="text-3xl font-bold text-ink leading-none mb-1">{value}</p>
      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</p>
    </div>
  );
}
