'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  useRoomContext,
  useLocalParticipant,
  useParticipants,
  useTracks,
  VideoTrack,
  useChat,
} from '@livekit/components-react';
import { Track, Participant, RoomEvent, ParticipantEvent } from 'livekit-client';
import { CustomAudioRenderer } from './CustomAudioRenderer';
import { CustomSubtitles } from './CustomSubtitles';
import HostControlsPanel from './HostControlsPanel';
import { Whiteboard } from './Whiteboard';
import { AgendaWidget } from './AgendaWidget';
import { ReactionsOverlay, ReactionsControl } from './ReactionsOverlay';
import { KeyboardShortcuts } from './KeyboardShortcuts';

interface MeetingRoomProps {
  meetingId: string;
  onLeave: () => void;
  isHost?: boolean;
  hostKey?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'tr', name: 'Turkish (Türkçe)' },
  { code: 'ur', name: 'Urdu (اردو)' },
];

export function MeetingRoom({ meetingId, onLeave, isHost = false, hostKey = '' }: MeetingRoomProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const { chatMessages, send: sendChatMessage } = useChat();

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // New feature state
  const [isHostPanelOpen, setIsHostPanelOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [audioLocked, setAudioLocked] = useState(false);
  const [videoLocked, setVideoLocked] = useState(false);
  const [localStatus, setLocalStatus] = useState<string>('active');
  const [kicked, setKicked] = useState(false);

  // In-meeting language preferences
  const [spokenLang, setSpokenLang] = useState('en');
  const [subtitleLang, setSubtitleLang] = useState('en');
  const [audioLang, setAudioLang] = useState('none');

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize preferences and status from localParticipant metadata
  useEffect(() => {
    if (!localParticipant?.metadata) return;
    try {
      const meta = JSON.parse(localParticipant.metadata);
      if (meta.preferences?.spoken) setSpokenLang(meta.preferences.spoken);
      if (meta.preferences?.subtitle) setSubtitleLang(meta.preferences.subtitle);
      if (meta.preferences?.audio) setAudioLang(meta.preferences.audio);
      if (typeof meta.isHandRaised === 'boolean') setIsHandRaised(meta.isHandRaised);
      if (meta.status) setLocalStatus(meta.status);
      if (typeof meta.audioLocked === 'boolean') setAudioLocked(meta.audioLocked);
      if (typeof meta.videoLocked === 'boolean') setVideoLocked(meta.videoLocked);
    } catch {}
  }, [localParticipant?.metadata]);

  // Listen for host permission commands via data messages
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === 'host-command') {
          if (msg.command === 'revoke-mic') {
            localParticipant?.setMicrophoneEnabled(false);
            setAudioLocked(true);
          } else if (msg.command === 'grant-mic') {
            setAudioLocked(false);
          } else if (msg.command === 'revoke-camera') {
            localParticipant?.setCameraEnabled(false);
            setVideoLocked(true);
          } else if (msg.command === 'grant-camera') {
            setVideoLocked(false);
          }
        }
      } catch {}
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room, localParticipant]);

  // Enforce locks: prevent re-enabling locked devices
  useEffect(() => {
    if (!localParticipant) return;
    const enforcer = () => {
      if (audioLocked && localParticipant.isMicrophoneEnabled) {
        localParticipant.setMicrophoneEnabled(false);
      }
      if (videoLocked && localParticipant.isCameraEnabled) {
        localParticipant.setCameraEnabled(false);
      }
    };
    localParticipant.on(ParticipantEvent.TrackPublished, enforcer);
    localParticipant.on(ParticipantEvent.TrackUnmuted, enforcer);
    const interval = setInterval(enforcer, 500);
    return () => {
      localParticipant.off(ParticipantEvent.TrackPublished, enforcer);
      localParticipant.off(ParticipantEvent.TrackUnmuted, enforcer);
      clearInterval(interval);
    };
  }, [localParticipant, audioLocked, videoLocked]);

  // Listen for disconnect (kicked/declined)
  useEffect(() => {
    const handleDisconnect = (reason: any) => {
      try {
        const meta = JSON.parse(localParticipant?.metadata || '{}');
        if (meta.status === 'waiting') {
          setKicked(true);
          return;
        }
      } catch {}
      onLeave();
    };
    room.on(RoomEvent.Disconnected, handleDisconnect);
    return () => { room.off(RoomEvent.Disconnected, handleDisconnect); };
  }, [room, localParticipant, onLeave]);

  // 1. Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // 2. Track mic and camera states
  useEffect(() => {
    if (!localParticipant) return;
    setIsMicMuted(!localParticipant.isMicrophoneEnabled);
    setIsVideoMuted(!localParticipant.isCameraEnabled);
    setIsScreenSharing(localParticipant.isScreenShareEnabled);
  }, [localParticipant?.isMicrophoneEnabled, localParticipant?.isCameraEnabled, localParticipant?.isScreenShareEnabled]);

  const toggleMic = async () => {
    if (!localParticipant || audioLocked) return;
    const newState = !localParticipant.isMicrophoneEnabled;
    await localParticipant.setMicrophoneEnabled(newState);
    setIsMicMuted(!newState);
  };

  const toggleVideo = async () => {
    if (!localParticipant || videoLocked) return;
    const newState = !localParticipant.isCameraEnabled;
    await localParticipant.setCameraEnabled(newState);
    setIsVideoMuted(!newState);
  };

  const toggleScreenShare = async () => {
    if (!localParticipant) return;
    const newState = !localParticipant.isScreenShareEnabled;
    await localParticipant.setScreenShareEnabled(newState);
    setIsScreenSharing(newState);
  };

  // 3. Toggle Hand Raise
  const toggleHandRaise = async () => {
    if (!localParticipant) return;
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);

    try {
      let currentMeta = {};
      try {
        if (localParticipant.metadata) currentMeta = JSON.parse(localParticipant.metadata);
      } catch {}

      const updatedMeta = {
        ...currentMeta,
        isHandRaised: nextHand,
      };

      await localParticipant.setMetadata(JSON.stringify(updatedMeta));
    } catch (e) {
      console.error('Error updating hand raise state:', e);
    }
  };

  // 4. Update Language Preferences
  const handleSaveLanguageSettings = async () => {
    if (!localParticipant) return;
    try {
      let currentMeta = {};
      try {
        if (localParticipant.metadata) currentMeta = JSON.parse(localParticipant.metadata);
      } catch {}

      const updatedMeta = {
        ...currentMeta,
        preferences: {
          spoken: spokenLang,
          subtitle: subtitleLang,
          audio: audioLang,
        },
      };

      await localParticipant.setMetadata(JSON.stringify(updatedMeta));
      setIsSettingsOpen(false);
    } catch (e) {
      console.error('Error updating language preferences:', e);
    }
  };

  // 5. Chat Unread Count
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.from?.identity !== localParticipant?.identity && !isChatOpen) {
        setUnreadCount((c) => c + 1);
      }
    }
  }, [chatMessages.length, isChatOpen, localParticipant?.identity]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadCount(0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const handleCopyLink = () => {
    const guestUrl = `${window.location.origin}/meeting/${meetingId}/guest`;
    navigator.clipboard.writeText(guestUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  // Count waiting participants for host badge
  const waitingCount = useMemo(() => {
    return participants.filter(p => {
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.status === 'waiting' && meta.role !== 'host';
      } catch { return false; }
    }).length;
  }, [participants]);

  // Kicked/Declined Screen
  if (kicked) {
    return (
      <div className="h-screen w-screen bg-[#070709] flex items-center justify-center">
        <div className="text-center p-8 bg-[#111116] border border-white/10 rounded-3xl max-w-md w-[90%] shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-rose-400 text-[32px]">block</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/50 text-sm mb-6">Your request to join this meeting was declined by the host.</p>
          <button onClick={onLeave} className="w-full py-3 bg-white text-black font-bold rounded-2xl text-sm hover:bg-white/90 transition-colors">Go Back</button>
        </div>
      </div>
    );
  }

  // Waiting Room Screen
  if (localStatus === 'waiting') {
    return (
      <div className="h-screen w-screen bg-[#070709] flex items-center justify-center">
        <div className="text-center p-8 bg-[#111116] border border-white/10 rounded-3xl max-w-md w-[90%] shadow-2xl">
          <div className="w-16 h-16 border-4 border-white/10 border-t-rose-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Waiting Room</h2>
          <p className="text-white/50 text-sm mb-6">Please wait, the host will review your request to join shortly.</p>
          <button onClick={() => room.disconnect()} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-sm transition-colors">Leave Waiting Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen bg-[#070709] text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Real-time Dubbing Audio Renderer & Subtitles */}
      <CustomAudioRenderer />
      <CustomSubtitles />
      <ReactionsOverlay />
      <AgendaWidget />
      <KeyboardShortcuts
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onToggleChat={() => { setIsChatOpen(p => !p); if (!isChatOpen) setUnreadCount(0); }}
        onToggleWhiteboard={() => setIsWhiteboardOpen(p => !p)}
        onToggleHandRaise={toggleHandRaise}
        audioLocked={audioLocked}
        videoLocked={videoLocked}
      />
      {isWhiteboardOpen && <Whiteboard onClose={() => setIsWhiteboardOpen(false)} />}
      {isHost && (
        <HostControlsPanel
          isOpen={isHostPanelOpen}
          onClose={() => setIsHostPanelOpen(false)}
          meetingId={meetingId}
          hostKey={hostKey}
        />
      )}

      {/* Top Header */}
      <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="font-bold text-sm tracking-tight text-white/90">
              Meeting <span className="font-mono text-white">{meetingId}</span>
            </span>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">
              {copiedLink ? 'check' : 'content_copy'}
            </span>
            <span>{copiedLink ? 'Copied' : 'Invite Link'}</span>
          </button>
        </div>

        {/* Center: Live Timer */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white/70">
          <span className="material-symbols-outlined text-[14px] text-white/40">schedule</span>
          <span>{formattedTime}</span>
        </div>

        {/* Right Header: Language Settings, AI Translation & Participants */}
        <div className="flex items-center gap-3">
          {/* Language / Translation Settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium transition-colors"
            title="Live Translation & Dubbing Settings"
          >
            <span className="material-symbols-outlined text-[16px]">translate</span>
            <span className="hidden sm:inline">AI Translation ({spokenLang.toUpperCase()})</span>
          </button>

          {/* Host Controls toggle (only for hosts) */}
          {isHost && (
            <button
              onClick={() => setIsHostPanelOpen(p => !p)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-medium transition-colors ${
                isHostPanelOpen
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
              }`}
              title="Host Controls"
            >
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
              <span className="hidden sm:inline">Host</span>
              {waitingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {waitingCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/80 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>{participants.length}</span>
          </button>
        </div>
      </header>

      {/* Main Conference Layout */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Video Stage */}
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center overflow-hidden">
          {screenTracks.length > 0 ? (
            <div className="w-full h-full flex flex-col lg:flex-row gap-4">
              <div className="flex-1 bg-black/60 rounded-3xl border border-white/10 overflow-hidden relative flex items-center justify-center">
                <VideoTrack trackRef={screenTracks[0]} className="w-full h-full object-contain" />
              </div>
              <div className="lg:w-72 h-full flex lg:flex-col gap-3 overflow-auto">
                {participants.map((p) => (
                  <ParticipantTile key={p.identity} participant={p} compact />
                ))}
              </div>
            </div>
          ) : (
            <div
              className={`w-full h-full grid gap-4 place-items-center ${
                participants.length === 1
                  ? 'grid-cols-1 max-w-4xl max-h-[80vh]'
                  : participants.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-6xl max-h-[80vh]'
                  : participants.length <= 4
                  ? 'grid-cols-2 max-w-6xl max-h-[85vh]'
                  : 'grid-cols-2 md:grid-cols-3 max-w-7xl max-h-[90vh]'
              }`}
            >
              {participants.map((p) => (
                <ParticipantTile key={p.identity} participant={p} />
              ))}
            </div>
          )}
        </main>

        {/* Right Slide-in Panel: Chat */}
        {isChatOpen && (
          <aside className="w-80 md:w-96 border-l border-white/10 bg-black/80 backdrop-blur-xl flex flex-col z-40 transition-all duration-300">
            <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white/70 text-[18px]">chat</span>
                <span className="font-bold text-sm">Meeting Chat</span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/30 text-xs gap-2">
                  <span className="material-symbols-outlined text-[32px] text-white/20">forum</span>
                  <span>No messages yet. Send a message to start chatting!</span>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.from?.identity === localParticipant?.identity;
                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-white/40">
                          {isMe ? 'You' : msg.from?.name || msg.from?.identity}
                        </span>
                        <span className="text-[9px] text-white/30">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                          isMe
                            ? 'bg-rose-500 text-white rounded-br-none shadow-lg'
                            : 'bg-white/10 text-white/90 border border-white/10 rounded-bl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:opacity-30 disabled:hover:bg-white transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </aside>
        )}

        {/* Right Slide-in Panel: Participants & Host Controls */}
        {isParticipantsOpen && (
          <aside className="w-80 md:w-96 border-l border-white/10 bg-black/80 backdrop-blur-xl flex flex-col z-40 transition-all duration-300">
            <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white/70 text-[18px]">group</span>
                <span className="font-bold text-sm">Participants ({participants.length})</span>
              </div>
              <button
                onClick={() => setIsParticipantsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {participants.map((p) => {
                let meta: any = { isHost: false, preferences: { spoken: 'en' }, isHandRaised: false };
                try { if (p.metadata) meta = JSON.parse(p.metadata); } catch {}
                const isMe = p.identity === localParticipant?.identity;

                return (
                  <div
                    key={p.identity}
                    className={`p-3 border rounded-2xl flex items-center justify-between transition-all ${
                      meta.isHandRaised
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs relative">
                        {(p.name || p.identity).substring(0, 2).toUpperCase()}
                        {meta.isHandRaised && (
                          <span className="absolute -top-1 -right-1 text-[12px]">✋</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-white">{p.name || p.identity}</span>
                          {isMe && <span className="text-[10px] text-white/40">(You)</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {meta.isHandRaised && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                              <span>✋</span> Hand Raised
                            </span>
                          )}
                          <span className="text-[10px] text-white/40 uppercase">
                            Lang: {meta.preferences?.spoken || 'EN'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-[16px] ${p.isMicrophoneEnabled ? 'text-white/60' : 'text-rose-400'}`}>
                        {p.isMicrophoneEnabled ? 'mic' : 'mic_off'}
                      </span>
                      <span className={`material-symbols-outlined text-[16px] ${p.isCameraEnabled ? 'text-white/60' : 'text-rose-400'}`}>
                        {p.isCameraEnabled ? 'videocam' : 'videocam_off'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Language / Translation Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111116] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">translate</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live Translation Settings</h3>
                  <p className="text-xs text-white/40">Configure speech recognition, subtitles & audio dubbing</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Spoken Language */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Your Spoken Language (What you speak)
                </label>
                <select
                  value={spokenLang}
                  onChange={(e) => setSpokenLang(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#111116] text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtitle Language */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Live Subtitles Language
                </label>
                <select
                  value={subtitleLang}
                  onChange={(e) => setSubtitleLang(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                >
                  <option value="none" className="bg-[#111116] text-white">Off (No Subtitles)</option>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#111116] text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Voice Dubbing Language */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  AI Voice Dubbing (Hear others translated into)
                </label>
                <select
                  value={audioLang}
                  onChange={(e) => setAudioLang(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                >
                  <option value="none" className="bg-[#111116] text-white">Off (Original Voice Only)</option>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#111116] text-white">
                      {l.name} (ElevenLabs Dubbing)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLanguageSettings}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <footer className="h-20 px-6 border-t border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-between z-30 shrink-0">
        {/* Left Info */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-white/50">
          <span className="material-symbols-outlined text-[16px] text-white/40">lock</span>
          <span>End-to-End Encrypted</span>
        </div>

        {/* Center: Main Controls */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          {/* Microphone */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              audioLocked
                ? 'bg-rose-500/30 text-rose-400 border-2 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-not-allowed'
              : isMicMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={audioLocked ? 'Mic Locked by Host' : isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            <span className="material-symbols-outlined text-[22px]">
              {audioLocked ? 'mic_off' : isMicMuted ? 'mic_off' : 'mic'}
            </span>
            {audioLocked && <span className="absolute -bottom-0.5 -right-0.5 material-symbols-outlined text-[12px] text-rose-400">lock</span>}
          </button>

          {/* Camera */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative ${
              videoLocked
                ? 'bg-rose-500/30 text-rose-400 border-2 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-not-allowed'
              : isVideoMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={videoLocked ? 'Camera Locked by Host' : isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            <span className="material-symbols-outlined text-[22px]">
              {videoLocked ? 'videocam_off' : isVideoMuted ? 'videocam_off' : 'videocam'}
            </span>
            {videoLocked && <span className="absolute -bottom-0.5 -right-0.5 material-symbols-outlined text-[12px] text-rose-400">lock</span>}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <span className="material-symbols-outlined text-[22px]">present_to_all</span>
          </button>

          {/* Raise Hand Button */}
          <button
            onClick={toggleHandRaise}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all text-xl ${
              isHandRaised
                ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            <span>✋</span>
          </button>

          {/* Chat Toggle with Notification Badge */}
          <button
            onClick={handleOpenChat}
            className={`w-12 h-12 rounded-full flex items-center justify-center relative transition-all ${
              isChatOpen
                ? 'bg-white text-black font-bold'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title="Chat"
          >
            <span className="material-symbols-outlined text-[22px]">chat</span>
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Whiteboard Toggle */}
          <button
            onClick={() => setIsWhiteboardOpen(p => !p)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isWhiteboardOpen
                ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isWhiteboardOpen ? 'Close Whiteboard' : 'Open Whiteboard'}
          >
            <span className="material-symbols-outlined text-[22px]">draw</span>
          </button>

          {/* Reactions */}
          <ReactionsControl />

          {/* End Call */}
          <button
            onClick={onLeave}
            className="px-6 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all ml-2"
          >
            <span className="material-symbols-outlined text-[20px]">call_end</span>
            <span>Leave</span>
          </button>
        </div>

        {/* Right side spacer */}
        <div className="hidden sm:block w-36" />
      </footer>
    </div>
  );
}

/**
 * Individual Participant Video/Avatar Tile with Active Speaker Glow & Hand Raise Indicator
 */
function ParticipantTile({ participant, compact = false }: { participant: Participant; compact?: boolean }) {
  const cameraPub = participant.getTrackPublication(Track.Source.Camera);
  const isVideoEnabled = cameraPub && cameraPub.isSubscribed && !cameraPub.isMuted && cameraPub.track;
  const isSpeaking = participant.isSpeaking;

  let isHandRaised = false;
  try {
    if (participant.metadata) {
      const meta = JSON.parse(participant.metadata);
      isHandRaised = !!meta.isHandRaised;
    }
  } catch {}

  return (
    <div
      className={`relative w-full h-full bg-[#111116] border rounded-3xl overflow-hidden flex items-center justify-center transition-all duration-300 ${
        isHandRaised
          ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
          : isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
          : 'border-white/10'
      } ${compact ? 'aspect-video max-h-40' : 'aspect-video'}`}
    >
      {/* Video Stream */}
      {isVideoEnabled ? (
        <VideoTrack
          trackRef={{ participant, publication: cameraPub, source: Track.Source.Camera }}
          className="w-full h-full object-cover"
        />
      ) : (
        // Avatar Fallback
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl relative">
            {(participant.name || participant.identity).substring(0, 2).toUpperCase()}
          </div>
          <span className="text-white/60 text-sm font-medium">
            {participant.name || participant.identity}
          </span>
        </div>
      )}

      {/* Hand Raised Floating Badge */}
      {isHandRaised && (
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-20">
          <span>✋</span>
          <span>Hand Raised</span>
        </div>
      )}

      {/* Participant Name & Status Overlay */}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2 z-20">
        <span className="text-xs font-medium text-white/90">
          {participant.name || participant.identity}
        </span>
        <span className={`material-symbols-outlined text-[14px] ${participant.isMicrophoneEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
          {participant.isMicrophoneEnabled ? 'mic' : 'mic_off'}
        </span>
      </div>
    </div>
  );
}

