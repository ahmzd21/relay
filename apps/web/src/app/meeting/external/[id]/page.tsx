'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface TranscriptEntry {
  id: string;
  timestamp: string;
  speakerName: string;
  originalText: string;
  translatedText: string;
}

interface Participant {
  id: string;
  name: string;
}

interface MeetingDetails {
  id: string;
  title: string;
  platform: 'zoom' | 'meet' | 'teams';
  status: 'connecting' | 'in_call' | 'ended';
  hearingLanguage: string;
  speakingLanguage: string;
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
  const [status, setStatus] = useState<'connecting' | 'in_call' | 'ended'>('connecting');
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

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
          setStatus(data.status);
          if (data.hearingLanguage) setHearingLanguage(data.hearingLanguage);
          if (data.speakingLanguage) setSpeakingLanguage(data.speakingLanguage);
        }

        // Initialize EventSource
        eventSource = new EventSource(`${API_BASE}/api/meetings/external/${id}/stream`, {
          withCredentials: true,
        });

        eventSource.addEventListener('transcript', (e) => {
          const entry = JSON.parse(e.data) as TranscriptEntry;
          setTranscripts((prev) => [...prev, entry]);
          setActiveSpeaker(entry.speakerName);
        });

        eventSource.addEventListener('participants', (e) => {
          const parts = JSON.parse(e.data) as Participant[];
          setParticipants(parts);
        });

        eventSource.addEventListener('status', (e) => {
          const newStatus = JSON.parse(e.data).status;
          setStatus(newStatus);
        });

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

  const handleLeave = async () => {
    try {
      await fetch(`${API_BASE}/api/meetings/external/${id}/leave`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to leave meeting', err);
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
          hearingLanguage: type === 'hearing' ? lang : hearingLanguage,
          speakingLanguage: type === 'speaking' ? lang : speakingLanguage,
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
      case 'meet':
        return 'video_camera_front';
      case 'teams':
        return 'groups';
      default:
        return 'cast';
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-chrome">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-muted hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined mr-1">arrow_back</span>
            Back
          </button>
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-muted">
              {getPlatformIcon(details?.platform)}
            </span>
            <h1 className="font-semibold text-lg">{details?.title || 'External Meeting'}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'connecting' ? 'bg-yellow-500' :
              status === 'in_call' ? 'bg-green-500' :
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium text-muted">
              {status === 'connecting' ? 'Connecting...' :
               status === 'in_call' ? 'In Call' : 'Ended'}
            </span>
          </div>
          
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md font-medium transition-colors"
          >
            Leave Meeting
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Transcripts */}
        <div className="w-[70%] flex flex-col border-r border-border bg-canvas relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
          >
            {transcripts.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted animate-pulse">
                <span className="material-symbols-outlined text-4xl mb-2">graphic_eq</span>
                <p>Waiting for speech...</p>
              </div>
            ) : (
              transcripts.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex flex-col space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xs text-faint">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-bold text-sm">{entry.speakerName}</span>
                  </div>
                  
                  <div className="flex flex-col space-y-2 pl-10">
                    <p className="text-ink text-lg">{entry.originalText}</p>
                    
                    {entry.translatedText && (
                      <div className="flex items-start space-x-2">
                        <span className="material-symbols-outlined text-accent text-sm mt-1">subdirectory_arrow_right</span>
                        <p className="text-accent text-lg font-medium">{entry.translatedText}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Participants */}
        <div className="w-[30%] bg-chrome flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Participants</h2>
            <span className="text-sm text-muted bg-surface px-2 py-1 rounded-full">
              {participants.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm shadow-sm relative">
                    {getInitials(p.name)}
                    {activeSpeaker === p.name && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-chrome rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium text-ink">{p.name}</span>
                </div>
                
                {activeSpeaker === p.name && (
                  <span className="material-symbols-outlined text-green-500 animate-pulse text-sm">
                    volume_up
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-chrome shadow-pop">
        <div className="flex items-center space-x-8">
          {/* Hearing Language */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-muted">
              <span className="material-symbols-outlined mr-2">headphones</span>
              <span className="text-sm font-medium">Hearing</span>
            </div>
            <select
              value={hearingLanguage}
              onChange={(e) => handleLanguageChange('hearing', e.target.value)}
              className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent text-ink"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Speaking Language */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-muted">
              <span className="material-symbols-outlined mr-2">mic</span>
              <span className="text-sm font-medium">Speaking</span>
            </div>
            <select
              value={speakingLanguage}
              onChange={(e) => handleLanguageChange('speaking', e.target.value)}
              className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent text-ink"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
