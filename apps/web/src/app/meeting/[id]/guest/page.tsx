'use client';

import React, { useState, useRef, useEffect } from 'react';

interface GuestMeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function GuestMeetingPage({ params }: GuestMeetingPageProps) {
  const [meetingId, setMeetingId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    params.then(p => setMeetingId(p.id));
  }, [params]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setIsJoined(true);
  };

  if (!meetingId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white animate-pulse">Loading meeting...</div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-helvetica">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center px-6">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-6 w-6 text-white">
              <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-lg font-bold tracking-tight">Relay</span>
          </div>
        </header>

        {/* Join Screen */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-white text-[32px]">group</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Join Meeting</h1>
              <p className="text-white/50 text-sm">
                You&apos;ve been invited to meeting <span className="text-white font-mono font-bold">{meetingId}</span>
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-white/50 ml-4">Your Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="Enter your name to join"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-white text-black rounded-full text-sm font-bold hover:bg-white/90 transition-colors"
              >
                Join Meeting
              </button>
            </form>

            <p className="text-center text-xs text-white/30">
              Guest access — Translation features are available for workspace members only.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-helvetica">
      {/* Meeting Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold">Meeting {meetingId}</span>
        </div>
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          <span>00:00</span>
        </div>
      </header>

      {/* Meeting Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Participant Grid Placeholder */}
        <div className="w-full max-w-4xl aspect-video bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-lg">
              {guestName.substring(0, 2).toUpperCase()}
            </div>
            <p className="text-white/50 text-sm">{guestName}</p>
          </div>
        </div>

        {/* No Translation Banner */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-white/40 text-[18px]">translate</span>
          <span className="text-white/40 text-xs font-medium">AI Translation requires a workspace account</span>
        </div>
      </main>

      {/* Meeting Controls */}
      <footer className="h-24 border-t border-white/10 flex items-center justify-center gap-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMuted ? 'mic_off' : 'mic'}
          </span>
        </button>

        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {isVideoOff ? 'videocam_off' : 'videocam'}
          </span>
        </button>

        <button className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
          <span className="material-symbols-outlined text-[24px]">call_end</span>
        </button>
      </footer>
    </div>
  );
}
