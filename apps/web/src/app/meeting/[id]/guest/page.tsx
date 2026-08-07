'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { MeetingRoom } from '@/components/meeting/MeetingRoom';

interface GuestMeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function GuestMeetingPage({ params }: GuestMeetingPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const meetingId = resolvedParams.id;

  const [guestName, setGuestName] = useState('');
  const [spokenLang, setSpokenLang] = useState('en');
  const [subtitleLang, setSubtitleLang] = useState('en');
  const [audioLang, setAudioLang] = useState('none');
  const [chatLang, setChatLang] = useState('en');

  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    token: string;
    status: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!guestName.trim()) return;

    setIsConnecting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = new URL(`${apiUrl}/api/meetings/token`);
      url.searchParams.append('roomName', meetingId);
      url.searchParams.append('username', guestName.trim());
      url.searchParams.append('spokenLang', spokenLang);
      url.searchParams.append('subtitleLang', subtitleLang);
      url.searchParams.append('audioLang', audioLang);
      url.searchParams.append('chatLang', chatLang);

      const res = await fetch(url.toString(), {
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch meeting token (${res.status})`);
      }

      const data = await res.json();
      setConnectionDetails({
        serverUrl: data.serverUrl,
        token: data.token,
        status: data.status || 'active',
      });
    } catch (err: any) {
      console.error('Guest connection error:', err);
      setError(err.message || 'Unable to join meeting as guest.');
    } finally {
      setIsConnecting(false);
    }
  };

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
          onLeave={() => router.push('/')}
          onRejoin={() => {
            setConnectionDetails(null);
            handleJoin();
          }}
          initialStatus={connectionDetails.status}
        />
      </LiveKitRoom>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center px-6 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-6 w-6 text-white">
            <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-lg font-bold tracking-tight">Relay</span>
          <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-1">
            Guest Portal
          </span>
        </div>
      </header>

      {/* Join Screen */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-[#111116] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <span className="material-symbols-outlined text-[28px]">group</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Join as Guest</h1>
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
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase tracking-wider font-bold text-white/50">
                Your Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Enter your name to join"
                required
              />
            </div>

            {/* Language Preferences Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
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

            <button
              type="submit"
              disabled={isConnecting || !guestName.trim()}
              className="w-full py-3.5 bg-white text-black rounded-2xl text-sm font-bold hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Join Meeting</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-white/30">
            Guest access powered by Relay Real-Time Audio & Subtitle Translation
          </p>
        </div>
      </main>
    </div>
  );
}
