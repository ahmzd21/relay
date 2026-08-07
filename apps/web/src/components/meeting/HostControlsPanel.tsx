'use client';

import React, { useState, useMemo } from 'react';
import { useRoomContext, useParticipants } from '@livekit/components-react';
import { ParticipantKind } from 'livekit-client';

interface HostControlsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  hostKey: string;
}

export default function HostControlsPanel({ isOpen, onClose, meetingId, hostKey }: HostControlsPanelProps) {
  const room = useRoomContext();
  const allParticipants = useParticipants();

  const [revokedPerms, setRevokedPerms] = useState<Record<string, { mic?: boolean, cam?: boolean }>>({});
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Exclude the translation agent and ourselves — a host cannot moderate itself.
  const participants = useMemo(
    () =>
      allParticipants.filter(
        (p) =>
          p.kind !== ParticipantKind.AGENT &&
          !p.identity.startsWith('agent-') &&
          !p.identity.startsWith('translation') &&
          p.identity !== room.localParticipant?.identity,
      ),
    [allParticipants, room.localParticipant?.identity],
  );

  const waitingParticipants = participants.filter(p => {
    try {
      const meta = JSON.parse(p.metadata || '{}');
      return meta.status === 'waiting' && meta.role !== 'host';
    } catch(e) {
      return false;
    }
  });

  const activeParticipants = participants.filter(p => {
    try {
      const meta = JSON.parse(p.metadata || '{}');
      return meta.status !== 'waiting' && meta.role !== 'host';
    } catch(e) {
      return true;
    }
  });

  const sendHostCommand = (targetIdentity: string, command: string) => {
    const msg = JSON.stringify({ type: 'host-command', command });
    const data = new TextEncoder().encode(msg);
    const targetParticipant = room.remoteParticipants.get(targetIdentity);
    if (targetParticipant) {
      room.localParticipant.publishData(data, { 
        reliable: true, 
        destinationIdentities: [targetIdentity] 
      });
    }
  };

  const toggleMicPermission = (identity: string) => {
    const isRevoked = revokedPerms[identity]?.mic ?? false;
    if (isRevoked) {
      sendHostCommand(identity, 'grant-mic');
      setRevokedPerms(prev => ({ ...prev, [identity]: { ...prev[identity], mic: false } }));
    } else {
      sendHostCommand(identity, 'revoke-mic');
      setRevokedPerms(prev => ({ ...prev, [identity]: { ...prev[identity], mic: true } }));
    }
  };

  const toggleCamPermission = (identity: string) => {
    const isRevoked = revokedPerms[identity]?.cam ?? false;
    if (isRevoked) {
      sendHostCommand(identity, 'grant-camera');
      setRevokedPerms(prev => ({ ...prev, [identity]: { ...prev[identity], cam: false } }));
    } else {
      sendHostCommand(identity, 'revoke-camera');
      setRevokedPerms(prev => ({ ...prev, [identity]: { ...prev[identity], cam: true } }));
    }
  };

  const handleAction = async (action: string, targetIdentity?: string) => {
    if (action === 'mute-all') {
      activeParticipants.forEach(p => {
        setRevokedPerms(prev => ({ ...prev, [p.identity]: { ...prev[p.identity], mic: true } }));
      });
    }

    if (action === 'disable-video-all') {
      activeParticipants.forEach(p => {
        setRevokedPerms(prev => ({ ...prev, [p.identity]: { ...prev[p.identity], cam: true } }));
      });
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const body: any = { roomName: meetingId, action, hostKey };
      if (targetIdentity) body.targetParticipantId = targetIdentity;

      const res = await fetch(`${baseUrl}/api/meetings/control`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        console.error('Action failed:', await res.text());
      }
    } catch(e) {
      console.error('Error during action:', e);
    }
  };

  const handleApproveAll = () => {
    waitingParticipants.forEach(p => handleAction('approve-participant', p.identity));
  };

  const handleEndMeeting = async () => {
    await handleAction('end-meeting');
    setShowEndConfirm(false);
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
  };

  return (
    <div 
      className={`fixed top-0 right-0 h-full w-[340px] bg-[#070709] border-l border-white/10 z-50 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">Host Controls</h2>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Meeting ID */}
        <div className="bg-[#111116] p-3 rounded-lg border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50 mb-1">Meeting ID</div>
            <div className="font-mono text-sm">{meetingId}</div>
          </div>
          <button onClick={copyMeetingId} className="p-2 hover:bg-white/10 rounded transition" title="Copy Meeting ID">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
        </div>

        {/* Waiting Room */}
        {waitingParticipants.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">Waiting Room ({waitingParticipants.length})</h3>
              <button 
                onClick={handleApproveAll} 
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Admit All
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {waitingParticipants.map(p => (
                <div key={p.identity} className="bg-[#111116] p-3 rounded-lg flex items-center justify-between border border-white/5">
                  <span className="text-sm font-medium truncate pr-2">{p.name || p.identity}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAction('approve-participant', p.identity)}
                      className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition"
                      title="Admit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleAction('decline-participant', p.identity)}
                      className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition"
                      title="Decline"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Actions */}
        <div>
          <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-3">Global Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleAction('mute-all')}
              className="bg-[#111116] hover:bg-white/10 border border-white/5 p-2 rounded-lg text-sm transition flex flex-col items-center justify-center gap-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              Mute All
            </button>
            <button 
              onClick={() => handleAction('disable-video-all')}
              className="bg-[#111116] hover:bg-white/10 border border-white/5 p-2 rounded-lg text-sm transition flex flex-col items-center justify-center gap-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M21 17.16V4a2 2 0 0 0-2-2H8.84"></path>
                <path d="M16.73 12.73l.27.27V9l5-4v10.5M3 13V5a2 2 0 0 1 2-2h1.17M3 13v6a2 2 0 0 0 2 2h13.17"></path>
              </svg>
              Disable Cams
            </button>
          </div>
        </div>

        {/* Active Participants */}
        <div>
          <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-3">Participants ({activeParticipants.length})</h3>
          <div className="flex flex-col gap-2">
            {activeParticipants.map(p => {
              const isMicRevoked = revokedPerms[p.identity]?.mic ?? false;
              const isCamRevoked = revokedPerms[p.identity]?.cam ?? false;

              return (
                <div key={p.identity} className="bg-[#111116] p-3 rounded-lg flex items-center justify-between border border-white/5">
                  <span className="text-sm font-medium truncate pr-2">{p.name || p.identity}</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleMicPermission(p.identity)}
                      className={`p-1.5 rounded transition ${isMicRevoked ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'}`}
                      title={isMicRevoked ? "Grant Mic" : "Revoke Mic"}
                    >
                      {isMicRevoked ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      )}
                    </button>
                    <button 
                      onClick={() => toggleCamPermission(p.identity)}
                      className={`p-1.5 rounded transition ${isCamRevoked ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'}`}
                      title={isCamRevoked ? "Grant Camera" : "Revoke Camera"}
                    >
                      {isCamRevoked ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                          <path d="M21 17.16V4a2 2 0 0 0-2-2H8.84"></path>
                          <path d="M16.73 12.73l.27.27V9l5-4v10.5M3 13V5a2 2 0 0 1 2-2h1.17M3 13v6a2 2 0 0 0 2 2h13.17"></path>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="23 7 16 12 23 17 23 7"></polygon>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleAction('kick', p.identity)}
                      className="p-1.5 bg-white/5 text-white/70 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                      title="Kick"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="18" y1="8" x2="23" y2="13"></line>
                        <line x1="23" y1="8" x2="18" y2="13"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
            
            {activeParticipants.length === 0 && (
              <div className="text-center p-4 text-white/40 text-sm">
                No active participants
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 mt-auto">
        {showEndConfirm ? (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            <p className="text-sm text-red-200 mb-3 text-center">Are you sure you want to end this meeting for everyone?</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded text-sm transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleEndMeeting}
                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
              >
                End Meeting
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowEndConfirm(true)}
            className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition"
          >
            End Meeting for All
          </button>
        )}
      </div>
    </div>
  );
}
