'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { MeetingRoom } from '@/components/meeting/MeetingRoom';
import { useAuth } from '@/contexts/AuthContext';

interface MeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function MeetingPage({ params }: MeetingPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const meetingId = resolvedParams.id;

  // "?create=1" is set only by the Start Meeting action. It marks this user as the
  // one starting the meeting, so arriving first at a shared link never grants host.
  const searchParams = useSearchParams();
  const isStartingMeeting = searchParams.get('create') === '1';

  // Pre-join configuration state
  const [name, setName] = useState(user?.fullName || '');
  const [spokenLang, setSpokenLang] = useState('en');
  const [subtitleLang, setSubtitleLang] = useState('en');
  const [audioLang, setAudioLang] = useState('none');
  const [chatLang, setChatLang] = useState('en');

  // Host configuration - stored in localStorage to persist across reloads
  const [isHostMode, setIsHostMode] = useState(false);
  const [enableWaitingRoom, setEnableWaitingRoom] = useState(false);
  const [hostKey, setHostKey] = useState<string>('');
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  // Check if this user is creating a new meeting or joining existing
  useEffect(() => {
    const checkMeetingStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/meetings/check/${meetingId}`, {
          credentials: 'include',
        });

        if (res.status === 404) {
          // Room not started yet. Only show host setup to someone who actually
          // started this meeting (?create=1). Everyone else is a participant who
          // arrived early — do NOT mint a host key here, since the server has not
          // granted host and a stale key would linger in localStorage forever.
          setIsCreatingMeeting(isStartingMeeting);
          setIsHostMode(isStartingMeeting);

          if (isStartingMeeting) {
            const storageKey = `meeting_host_${meetingId}`;
            let storedKey = localStorage.getItem(storageKey);
            if (!storedKey) {
              storedKey = Math.random().toString(36).substring(2, 10);
              localStorage.setItem(storageKey, storedKey);
            }
            setHostKey(storedKey);
          }
        } else {
          // Meeting exists - joining as participant
          setIsCreatingMeeting(false);
          setIsHostMode(false);
        }
      } catch (err) {
        console.error('Failed to check meeting status:', err);
        // Default to participant mode on error
        setIsCreatingMeeting(false);
        setIsHostMode(false);
      }
    };

    checkMeetingStatus();
  }, [meetingId, isStartingMeeting]);

  // Connection details state
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    token: string;
    isHost: boolean;
    hostKey: string;
    status: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync user's name when auth loads
  useEffect(() => {
    if (user?.fullName && !name) {
      setName(user.fullName);
    }
  }, [user?.fullName, name]);

  const handleJoin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;

    setIsConnecting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = new URL(`${apiUrl}/api/meetings/token`);
      url.searchParams.append('roomName', meetingId);
      url.searchParams.append('username', name.trim());
      url.searchParams.append('spokenLang', spokenLang);
      url.searchParams.append('subtitleLang', subtitleLang);
      url.searchParams.append('audioLang', audioLang);
      url.searchParams.append('chatLang', chatLang);

      // Always present a stored host key if we have one for this meeting — that is
      // how a host who reloads the page reclaims host status. The server decides.
      const storedKey = localStorage.getItem(`meeting_host_${meetingId}`);
      const keyToSend = hostKey || storedKey || '';

      if (isCreatingMeeting || keyToSend) {
        url.searchParams.append('isHost', 'true');
        if (keyToSend) url.searchParams.append('hostKey', keyToSend);
        // Only the explicit "start meeting" flow may create the room and claim
        // host. Arriving first at an invite link must not be enough.
        if (isStartingMeeting) {
          url.searchParams.append('create', 'true');
          if (enableWaitingRoom) url.searchParams.append('waitingRoom', 'true');
        }
      }

      const res = await fetch(url.toString(), {
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch meeting token (${res.status})`);
      }

      const data = await res.json();

      // The server is authoritative about host status. Persist the key it hands
      // back so a reload keeps us as host.
      if (data.isHost && data.hostKey) {
        localStorage.setItem(`meeting_host_${meetingId}`, data.hostKey);
      }

      setConnectionDetails({
        serverUrl: data.serverUrl,
        token: data.token,
        isHost: !!data.isHost,
        hostKey: data.hostKey || '',
        status: data.status || 'active',
      });
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Unable to join meeting. Please ensure the backend server is running.');
    } finally {
      setIsConnecting(false);
    }
  };

  // 1. LiveKit Active Room View
  if (connectionDetails) {
    const isWaiting = connectionDetails.status === 'waiting';
    return (
      <LiveKitRoom
        token={connectionDetails.token}
        serverUrl={connectionDetails.serverUrl}
        connect={true}
        // Do not open the camera/mic while stuck in the waiting room.
        video={!isWaiting}
        audio={!isWaiting}
        data-lk-theme="default"
        style={{ height: '100vh', width: '100vw' }}
      >
        <MeetingRoom
          meetingId={meetingId}
          onLeave={() => router.push('/dashboard/native-meeting')}
          onRejoin={() => {
            // Drop the dead connection and request a fresh token for the same room.
            setConnectionDetails(null);
            handleJoin();
          }}
          isHost={connectionDetails.isHost}
          hostKey={connectionDetails.hostKey}
          initialStatus={connectionDetails.status}
        />
      </LiveKitRoom>
    );
  }

  // 2. Pre-Join Screen
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-6 w-6 text-white">
            <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-lg font-bold tracking-tight">Relay</span>
        </div>

        <button
          onClick={() => router.push('/dashboard/native-meeting')}
          className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Dashboard</span>
        </button>
      </header>

      {/* Main Pre-Join Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-[#111116] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <span className="material-symbols-outlined text-[28px]">videocam</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Join Meeting</h1>
            <p className="text-white/40 text-xs">
              Room ID: <span className="text-white font-mono font-bold">{meetingId}</span>
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-5">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase tracking-wider font-bold text-white/50">
                Your Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {/* Host Options — only the person starting the meeting configures it */}
            {isCreatingMeeting && (
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-rose-400">
                  <span className="material-symbols-outlined text-[13px]">shield_person</span>
                  <span>You are starting this meeting as host</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-white/40">hourglass_top</span>
                    Enable Waiting Room
                  </label>
                  <button
                    type="button"
                    onClick={() => setEnableWaitingRoom(!enableWaitingRoom)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${enableWaitingRoom ? 'bg-rose-500' : 'bg-white/20'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all`} style={{ left: enableWaitingRoom ? '22px' : '2px' }} />
                  </button>
                </div>
              </div>
            )}

            {/* Language Preferences Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              {/* Spoken Language */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-white/40">mic</span>
                  Speaking Language
                </label>
                <select
                  value={spokenLang}
                  onChange={(e) => setSpokenLang(e.target.value)}
                  className="w-full bg-[#16161c] border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs focus:outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="ar">Arabic</option>
                  <option value="ur">Urdu</option>
                </select>
              </div>

              {/* Subtitle Language */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-white/40">subtitles</span>
                  Live Subtitles
                </label>
                <select
                  value={subtitleLang}
                  onChange={(e) => setSubtitleLang(e.target.value)}
                  className="w-full bg-[#16161c] border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs focus:outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="none">Off (No Subtitles)</option>
                  <option value="en">English Subtitles</option>
                  <option value="es">Spanish Subtitles</option>
                  <option value="de">German Subtitles</option>
                  <option value="ar">Arabic Subtitles</option>
                  <option value="ur">Urdu Subtitles</option>
                </select>
              </div>

              {/* Audio Dubbing Language */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-white/40">headphones</span>
                  AI Voice Dubbing
                </label>
                <select
                  value={audioLang}
                  onChange={(e) => setAudioLang(e.target.value)}
                  className="w-full bg-[#16161c] border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs focus:outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="none">Off (Original Voice)</option>
                  <option value="en">Dub in English</option>
                  <option value="es">Dub in Spanish</option>
                  <option value="de">Dub in German</option>
                  <option value="ar">Dub in Arabic</option>
                  <option value="ur">Dub in Urdu</option>
                </select>
              </div>

              {/* Chat Translation */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-white/50 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-white/40">chat</span>
                  Chat Language
                </label>
                <select
                  value={chatLang}
                  onChange={(e) => setChatLang(e.target.value)}
                  className="w-full bg-[#16161c] border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs focus:outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="ar">Arabic</option>
                  <option value="ur">Urdu</option>
                </select>
              </div>
            </div>

            {/* Join Submit Button */}
            <button
              type="submit"
              disabled={isConnecting || !name.trim()}
              className="w-full py-3.5 bg-white text-black hover:bg-white/90 disabled:opacity-50 rounded-2xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isConnecting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to LiveKit...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Enter Meeting</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-white/30">
            Powered by Relay Real-Time Multilingual WebRTC Infrastructure
          </p>
        </div>
      </main>
    </div>
  );
}
