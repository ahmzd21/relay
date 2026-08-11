'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

const MOCK_MEETINGS: Record<string, {
  title: string;
  date: string;
  time: string;
  duration: string;
  languages: string[];
  aiReady: boolean;
  participants: { name: string; initials: string; color: string; role: string }[];
  summary: string;
  actionItems: string[];
  transcript: { speaker: string; time: string; text: string }[];
  recordingUrl: string;
}> = {
  R902: {
    title: 'MENA Expansion Strategy',
    date: '2 hours ago',
    time: '10:00 AM',
    duration: '45m',
    languages: ['Arabic', 'English'],
    aiReady: true,
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-border text-ink', role: 'Host' },
      { name: 'Sarah Chen', initials: 'SC', color: 'bg-border text-ink', role: 'Presenter' },
      { name: 'Yousef Al-Rashid', initials: 'YA', color: 'bg-border text-ink', role: 'Attendee' },
      { name: 'Sofia Martinez', initials: 'SM', color: 'bg-border text-ink', role: 'Attendee' },
      { name: 'Wei Zhang', initials: 'WZ', color: 'bg-border text-ink', role: 'Attendee' },
    ],
    summary: 'The team discussed the MENA expansion timeline and resource allocation. Key decisions were made regarding the Dubai office launch in Q2, with Sarah leading the marketing campaign and Yousef overseeing local partnerships. Budget allocation of $2.4M was approved for the first phase. Technical infrastructure setup was delegated to Wei\'s team with a target completion date of March 15th.',
    actionItems: [
      'Sarah to prepare MENA marketing campaign proposal by Friday',
      'Yousef to schedule meetings with potential local partners in Dubai',
      'Wei to present technical infrastructure plan at next week\'s sync',
      'Elias to finalize budget allocation document and share with finance',
      'Sofia to coordinate with HR for Dubai office hiring plan',
    ],
    transcript: [
      { speaker: 'Elias Thompson', time: '10:02', text: 'Welcome everyone. Let\'s dive into the MENA expansion strategy. Sarah, can you start with the market analysis?' },
      { speaker: 'Sarah Chen', time: '10:04', text: 'Sure. Our research shows a 340% growth in demand for AI translation services in the MENA region over the past 18 months. The UAE and Saudi Arabia are our primary targets.' },
      { speaker: 'Yousef Al-Rashid', time: '10:08', text: 'I\'ve been in touch with several potential partners in Dubai. The interest is very high, especially from the financial sector.' },
      { speaker: 'Elias Thompson', time: '10:12', text: 'Excellent. Let\'s allocate $2.4M for the first phase. Sarah, I need your campaign proposal by Friday.' },
      { speaker: 'Wei Zhang', time: '10:15', text: 'Our technical team can have the infrastructure ready by mid-March. I\'ll prepare a detailed plan for the next sync.' },
      { speaker: 'Sofia Martinez', time: '10:18', text: 'I\'ll start working on the hiring plan for the Dubai office. We need at least 5 engineers and 2 sales reps initially.' },
      { speaker: 'Elias Thompson', time: '10:22', text: 'Perfect. Let\'s reconvene next Tuesday to review progress. Great meeting everyone.' },
    ],
    recordingUrl: '#',
  },
  J881: {
    title: 'Tokyo Creative Workshop',
    date: 'Yesterday',
    time: '2:30 PM',
    duration: '1h 20m',
    languages: ['Japanese', 'English'],
    aiReady: true,
    participants: [
      { name: 'Yuki Tanaka', initials: 'YT', color: 'bg-border text-ink', role: 'Host' },
      { name: 'Marcus Klein', initials: 'MK', color: 'bg-border text-ink', role: 'Presenter' },
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-border text-ink', role: 'Attendee' },
    ],
    summary: 'Creative workshop focused on the Japanese market branding strategy. Marcus presented three brand identity concepts, with Concept B receiving the most positive feedback. The team agreed to proceed with a hybrid approach combining elements from Concepts A and B. Color palette and typography were finalized, with the design team to produce final assets by end of month.',
    actionItems: [
      'Marcus to combine Concepts A and B into final brand identity',
      'Yuki to validate brand concepts with focus group in Tokyo',
      'Design team to produce final logo and asset files by January 31st',
      'Elias to review and approve final brand guidelines',
    ],
    transcript: [
      { speaker: 'Yuki Tanaka', time: '14:32', text: 'Welcome to our creative workshop. Marcus, let\'s see the brand concepts you\'ve prepared.' },
      { speaker: 'Marcus Klein', time: '14:35', text: 'I have three concepts ready. Concept A is minimalist, Concept B is vibrant and cultural, Concept C is tech-forward.' },
      { speaker: 'Elias Thompson', time: '14:45', text: 'I really like the cultural elements in Concept B. Can we blend it with the clean lines from Concept A?' },
      { speaker: 'Yuki Tanaka', time: '14:48', text: 'That hybrid approach sounds perfect for the Japanese market. Let\'s proceed with that direction.' },
    ],
    recordingUrl: '#',
  },
  P120: {
    title: 'Paris Sync: Design Ops',
    date: '2 days ago',
    time: '11:00 AM',
    duration: '30m',
    languages: ['English', 'French'],
    aiReady: false,
    participants: [
      { name: 'Pierre Laurent', initials: 'PL', color: 'bg-border text-ink', role: 'Host' },
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-border text-ink', role: 'Attendee' },
    ],
    summary: 'Brief sync on design operations workflow. Pierre introduced the new Figma component library which reduced design handoff time by 40%. The team agreed to adopt the new system across all projects starting next sprint. Minor adjustments needed for the mobile component set.',
    actionItems: [
      'Pierre to document the new Figma component library guidelines',
      'Team to migrate existing projects to new component system by next sprint',
      'Fix mobile component set spacing issues',
    ],
    transcript: [
      { speaker: 'Pierre Laurent', time: '11:02', text: 'Bonjour Elias. Let me show you the new component library we\'ve been working on.' },
      { speaker: 'Elias Thompson', time: '11:05', text: 'This looks great, Pierre. The handoff time reduction is impressive.' },
      { speaker: 'Pierre Laurent', time: '11:08', text: 'Merci. We should roll this out across all projects. I\'ll prepare the migration guide.' },
    ],
    recordingUrl: '#',
  },
  T001: {
    title: 'Global Town Hall',
    date: 'Last week',
    time: '9:00 AM',
    duration: '1h 45m',
    languages: ['English'],
    aiReady: false,
    participants: [
      { name: 'Elias Thompson', initials: 'ET', color: 'bg-border text-ink', role: 'Host' },
      { name: '120+ Attendees', initials: '120+', color: 'bg-border text-muted', role: 'Company' },
    ],
    summary: 'Company-wide town hall covering Q4 results, product roadmap, and 2025 vision. Revenue grew 78% YoY with 12,000+ enterprise customers. New product features including real-time collaboration and advanced analytics were announced. CEO outlined the three strategic pillars for 2025: Enterprise expansion, AI innovation, and global market penetration.',
    actionItems: [
      'Department heads to align quarterly goals with 2025 strategic pillars',
      'Product team to publish detailed roadmap by end of month',
      'HR to share updated benefits and growth opportunities',
    ],
    transcript: [
      { speaker: 'Elias Thompson', time: '9:02', text: 'Welcome to our Global Town Hall. Let me start with our incredible Q4 results.' },
      { speaker: 'Elias Thompson', time: '9:05', text: 'Revenue grew 78% year-over-year, reaching $48M ARR. We now serve over 12,000 enterprise customers globally.' },
      { speaker: 'Elias Thompson', time: '9:15', text: 'Our 2025 vision focuses on three pillars: Enterprise expansion, AI innovation, and global market penetration.' },
    ],
    recordingUrl: '#',
  },
};

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'actions'>('summary');

  const meeting = MOCK_MEETINGS[meetingId] || MOCK_MEETINGS.R902;

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
                      Ended
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted">
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
                { label: 'Duration', value: meeting.duration, icon: 'schedule', color: 'text-muted bg-canvas' },
                { label: 'Languages', value: `${meeting.languages.length}`, icon: 'translate', color: 'text-info bg-info/10' },
                { label: 'Participants', value: `${meeting.participants.length}`, icon: 'group', color: 'text-success bg-success/10' },
                { label: 'AI Analysis', value: meeting.aiReady ? 'Complete' : 'Pending', icon: 'smart_toy', color: meeting.aiReady ? 'text-success bg-success/10' : 'text-warning bg-warning/10' },
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

            {/* Participants */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
              <h2 className="text-lg font-bold tracking-tight text-ink mb-4">Participants</h2>
              <div className="flex flex-wrap gap-3">
                {meeting.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 bg-canvas border border-border/20 rounded-xl px-4 py-2.5">
                    <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center text-[11px] font-bold`}>
                      {p.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">{p.name}</p>
                      <p className="text-[10px] text-muted uppercase tracking-wider">{p.role}</p>
                    </div>
                  </div>
                ))}
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
                <p className="text-ink/80 leading-relaxed text-[15px]">{meeting.summary}</p>
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
                      <p className="text-[10px] text-muted uppercase tracking-widest">{meeting.transcript.length} messages</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold text-muted uppercase tracking-widest hover:text-ink transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    Download
                  </button>
                </div>
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
                    <p className="text-[10px] text-muted uppercase tracking-widest">{meeting.actionItems.length} items extracted</p>
                  </div>
                </div>
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
              </div>
            )}

            {/* Recording */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-canvas flex items-center justify-center">
                    <span className="material-symbols-outlined text-ink text-[24px]">play_circle</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">Meeting Recording</h3>
                    <p className="text-xs text-muted">{meeting.duration} · {meeting.languages.join(' + ')} audio</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-canvas text-ink px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-border/30 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download
                  </button>
                  <button className="bg-surface text-ink px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-surface/90 transition-all flex items-center gap-2">
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
