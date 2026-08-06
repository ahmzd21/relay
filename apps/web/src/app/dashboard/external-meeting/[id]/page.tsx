'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

interface ExternalMeetingDetail {
  title: string;
  platform: 'Zoom' | 'Google Meet' | 'Microsoft Teams';
  url: string;
  date: string;
  time: string;
  duration: string;
  languages: string[];
  status: 'translated' | 'processing' | 'ended';
  participants: { name: string; initials: string; color: string }[];
  summary: string;
  actionItems: string[];
  transcript: { speaker: string; time: string; text: string }[];
  recordingUrl: string;
}

const MOCK_MEETINGS: Record<string, ExternalMeetingDetail> = {
  'ext-1': {
    title: 'Q4 Strategy Review',
    platform: 'Zoom',
    url: 'https://zoom.us/j/123456789',
    date: 'Today',
    time: '2:30 PM',
    duration: '2h 15m',
    languages: ['English', 'Spanish'],
    status: 'translated',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Sarah Chen', initials: 'SC', color: 'bg-rose-100 text-rose-700' },
      { name: 'Marcus Klein', initials: 'MK', color: 'bg-purple-100 text-purple-700' },
    ],
    summary: 'Comprehensive Q4 strategy review covering revenue targets, product roadmap, and market expansion plans. The team aligned on key priorities including the MENA expansion timeline, enterprise feature development, and customer success initiatives. Budget allocations were finalized for engineering, marketing, and operations.',
    actionItems: [
      'Sarah to finalize Q4 marketing budget proposal by Friday',
      'Marcus to present enterprise feature roadmap at next sync',
      'Elias to schedule board update meeting for Q4 targets',
    ],
    transcript: [
      { speaker: 'Elias Thompson', time: '14:32', text: 'Welcome everyone to our Q4 strategy review. Let\'s start with revenue projections.' },
      { speaker: 'Sarah Chen', time: '14:35', text: 'Based on current pipeline, we\'re tracking 15% above Q3 targets. The enterprise segment is showing strongest growth.' },
      { speaker: 'Marcus Klein', time: '14:40', text: 'The product team has three major features queued for Q4 release that should accelerate enterprise adoption.' },
      { speaker: 'Elias Thompson', time: '14:45', text: 'Excellent. Let\'s lock in the budget allocations and reconvene next week with detailed plans.' },
    ],
    recordingUrl: '#',
  },
  'ext-2': {
    title: 'Product Sync with Partners',
    platform: 'Microsoft Teams',
    url: 'https://teams.microsoft.com/l/meetup-join/abc',
    date: 'Yesterday',
    time: '10:00 AM',
    duration: '45m',
    languages: ['English', 'Arabic'],
    status: 'translated',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Yousef Al-Rashid', initials: 'YA', color: 'bg-amber-100 text-amber-700' },
    ],
    summary: 'Product synchronization meeting with regional partners to align on feature priorities and integration timelines. Discussed API rate limiting improvements, webhook reliability, and new translation language support. Partners expressed strong interest in the upcoming collaboration features.',
    actionItems: [
      'Yousef to share API documentation updates with partners',
      'Schedule follow-up for webhook integration testing',
    ],
    transcript: [
      { speaker: 'Elias Thompson', time: '10:02', text: 'Good morning Yousef. Let\'s review the partner feedback on our latest API release.' },
      { speaker: 'Yousef Al-Rashid', time: '10:05', text: 'The partners are very happy with the rate limiting improvements. They\'re asking about webhook reliability next.' },
      { speaker: 'Elias Thompson', time: '10:10', text: 'We have improvements scheduled for Q4. Let\'s get them on a beta test group.' },
    ],
    recordingUrl: '#',
  },
  'ext-3': {
    title: 'Client Onboarding Call',
    platform: 'Google Meet',
    url: 'https://meet.google.com/abc-xyz-def',
    date: '2 days ago',
    time: '4:00 PM',
    duration: '30m',
    languages: ['English', 'French'],
    status: 'processing',
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
      { name: 'Sofia Martinez', initials: 'SM', color: 'bg-emerald-100 text-emerald-700' },
    ],
    summary: 'New client onboarding session covering platform setup, team configuration, and initial training. Client expressed enthusiasm about the real-time translation capabilities and requested custom language pair support for their specific use case.',
    actionItems: [
      'Sofia to configure client workspace and invite team members',
      'Schedule technical training session for next week',
    ],
    transcript: [
      { speaker: 'Elias Thompson', time: '16:02', text: 'Welcome to Relay. Let me walk you through the platform setup process.' },
      { speaker: 'Sofia Martinez', time: '16:05', text: 'I\'ll help configure your workspace and add your team members.' },
    ],
    recordingUrl: '#',
  },
};

