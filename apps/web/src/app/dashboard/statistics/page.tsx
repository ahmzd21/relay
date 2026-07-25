'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';
import { useWorkspace } from '@/contexts/WorkspaceContext';

const TIME_PERIODS = ['7d', '30d', '90d'] as const;
type TimePeriod = typeof TIME_PERIODS[number];

export default function StatisticsPage() {
  const { isOrganization, currentWorkspace, hasPermission } = useWorkspace();
  const [period, setPeriod] = useState<TimePeriod>('7d');

  const orgStats = {
    totalMeetings: 342,
    translationHours: 287,
    languagesUsed: 24,
    teamMembers: 12,
    activeNow: 4,
    meetingsChange: '+18.2%',
    hoursChange: '+12.4%',
    languagesChange: '+3',
    membersChange: '+2',
  };

  const personalStats = {
    totalMeetings: 47,
    translationHours: 38,
    languagesUsed: 8,
    meetingHours: 52,
    meetingsChange: '+24.5%',
    hoursChange: '+15.3%',
    languagesChange: '+2',
    hoursChange2: '+10.1%',
  };

  const meetingActivity = {
    '7d': [
      { day: 'Mon', value: 12 },
      { day: 'Tue', value: 8 },
      { day: 'Wed', value: 15 },
      { day: 'Thu', value: 10 },
      { day: 'Fri', value: 18 },
      { day: 'Sat', value: 3 },
      { day: 'Sun', value: 5 },
    ],
    '30d': [
      { day: 'W1', value: 42 },
      { day: 'W2', value: 58 },
      { day: 'W3', value: 51 },
      { day: 'W4', value: 65 },
    ],
    '90d': [
      { day: 'Jan', value: 95 },
      { day: 'Feb', value: 112 },
      { day: 'Mar', value: 135 },
    ],
  };

  const translationVolume = {
    '7d': [
      { day: 'Mon', value: 45 },
      { day: 'Tue', value: 32 },
      { day: 'Wed', value: 58 },
      { day: 'Thu', value: 42 },
      { day: 'Fri', value: 72 },
      { day: 'Sat', value: 12 },
      { day: 'Sun', value: 18 },
    ],
    '30d': [
      { day: 'W1', value: 165 },
      { day: 'W2', value: 225 },
      { day: 'W3', value: 198 },
      { day: 'W4', value: 248 },
    ],
    '90d': [
      { day: 'Jan', value: 385 },
      { day: 'Feb', value: 468 },
      { day: 'Mar', value: 542 },
    ],
  };

  const orgLanguages = [
    { name: 'English', percentage: 38, meetings: 130 },
    { name: 'Spanish', percentage: 22, meetings: 75 },
    { name: 'Mandarin', percentage: 18, meetings: 62 },
    { name: 'Arabic', percentage: 12, meetings: 41 },
    { name: 'Japanese', percentage: 6, meetings: 21 },
    { name: 'French', percentage: 4, meetings: 13 },
  ];

  const personalLanguages = [
    { name: 'English', percentage: 45, meetings: 21 },
    { name: 'Spanish', percentage: 25, meetings: 12 },
    { name: 'Japanese', percentage: 15, meetings: 7 },
    { name: 'French', percentage: 10, meetings: 5 },
    { name: 'Arabic', percentage: 5, meetings: 2 },
  ];

  const orgMembers = [
    { name: 'Sarah Chen', meetings: 68, hours: 54, languages: 5, initials: 'SC', color: 'bg-rose-100 text-rose-700' },
    { name: 'Yousef Al-Rashid', meetings: 52, hours: 41, languages: 4, initials: 'YA', color: 'bg-amber-100 text-amber-700' },
    { name: 'Marcus Klein', meetings: 48, hours: 38, languages: 6, initials: 'MK', color: 'bg-purple-100 text-purple-700' },
    { name: 'Elias Thompson', meetings: 45, hours: 36, languages: 3, initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Sofia Martinez', meetings: 38, hours: 29, languages: 4, initials: 'SM', color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Wei Zhang', meetings: 35, hours: 27, languages: 3, initials: 'WZ', color: 'bg-blue-100 text-blue-700' },
  ];

  const orgPlatformUsage = [
    { name: 'Native Relay', percentage: 52, color: 'bg-indigo-500' },
    { name: 'Zoom', percentage: 28, color: 'bg-blue-500' },
    { name: 'Google Meet', percentage: 12, color: 'bg-emerald-500' },
    { name: 'Microsoft Teams', percentage: 8, color: 'bg-purple-500' },
  ];

  const personalPlatformUsage = [
    { name: 'Native Relay', percentage: 62, color: 'bg-indigo-500' },
    { name: 'Zoom', percentage: 22, color: 'bg-blue-500' },
    { name: 'Google Meet', percentage: 16, color: 'bg-emerald-500' },
  ];

  const isOrg = isOrganization();
  const activityData = meetingActivity[period];
  const volumeData = translationVolume[period];
  const languages = isOrg ? orgLanguages : personalLanguages;
  const platformUsage = isOrg ? orgPlatformUsage : personalPlatformUsage;

  const maxActivity = Math.max(...activityData.map(d => d.value));
  const maxVolume = Math.max(...volumeData.map(d => d.value));

  return (
    <>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader searchPlaceholder={isOrg ? "Search team stats, members..." : "Search your stats, meetings..."} />

        <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10 pb-24">
          <div className="max-w-7xl mx-auto space-y-10">

            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold font-helvetica tracking-tight text-slate-900 mb-2">
                  {isOrg ? `${currentWorkspace.name} Statistics` : 'Your Statistics'}
                </h1>
                <p className="text-slate-600 text-lg">
                  {isOrg ? 'Team-wide usage analytics and insights.' : 'Your personal meeting activity and translation usage.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1 bg-white border border-[#c4c7c7]/30 p-1 rounded-xl">
                  {TIME_PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase font-helvetica transition-all ${
                        period === p
                          ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                    </button>
                  ))}
                </div>
                <button className="flex items-center gap-2 bg-white border border-[#c4c7c7]/30 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:border-[#FF416C]/30 hover:text-[#FF416C] transition-all">
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Export
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isOrg ? (
                <>
                  <MetricCard icon="videocam" color="text-indigo-600 bg-indigo-50" value={orgStats.totalMeetings.toLocaleString()} label="Total Meetings" change={orgStats.meetingsChange} />
                  <MetricCard icon="schedule" color="text-emerald-600 bg-emerald-50" value={`${orgStats.translationHours}h`} label="Translation Hours" change={orgStats.hoursChange} />
                  <MetricCard icon="group" color="text-amber-600 bg-amber-50" value={`${orgStats.teamMembers}`} label="Team Members" change={orgStats.membersChange} />
                  <MetricCard icon="cell_tower" color="text-rose-600 bg-rose-50" value={`${orgStats.activeNow}`} label="Active Now" change="Real-time" />
                </>
              ) : (
                <>
                  <MetricCard icon="videocam" color="text-indigo-600 bg-indigo-50" value={`${personalStats.totalMeetings}`} label="Your Meetings" change={personalStats.meetingsChange} />
                  <MetricCard icon="schedule" color="text-emerald-600 bg-emerald-50" value={`${personalStats.translationHours}h`} label="Translation Time" change={personalStats.hoursChange} />
                  <MetricCard icon="translate" color="text-amber-600 bg-amber-50" value={`${personalStats.languagesUsed}`} label="Languages Used" change={personalStats.languagesChange} />
                  <MetricCard icon="timer" color="text-rose-600 bg-rose-50" value={`${personalStats.meetingHours}h`} label="Meeting Time" change={personalStats.hoursChange2} />
                </>
              )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meeting Activity */}
              <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">
                    {isOrg ? 'Team Meeting Activity' : 'Your Meeting Activity'}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{period === '7d' ? 'This Week' : period === '30d' ? 'This Month' : 'This Quarter'}</span>
                </div>
                <div className="h-48 flex items-end gap-2">
                  {activityData.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">{item.value}</span>
                      <div
                        className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-default"
                        style={{
                          height: `${(item.value / maxActivity) * 100}%`,
                          background: 'linear-gradient(to top, #FF416C, #FF4B2B)',
                        }}
                        title={`${item.day}: ${item.value} meetings`}
                      />
                      <span className="text-[11px] text-slate-500 font-medium">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Translation Volume */}
              <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">
                    {isOrg ? 'Team Translation Volume' : 'Your Translation Volume'}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hours translated</span>
                </div>
                <div className="h-48 flex items-end gap-2">
                  {volumeData.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">{item.value}h</span>
                      <div
                        className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-default"
                        style={{
                          height: `${(item.value / maxVolume) * 100}%`,
                          background: 'linear-gradient(to top, #FF416C, #FF4B2B)',
                        }}
                        title={`${item.day}: ${item.value} hours`}
                      />
                      <span className="text-[11px] text-slate-500 font-medium">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Language Breakdown + Platform Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Language Breakdown */}
              <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Language Breakdown</h2>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{languages.length} languages</span>
                </div>
                <div className="space-y-4">
                  {languages.map((lang, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{lang.name}</span>
                        <span className="text-xs text-slate-500">{lang.percentage}% · {lang.meetings} meetings</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${lang.percentage}%`,
                            background: 'linear-gradient(to right, #FF416C, #FF4B2B)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Usage */}
              <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Platform Usage</h2>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">By meeting type</span>
                </div>
                <div className="space-y-4">
                  {platformUsage.map((platform, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{platform.name}</span>
                        <span className="text-xs text-slate-500">{platform.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${platform.percentage}%`,
                            background: 'linear-gradient(to right, #FF416C, #FF4B2B)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Members (Org only) */}
            {isOrg && (
              <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Top Contributors</h2>
                  {hasPermission('owner') && (
                    <Link href="/dashboard/settings" className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors">
                      Manage Members →
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orgMembers.map((member, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-[#FAF9F5] border border-[#c4c7c7]/20 rounded-xl hover:border-[#FF416C]/30 hover:shadow-md transition-all duration-300 group">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl ${member.color} flex items-center justify-center text-[11px] font-bold group-hover:scale-110 transition-transform`}>
                          {member.initials}
                        </div>
                        {i < 3 && (
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${
                            i === 0 ? 'bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] shadow-[#FF416C]/30' : 'bg-slate-400'
                          }`}>
                            {i + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#FF416C] transition-colors">{member.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-500">{member.meetings} meetings</span>
                          <span className="text-[10px] text-slate-500">{member.hours}h</span>
                          <span className="text-[10px] text-slate-500">{member.languages} langs</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Recent Activity</h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Q4 Strategy Review', date: 'Today', duration: '45m', languages: ['EN', 'ES'], platform: 'Native', participants: '5' },
                    { title: 'Client Sync: Redesign', date: 'Today', duration: '30m', languages: ['EN', 'JA'], platform: 'Zoom', participants: '3' },
                    { title: 'Team Standup', date: 'Yesterday', duration: '15m', languages: ['EN'], platform: 'Native', participants: '8' },
                    { title: 'Product Review', date: 'Yesterday', duration: '1h', languages: ['EN', 'AR'], platform: 'Meet', participants: '4' },
                    { title: 'Design Workshop', date: '2 days ago', duration: '2h', languages: ['EN', 'FR'], platform: 'Teams', participants: '6' },
                  ].map((meeting, i) => (
                    <div
                      key={i}
                      className="bg-[#0f1115] border border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:border-[#FF416C]/30 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          meeting.platform === 'Native'
                            ? 'bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] text-white border-[#FF416C]/30'
                            : 'bg-white/10 text-white/60 border-white/10'
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {meeting.platform === 'Native' ? 'videocam' : meeting.platform === 'Zoom' ? 'videocam' : meeting.platform === 'Meet' ? 'groups' : 'meeting_room'}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="bg-white/10 border border-white/10 text-white/60 px-2 py-0.5 rounded text-[9px] font-bold font-helvetica">
                            {meeting.languages.join(' + ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-helvetica ${
                            meeting.platform === 'Native'
                              ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm shadow-[#FF416C]/20'
                              : 'bg-white/10 text-white/50 border border-white/10'
                          }`}>
                            {meeting.platform}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-bold text-white mb-1 group-hover:text-[#FF416C] transition-colors font-helvetica">
                        {meeting.title}
                      </h3>
                      <p className="text-white/50 text-xs">
                        {meeting.date} · {meeting.duration} · {meeting.participants} participants
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Usage Summary (Owner only) */}
            {isOrg && hasPermission('owner') && (
              <div className="bg-[#0f1115] border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF416C]/5 to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-lg shadow-[#FF416C]/20">
                      <span className="material-symbols-outlined text-white text-[24px]">payments</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Workspace Usage</h3>
                      <p className="text-xs text-white/50">142h of 200h monthly limit used · Renews in 12 days</p>
                    </div>
                  </div>
                  <Link href="/dashboard/billing" className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-[#FF416C]/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Manage Billing
                  </Link>
                </div>
                <div className="mt-4 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '71%', background: 'linear-gradient(to right, #FF416C, #FF4B2B)' }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-white/40">0h</span>
                  <span className="text-[10px] text-white/40">200h</span>
                </div>
              </div>
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
    <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-[#FF416C]/30 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-white text-[20px]">{icon}</span>
        </div>
        <span className="flex items-center gap-1 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] bg-clip-text text-transparent text-[10px] font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[#FF416C] text-[12px]">trending_up</span>
          {change}
        </span>
      </div>
      <p className="text-3xl font-bold font-helvetica text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}
