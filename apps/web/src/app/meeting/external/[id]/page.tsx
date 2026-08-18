'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface TranscriptEntry {
  id: string;
  timestamp: number | string;
  speakerName: string;
  isSelf?: boolean;
  originalText: string;
  translatedText: string;
}

interface Participant {
  name: string;
  isSelf?: boolean;
  isActive?: boolean;
}

interface MeetingDetails {
  id: string;
  title: string;
  platform: 'zoom' | 'google_meet' | 'teams';
  status: 'validating' | 'connecting' | 'waiting_room' | 'passcode_required' | 'in_call' | 'ended' | 'failed';
  statusDetail?: string;
  claimedSpeakerName?: string;
  userInMeeting?: boolean;
  hearingLang: string;
  speakingLang: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ko', name: 'Korean' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ur', name: 'Urdu' },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ExternalMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [details, setDetails] = useState<MeetingDetails | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState<string>('connecting');
  const [statusDetail, setStatusDetail] = useState<string>('Connecting to meeting...');
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [claimedSpeaker, setClaimedSpeaker] = useState<string>('');
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [isSubmittingPasscode, setIsSubmittingPasscode] = useState(false);

  const [hearingLanguage, setHearingLanguage] = useState('en');
  const [speakingLanguage, setSpeakingLanguage] = useState('en');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let mounted = true;

    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/meetings/external/${id}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch meeting details');
        const data = await res.json();
        
        if (mounted) {
          setDetails(data);
          setStatus(data.status ? data.status.toLowerCase() : 'connecting');
          if (data.statusDetail) setStatusDetail(data.statusDetail);
          if (data.claimedSpeakerName) setClaimedSpeaker(data.claimedSpeakerName);
          if (data.hearingLang) setHearingLanguage(data.hearingLang);
          if (data.speakingLang) setSpeakingLanguage(data.speakingLang);
        }

        // Initialize EventSource for real-time live data
        eventSource = new EventSource(`${API_BASE}/api/meetings/external/${id}/stream`, {
          withCredentials: true,
        });

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'transcript') {
              const entry: TranscriptEntry = {
                id: `${data.speaker}-${data.timestamp}-${Math.random()}`,
                timestamp: data.timestamp,
                speakerName: data.speaker,
                isSelf: data.isSelf,
                originalText: data.text,
                translatedText: data.translatedText,
              };
              setTranscripts((prev) => [...prev, entry]);
              setActiveSpeaker(data.speaker);
            } else if (data.type === 'participants') {
              setParticipants(data.participants);
            } else if (data.type === 'status') {
              setStatus((data.status || 'in_call').toLowerCase());
              if (data.statusDetail) setStatusDetail(data.statusDetail);
              if (data.claimedSpeakerName) setClaimedSpeaker(data.claimedSpeakerName);
            }
          } catch (err) {
            console.error('Failed to parse SSE event', err);
          }
        };

      } catch (err) {
        console.error('Error initializing meeting:', err);
      }
    };

    init();

    return () => {
      mounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [id]);

  const handleClaimSpeaker = async (speakerName: string) => {
    setClaimedSpeaker(speakerName);
    try {
      await fetch(`${API_BASE}/api/meetings/external/${id}/claim-speaker`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ speakerName }),
      });
    } catch (err) {
      console.error('Failed to claim speaker name', err);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim() || isSubmittingPasscode) return;
    setIsSubmittingPasscode(true);
    try {
      await fetch(`${API_BASE}/api/meetings/external/${id}/passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ passcode: passcodeInput.trim() }),
      });
      setPasscodeInput('');
    } catch (err) {
      console.error('Failed to submit passcode', err);
    } finally {
      setIsSubmittingPasscode(false);
    }
  };

  const handleLeave = async () => {
    try {
      await fetch(`${API_BASE}/api/meetings/external/${id}/leave`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/dashboard/external-meeting');
    } catch (err) {
      console.error('Failed to leave meeting', err);
      router.push('/dashboard/external-meeting');
    }
  };

  const handleLanguageChange = async (type: 'hearing' | 'speaking', lang: string) => {
    if (type === 'hearing') setHearingLanguage(lang);
    if (type === 'speaking') setSpeakingLanguage(lang);

    try {
      await fetch(`${API_BASE}/api/meetings/external/${id}/language`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          hearingLang: type === 'hearing' ? lang : hearingLanguage,
          speakingLang: type === 'speaking' ? lang : speakingLanguage,
        }),
      });
    } catch (err) {
      console.error('Failed to update languages', err);
    }
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'zoom':
        return 'videocam';
      case 'google_meet':
        return 'groups';
      case 'teams':
        return 'meeting_room';
      default:
        return 'hub';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface text-ink font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-chrome shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/external-meeting')}
            className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Dashboard
          </button>
          
          <div className="h-5 w-px bg-border" />
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
              <span className="material-symbols-outlined text-accent text-[18px]">
                {getPlatformIcon(details?.platform)}
              </span>
            </div>
            <h1 className="font-bold text-base text-ink">{details?.title || 'External Meeting'}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-5">
          {/* Identity Picker / Confirmation Tag */}
          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="text-muted">You:</span>
            {claimedSpeaker ? (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {claimedSpeaker}
              </span>
            ) : (
              <select
                value={claimedSpeaker}
                onChange={(e) => handleClaimSpeaker(e.target.value)}
                className="bg-transparent text-accent font-bold focus:outline-none cursor-pointer"
              >
                <option value="">Claim your name in call ▾</option>
                {participants.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-2 bg-surface border border-border px-3 py-1.5 rounded-full text-xs font-semibold">
            <div className={`w-2 h-2 rounded-full ${
              status === 'waiting_room' ? 'bg-amber-500 animate-ping' :
              status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              status === 'in_call' ? 'bg-emerald-500' :
              'bg-red-500'
            }`} />
            <span className="text-muted font-medium capitalize">
              {status === 'waiting_room' ? 'Waiting in Lobby' :
               status === 'connecting' ? 'Connecting...' :
               status === 'in_call' ? 'In Call' : status}
            </span>
          </div>
          
          <button
            onClick={handleLeave}
            className="px-4 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-full font-bold text-xs transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">call_end</span>
            Leave
          </button>
        </div>
      </div>

      {/* Granular Status Alert Banners */}
      {status === 'waiting_room' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            <span>Relay Bot is currently in the meeting lobby. <strong>Please ask the meeting host to click &quot;Admit&quot; on &quot;Relay AI Assistant&quot;.</strong></span>
          </div>
          <span className="text-[11px] opacity-75">Auto-checks every 2s</span>
        </div>
      )}

      {status === 'passcode_required' && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-3 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>This meeting requires a passcode to enter.</span>
          </div>
          <form onSubmit={handlePasscodeSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder="Enter meeting passcode..."
              className="bg-surface border border-blue-500/30 rounded-lg px-3 py-1 text-xs text-ink focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmittingPasscode || !passcodeInput.trim()}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Transcripts (72%) */}
        <div className="w-[72%] flex flex-col border-r border-border bg-canvas relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
          >
            {transcripts.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mb-3 shadow-card">
                  <span className="material-symbols-outlined text-accent text-3xl">graphic_eq</span>
                </div>
                <p className="font-semibold text-sm text-ink">Waiting for speech in the meeting...</p>
                <p className="text-xs text-muted mt-1">Live captions & translations will stream here in real time.</p>
              </div>
            ) : (
              transcripts.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    entry.isSelf
                      ? 'bg-surface/80 border-emerald-500/30 shadow-sm ml-8'
                      : 'bg-surface border-border shadow-card mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-ink">
                        {entry.speakerName}
                      </span>
                      {entry.isSelf && (
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted">
                      {typeof entry.timestamp === 'number'
                        ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : entry.timestamp}
                    </span>
                  </div>
                  
                  <p className="text-ink text-sm leading-relaxed">{entry.originalText}</p>
                  
                  {!entry.isSelf && entry.translatedText && entry.translatedText !== entry.originalText && (
                    <div className="mt-2.5 pt-2.5 border-t border-border/40 flex items-start space-x-2">
                      <span className="material-symbols-outlined text-accent text-[16px] mt-0.5">translate</span>
                      <p className="text-accent text-sm font-semibold leading-relaxed">{entry.translatedText}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Participants (28%) */}
        <div className="w-[28%] bg-chrome flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-sm text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-muted text-[18px]">group</span>
              Participants
            </h2>
            <span className="text-xs font-bold text-muted bg-surface border border-border px-2.5 py-0.5 rounded-full">
              {participants.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {participants.length === 0 ? (
              <div className="p-6 text-center text-muted text-xs">
                <span className="material-symbols-outlined text-2xl text-muted/40 mb-2">person_search</span>
                <p>Detecting participants...</p>
              </div>
            ) : (
              participants.map((p) => {
                const isClaimedSelf = claimedSpeaker && p.name.toLowerCase() === claimedSpeaker.toLowerCase();
                return (
                  <div
                    key={p.name}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isClaimedSelf
                        ? 'bg-surface border-emerald-500/40 shadow-sm'
                        : activeSpeaker === p.name
                          ? 'bg-surface border-accent/40 shadow-sm'
                          : 'bg-surface/50 border-border/40 hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm relative ${
                        isClaimedSelf
                          ? 'bg-emerald-500 text-white'
                          : 'bg-accent/10 text-accent'
                      }`}>
                        {getInitials(p.name)}
                        {activeSpeaker === p.name && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-chrome rounded-full animate-ping"></span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-ink flex items-center gap-1.5">
                          {p.name}
                          {isClaimedSelf && (
                            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted">
                          {activeSpeaker === p.name ? 'Speaking now' : 'Listening'}
                        </p>
                      </div>
                    </div>
                    
                    {!isClaimedSelf && !claimedSpeaker && (
                      <button
                        onClick={() => handleClaimSpeaker(p.name)}
                        className="text-[10px] font-bold text-accent hover:underline bg-accent/5 px-2 py-1 rounded"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar — 2-Way Language Controls */}
      <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-chrome shadow-pop">
        <div className="flex items-center space-x-8">
          {/* Hearing Language */}
          <div className="flex items-center space-x-2.5">
            <span className="material-symbols-outlined text-muted text-[18px]">headphones</span>
            <span className="text-xs font-semibold text-muted">Hearing (Translated for you):</span>
            <select
              value={hearingLanguage}
              onChange={(e) => handleLanguageChange('hearing', e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-ink focus:outline-none focus:border-accent cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Speaking Language */}
          <div className="flex items-center space-x-2.5">
            <span className="material-symbols-outlined text-muted text-[18px]">mic</span>
            <span className="text-xs font-semibold text-muted">Speaking into meeting as:</span>
            <select
              value={speakingLanguage}
              onChange={(e) => handleLanguageChange('speaking', e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-ink focus:outline-none focus:border-accent cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] text-muted font-medium">
          Echo-Prevention Active · Smart Audio Isolation
        </div>
      </div>
    </div>
  );
}