const PLATFORM_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  Zoom: { icon: 'videocam', color: 'text-blue-600', bg: 'bg-blue-50' },
  'Google Meet': { icon: 'groups', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Microsoft Teams': { icon: 'meeting_room', color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

export default function ExternalMeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'actions'>('summary');

  const meeting = MOCK_MEETINGS[meetingId] || MOCK_MEETINGS['ext-1'];
  const platform = PLATFORM_ICONS[meeting.platform];

  return (
    <>

      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Back + Title */}
            <div className="space-y-4">
              <button
                onClick={() => router.push('/dashboard/external-meeting')}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to External Meetings
              </button>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${platform.bg}`}>
                      <span className={`material-symbols-outlined ${platform.color} text-[20px]`}>{platform.icon}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold font-helvetica tracking-tight text-slate-900">
                      {meeting.title}
                    </h1>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      meeting.status === 'translated' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      meeting.status === 'processing' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {meeting.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">{platform.icon}</span>
                      {meeting.platform}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {meeting.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {meeting.time} · {meeting.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">translate</span>
                      {meeting.languages.join(' + ')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={meeting.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border border-[#E4E0D6]/30 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Open Original
                  </a>
                  <button className="bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 hover:scale-105 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-black/5">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Duration', value: meeting.duration, icon: 'schedule', color: 'text-slate-600 bg-slate-50' },
                { label: 'Languages', value: `${meeting.languages.length}`, icon: 'translate', color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Participants', value: `${meeting.participants.length}`, icon: 'group', color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Platform', value: meeting.platform.split(' ')[0], icon: platform.icon, color: `${platform.color} ${platform.bg}` },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 shadow-warm">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                    <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                  </div>
                  <p className="text-xl font-bold font-helvetica text-slate-900">{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Participants */}
            <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
              <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900 mb-4">Participants</h2>
              <div className="flex flex-wrap gap-3">
                {meeting.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl px-4 py-2.5">
                    <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center text-[11px] font-bold`}>
                      {p.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{i === 0 ? 'Host' : 'Attendee'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
              {([
                { key: 'summary' as const, label: 'AI Summary' },
                { key: 'transcript' as const, label: 'Transcript' },
                { key: 'actions' as const, label: 'Action Items' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold tracking-wider uppercase font-helvetica transition-all ${
                    activeTab === tab.key
                      ? 'bg-white shadow-sm text-slate-900'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'summary' && (
              <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">smart_toy</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">AI-Generated Summary</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Powered by Relay Intelligence</p>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed text-[15px]">{meeting.summary}</p>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-600 text-[20px]">description</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Full Transcript</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{meeting.transcript.length} messages</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    Download
                  </button>
                </div>
                <div className="space-y-4">
                  {meeting.transcript.map((entry, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="text-right w-12 flex-shrink-0">
                        <span className="text-[11px] font-bold text-slate-400">{entry.time}</span>
                      </div>
                      <div className="w-px bg-[#c4c7c7]/30 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-slate-900 mb-0.5">{entry.speaker}</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{entry.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 text-[20px]">checklist</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Action Items</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{meeting.actionItems.length} items extracted</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {meeting.actionItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl">
                      <div className="w-5 h-5 rounded border border-[#E4E0D6]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recording */}
            <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#1c1b1b] text-[24px]">play_circle</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1c1b1b]">Meeting Recording</h3>
                    <p className="text-xs text-[#8C8880]">{meeting.duration} · {meeting.languages.join(' + ')} audio</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-[#FAF9F5] text-[#1c1b1b] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#E4E0D6]/30 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download
                  </button>
                  <button className="bg-white text-black px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/90 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    Play
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
