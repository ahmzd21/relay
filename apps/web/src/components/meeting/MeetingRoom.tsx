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
import {
  Track,
  Participant,
  ParticipantKind,
  RoomEvent,
  ParticipantEvent,
  DisconnectReason,
  LocalTrackPublication,
  type ScreenShareCaptureOptions,
} from 'livekit-client';
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
  onRejoin?: () => void;
  isHost?: boolean;
  hostKey?: string;
  initialStatus?: string;
  initialSpokenLang?: string;
  initialSubtitleLang?: string;
  initialAudioLang?: string;
  initialChatLang?: string;
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

/** A translation fetched after the message arrived, keyed by `${messageId}|${lang}`. */
type LateTranslation = { status: 'pending' | 'done' | 'failed'; text?: string };

/** Cap on late-translation attempts per message+language, so a provider outage cannot spin. */
const MAX_TRANSLATION_ATTEMPTS = 2;

const chatMessageKey = (msg: { id?: string; timestamp: number }) => msg.id || String(msg.timestamp);

/** Pull the original text and the translation table out of a message payload, whatever shape it is in. */
const readChatPayload = (messageRaw: string | any) => {
  let payload: any = null;
  try {
    payload = typeof messageRaw === 'string' ? JSON.parse(messageRaw) : messageRaw;
  } catch {
    // Plain-text message (legacy, or sent by another client).
  }
  if (!payload || typeof payload !== 'object') return null;

  // v2 keeps translations under `t`; older messages used flat language keys.
  const table = payload.t && typeof payload.t === 'object' ? payload.t : payload;
  const original = typeof payload.original === 'string' ? payload.original : '';
  return { payload, table, original };
};

export function MeetingRoom({ meetingId, onLeave, onRejoin, isHost = false, hostKey = '', initialStatus = 'active', initialSpokenLang = 'en', initialSubtitleLang = 'en', initialAudioLang = 'none', initialChatLang = 'en' }: MeetingRoomProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const isMicMuted = !localParticipant?.isMicrophoneEnabled;
  const isVideoMuted = !localParticipant?.isCameraEnabled;
  const isScreenSharing = localParticipant?.isScreenShareEnabled ?? false;
  const allParticipants = useParticipants();
  const { chatMessages, send: sendChatMessage } = useChat();
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  // The translation agent joins the room as a participant. It has no camera and
  // should never appear in the grid, the participant count, or host controls.
  // Participants sitting in the waiting room (status === 'waiting') must not appear
  // in the active room grid, count, or participants list until admitted.
  const participants = useMemo(
    () =>
      allParticipants.filter((p) => {
        if (
          p.kind === ParticipantKind.AGENT ||
          p.identity.startsWith('agent-') ||
          p.identity.startsWith('translation')
        ) {
          return false;
        }
        try {
          if (p.metadata) {
            const meta = JSON.parse(p.metadata);
            if (meta.status === 'waiting') {
              return false;
            }
          }
        } catch {}
        return true;
      }),
    [allParticipants],
  );

  // Single active screen track: prioritize remote/new sharer if one exists
  const activeScreenTrack = useMemo(() => {
    if (screenTracks.length === 0) return null;
    const remoteTrack = screenTracks.find(
      (t) => t.participant?.identity && t.participant.identity !== localParticipant?.identity,
    );
    return remoteTrack || screenTracks[0];
  }, [screenTracks, localParticipant?.identity]);
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
  const [localStatus, setLocalStatus] = useState<string>(initialStatus);
  const [exitReason, setExitReason] = useState<'declined' | 'removed' | 'ended' | null>(null);
  const [connectionState, setConnectionState] = useState<'connected' | 'reconnecting'>('connected');
  const [connectionLost, setConnectionLost] = useState(false);

  // In-meeting language preferences — initialised from the pre-join screen
  const [spokenLang, setSpokenLang] = useState(initialSpokenLang);
  const [subtitleLang, setSubtitleLang] = useState(initialSubtitleLang);
  const [audioLang, setAudioLang] = useState(initialAudioLang);
  const [chatLang, setChatLang] = useState(initialChatLang);
  const [isTranslatingChat, setIsTranslatingChat] = useState(false);

  // Translations fetched after a message arrived, for messages that do not carry
  // this reader's language — either they switched chat language after the message
  // was sent, or the sender's translation call failed for that language.
  const [lateTranslations, setLateTranslations] = useState<Record<string, LateTranslation>>({});
  const translationAttemptsRef = useRef<Map<string, number>>(new Map());
  const translationsInFlightRef = useRef<Set<string>>(new Set());

  // Toast notifications & Screen Share Request states
  const [toast, setToast] = useState<{ id: number; message: string; type: 'info' | 'warning' | 'error' | 'success' } | null>(null);
  const [screenShareRequests, setScreenShareRequests] = useState<Array<{ applicantIdentity: string; applicantName: string }>>([]);
  const [screenSharePending, setScreenSharePending] = useState(false);
  const [screenShareApproved, setScreenShareApproved] = useState(false);
  const screenShareTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize preferences and status from localParticipant metadata
  useEffect(() => {
    if (!localParticipant?.metadata) return;
    try {
      const meta = JSON.parse(localParticipant.metadata);
      Promise.resolve().then(() => {
        if (meta.preferences?.spoken) setSpokenLang(meta.preferences.spoken);
        if (meta.preferences?.subtitle) setSubtitleLang(meta.preferences.subtitle);
        if (meta.preferences?.audio) setAudioLang(meta.preferences.audio);
        if (meta.preferences?.chat) setChatLang(meta.preferences.chat);
        if (typeof meta.isHandRaised === 'boolean') setIsHandRaised(meta.isHandRaised);
        if (meta.status) setLocalStatus(meta.status);
        if (typeof meta.audioLocked === 'boolean') setAudioLocked(meta.audioLocked);
        if (typeof meta.videoLocked === 'boolean') setVideoLocked(meta.videoLocked);
      });
    } catch {}
  }, [localParticipant?.metadata]);

  // When the host admits us out of the waiting room, our media was never opened
  // (the token withheld publish rights). Turn it on now that we are in.
  const wasWaitingRef = useRef(false);
  useEffect(() => {
    if (localStatus === 'waiting') {
      wasWaitingRef.current = true;
      return;
    }
    if (!wasWaitingRef.current || !localParticipant) return;
    wasWaitingRef.current = false;

    localParticipant.setMicrophoneEnabled(true).catch(() => {});
    localParticipant.setCameraEnabled(true).catch(() => {});
  }, [localStatus, localParticipant]);

  // Listen for host commands & screen share requests via data messages
  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));

        // 1. Screen share request received by host
        if (msg.type === 'screen-share-request') {
          if (!isHost) return;
          const { applicantIdentity, applicantName } = msg;
          setScreenShareRequests((prev) => {
            if (prev.some((r) => r.applicantIdentity === applicantIdentity)) return prev;
            return [...prev, { applicantIdentity, applicantName }];
          });
          showToast(`🖥️ ${applicantName || 'A participant'} requested to share screen`, 'info');
          return;
        }

        // 2. Participant receives response to screen share request
        if (msg.type === 'screen-share-response') {
          if (msg.targetIdentity && localParticipant && msg.targetIdentity !== localParticipant.identity) return;
          setScreenSharePending(false);
          if (screenShareTimeoutRef.current) {
            clearTimeout(screenShareTimeoutRef.current);
            screenShareTimeoutRef.current = null;
          }

          if (msg.approved) {
            setScreenShareApproved(true);
            showToast('Screen share approved by host! Click "Share Screen" below to start.', 'success');
          } else {
            setScreenShareApproved(false);
            showToast('Screen share request was declined by host.', 'warning');
          }
          return;
        }

        // 3. Active screen sharer receives command to stop screen share (taken over)
        if (msg.type === 'screen-share-stop') {
          if (msg.targetIdentity && localParticipant && msg.targetIdentity !== localParticipant.identity) return;
          if (localParticipant) {
            stopScreenShare();
            setScreenShareApproved(false);
            const reasonText = msg.newSharerName
              ? `Screen share stopped — ${msg.newSharerName} is now sharing.`
              : 'Screen share stopped by host.';
            showToast(reasonText, 'warning');
          }
          return;
        }

        if (msg.type !== 'host-command') return;

        switch (msg.command) {
          case 'revoke-mic':
            localParticipant?.setMicrophoneEnabled(false);
            setAudioLocked(true);
            break;
          case 'grant-mic':
            setAudioLocked(false);
            break;
          case 'revoke-camera':
            localParticipant?.setCameraEnabled(false);
            setVideoLocked(true);
            break;
          case 'grant-camera':
            setVideoLocked(false);
            break;
          case 'removed':
            setExitReason(msg.reason === 'declined' ? 'declined' : 'removed');
            break;
          case 'meeting-ended':
            setExitReason('ended');
            break;
        }
      } catch {}
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room, localParticipant, isHost, showToast]);

  // Enforce locks: prevent re-enabling locked devices.
  // Event-driven only — a polling loop here fights the user's own toggles.
  useEffect(() => {
    if (!localParticipant) return;
    if (!audioLocked && !videoLocked) return;

    const enforcer = () => {
      if (audioLocked && localParticipant.isMicrophoneEnabled) {
        localParticipant.setMicrophoneEnabled(false);
      }
      if (videoLocked && localParticipant.isCameraEnabled) {
        localParticipant.setCameraEnabled(false);
      }
    };

    enforcer();
    localParticipant.on(ParticipantEvent.TrackPublished, enforcer);
    localParticipant.on(ParticipantEvent.TrackUnmuted, enforcer);
    return () => {
      localParticipant.off(ParticipantEvent.TrackPublished, enforcer);
      localParticipant.off(ParticipantEvent.TrackUnmuted, enforcer);
    };
  }, [localParticipant, audioLocked, videoLocked]);

  // Track connection health. Transient reconnects must NOT end the meeting —
  // LiveKit recovers on its own and only a terminal disconnect should navigate away.
  useEffect(() => {
    const onReconnecting = () => {
      console.log('[Relay] Connection interrupted, reconnecting...');
      setConnectionState('reconnecting');
    };
    const onReconnected = () => {
      console.log('[Relay] Connection restored successfully');
      setConnectionState('connected');
    };

    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    return () => {
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
    };
  }, [room]);

  // Listen for disconnects. Only a genuinely terminal reason ends the meeting —
  // everything else (SIGNAL_CLOSE from a throttled tab, a network blip, an HMR
  // remount in dev) leaves the room alive on the server, so we offer a rejoin
  // instead of throwing the user back to the dashboard.
  useEffect(() => {
    const handleDisconnect = (reason?: DisconnectReason) => {
      console.log('[Relay] Disconnected. Reason:', reason);

      // A removal/decline/end already set an explicit reason via data message;
      // keep that screen rather than silently navigating away.
      if (exitReason) return;

      switch (reason) {
        case DisconnectReason.PARTICIPANT_REMOVED:
          setExitReason(localStatus === 'waiting' ? 'declined' : 'removed');
          return;
        case DisconnectReason.ROOM_DELETED:
          setExitReason('ended');
          return;
        case DisconnectReason.DUPLICATE_IDENTITY:
          setExitReason('removed');
          return;
        case DisconnectReason.CLIENT_INITIATED:
          // The user pressed Leave, or the tab is unloading.
          onLeave();
          return;
        default:
          // SIGNAL_CLOSE, ROOM_CLOSED, SERVER_SHUTDOWN, UNKNOWN_REASON, etc.
          // The meeting itself is almost certainly still running.
          console.warn('[Relay] Connection lost, reason:', reason);
          setConnectionLost(true);
      }
    };
    room.on(RoomEvent.Disconnected, handleDisconnect);
    return () => { room.off(RoomEvent.Disconnected, handleDisconnect); };
  }, [room, localStatus, exitReason, onLeave]);

  // 1. Timer — anchored to the room's creation time so every participant sees the
  // same meeting duration, and drift-free across tab throttling.
  useEffect(() => {
    let startedAt = Date.now();
    try {
      const roomMeta = JSON.parse(room.metadata || '{}');
      if (typeof roomMeta.createdAt === 'number') startedAt = roomMeta.createdAt;
    } catch {}

    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [room.metadata]);

  const formattedTime = useMemo(() => {
    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
  }, [elapsedSeconds]);


  const toggleMic = async () => {
    if (!localParticipant || audioLocked) return;
    const newState = !localParticipant.isMicrophoneEnabled;
    await localParticipant.setMicrophoneEnabled(newState);
  };

  const toggleVideo = async () => {
    if (!localParticipant || videoLocked) return;
    const newState = !localParticipant.isCameraEnabled;
    await localParticipant.setCameraEnabled(newState);
  };

  const handleApproveScreenShare = useCallback(
    (applicantIdentity: string) => {
      const req = screenShareRequests.find((r) => r.applicantIdentity === applicantIdentity);
      const applicantName = req ? req.applicantName : 'Participant';

      // 1. If another user (or host) is currently sharing screen, stop them immediately!
      if (screenTracks.length > 0) {
        screenTracks.forEach((t) => {
          const currentSharer = t.participant;
          if (currentSharer && currentSharer.identity !== applicantIdentity) {
            if (currentSharer.identity === localParticipant?.identity) {
              // Host is currently sharing -> stop locally immediately!
              stopScreenShare();
            } else {
              // Remote participant is sharing -> send reliable takeover stop message
              const stopMsg = JSON.stringify({
                type: 'screen-share-stop',
                targetIdentity: currentSharer.identity,
                reason: 'taken-over',
                newSharerName: applicantName,
              });
              const stopData = new TextEncoder().encode(stopMsg);
              room.localParticipant.publishData(stopData, { reliable: true });
            }
          }
        });
      }

      // 2. Send approval response to applicant
      const responseMsg = JSON.stringify({
        type: 'screen-share-response',
        targetIdentity: applicantIdentity,
        approved: true,
      });
      const data = new TextEncoder().encode(responseMsg);
      room.localParticipant.publishData(data, { reliable: true });

      setScreenShareRequests((prev) => prev.filter((r) => r.applicantIdentity !== applicantIdentity));
      showToast(`Approved screen share for ${applicantName}`, 'success');
    },
    [screenShareRequests, screenTracks, room.localParticipant, localParticipant, showToast],
  );

  const handleDeclineScreenShare = useCallback(
    (applicantIdentity: string) => {
      const responseMsg = JSON.stringify({
        type: 'screen-share-response',
        targetIdentity: applicantIdentity,
        approved: false,
        reason: 'declined',
      });
      const data = new TextEncoder().encode(responseMsg);
      room.localParticipant.publishData(data, { reliable: true });

      setScreenShareRequests((prev) => prev.filter((r) => r.applicantIdentity !== applicantIdentity));
      showToast('Declined screen share request', 'info');
    },
    [room.localParticipant, showToast],
  );

  const localScreenPubRef = useRef<LocalTrackPublication | null>(null);

  // Start screen share directly with getDisplayMedia and CaptureController
  const startScreenShare = async () => {
    if (!localParticipant) return;
    try {
      // 1. If another participant is currently sharing, signal them to stop immediately
      if (screenTracks.length > 0) {
        screenTracks.forEach((t) => {
          if (t.participant && t.participant.identity !== localParticipant.identity) {
            const stopMsg = JSON.stringify({
              type: 'screen-share-stop',
              targetIdentity: t.participant.identity,
              reason: 'taken-over',
              newSharerName: localParticipant.name || 'Participant',
            });
            const stopData = new TextEncoder().encode(stopMsg);
            localParticipant.publishData(stopData, { reliable: true });
          }
        });
      }

      let captureController: any = undefined;
      if (typeof window !== 'undefined' && 'CaptureController' in window) {
        try {
          captureController = new (window as any).CaptureController();
        } catch (e) {
          console.debug('Failed to construct CaptureController:', e);
        }
      }

      // Restrict picker to "Entire Screen" only — sharing a specific window
      // causes Chrome to end the track when that window is minimized, while
      // full-monitor capture keeps streaming regardless of window state.
      const displayMediaConstraints: DisplayMediaStreamOptions = {
        video: {
          displaySurface: 'monitor',
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
          frameRate: { ideal: 30, max: 60 },
        } as any,
        audio: false,
        // @ts-expect-error controller is supported in Chromium
        controller: captureController,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'exclude',
        systemAudio: 'exclude',
        preferCurrentTab: false,
        monitorTypeSurfaces: 'include',
      };

      // 2. Chain setFocusBehavior via .then() so it executes in the same
      //    microtask as promise resolution — the W3C spec requires this for
      //    the call to take effect and prevent Chrome from foregrounding the
      //    captured surface.
      const stream = await navigator.mediaDevices
        .getDisplayMedia(displayMediaConstraints)
        .then((s) => {
          if (captureController && typeof captureController.setFocusBehavior === 'function') {
            try {
              captureController.setFocusBehavior('no-focus-change');
            } catch (e) {
              console.debug('CaptureController setFocusBehavior error:', e);
            }
          }
          return s;
        });

      const mediaStreamTrack = stream.getVideoTracks()[0];
      if (!mediaStreamTrack) {
        throw new Error('No video track available in captured stream');
      }

      // Handle user stopping share from browser floating toolbar, or
      // the browser ending the track (e.g. shared window minimized).
      mediaStreamTrack.onended = () => {
        // Check the captured surface type to show a helpful message
        const settings = mediaStreamTrack.getSettings() as any;
        if (settings?.displaySurface === 'window') {
          showToast('Screen share ended — sharing a window stops when it is minimized. Try sharing your entire screen instead.', 'warning');
        }
        stopScreenShare();
      };

      // 3. Publish track directly to LiveKit
      const pub = await localParticipant.publishTrack(mediaStreamTrack, {
        source: Track.Source.ScreenShare,
        name: 'screen_share',
      });
      localScreenPubRef.current = pub;
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'AbortError' || err?.message?.includes('Permission denied')) {
        console.log('Screen share cancelled by user');
      } else {
        console.error('Screen share error:', err);
        showToast('Screen share was cancelled.', 'warning');
      }
    }
  };

  const stopScreenShare = async () => {
    if (!localParticipant) return;
    try {
      if (localScreenPubRef.current) {
        try {
          if (localScreenPubRef.current.track) {
            localScreenPubRef.current.track.stop();
          }
          await localParticipant.unpublishTrack(localScreenPubRef.current.track as any, true);
        } catch (e) {}
        localScreenPubRef.current = null;
      }

      const existingPub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
      if (existingPub) {
        try {
          if (existingPub.track) {
            existingPub.track.stop();
          }
          await localParticipant.unpublishTrack(existingPub.track as any, true);
        } catch (e) {}
      }

      await localParticipant.setScreenShareEnabled(false).catch(() => {});
    } catch (err) {
      console.error('Failed to stop screen share:', err);
    }
  };

  // Enforce single active screen share: automatically stop local screen share if another participant shares
  useEffect(() => {
    if (!localParticipant || !isScreenSharing) return;

    const remoteScreenTrack = screenTracks.find(
      (t) => t.participant?.identity && t.participant.identity !== localParticipant.identity,
    );

    if (remoteScreenTrack) {
      console.log('Another participant started sharing screen — stopping local screen share');
      stopScreenShare();
      const sharerName = remoteScreenTrack.participant?.name || 'Another participant';
      showToast(`Screen share stopped — ${sharerName} is now sharing.`, 'warning');
    }
  }, [screenTracks, isScreenSharing, localParticipant]);

  const handleStartApprovedScreenShare = async () => {
    setScreenShareApproved(false);
    await startScreenShare();
  };

  const toggleScreenShare = async () => {
    if (!localParticipant) return;

    // Currently sharing -> stop
    if (isScreenSharing) {
      await stopScreenShare();
      setScreenShareApproved(false);
      return;
    }

    // Already approved by host -> start immediately
    if (screenShareApproved) {
      await handleStartApprovedScreenShare();
      return;
    }

    // Host can share directly & takeover
    if (isHost) {
      if (screenTracks.length > 0) {
        const currentSharer = screenTracks[0].participant;
        if (currentSharer && currentSharer.identity !== localParticipant.identity) {
          const stopMsg = JSON.stringify({
            type: 'screen-share-stop',
            targetIdentity: currentSharer.identity,
            reason: 'taken-over',
            newSharerName: localParticipant.name || 'Host',
          });
          const stopData = new TextEncoder().encode(stopMsg);
          localParticipant.publishData(stopData, { reliable: true });
        }
      }
      await startScreenShare();
      return;
    }

    // Participant -> request host approval
    if (screenSharePending) {
      showToast('Screen share request already pending.', 'info');
      return;
    }

    const hostParticipant = participants.find((p) => {
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.role === 'host' || meta.isHost;
      } catch {
        return false;
      }
    });

    const requestMsg = JSON.stringify({
      type: 'screen-share-request',
      applicantIdentity: localParticipant.identity,
      applicantName: localParticipant.name || 'Participant',
    });
    const data = new TextEncoder().encode(requestMsg);

    if (hostParticipant) {
      localParticipant.publishData(data, {
        reliable: true,
        destinationIdentities: [hostParticipant.identity],
      });
    } else {
      localParticipant.publishData(data, { reliable: true });
    }

    setScreenSharePending(true);
    showToast('Screen share request sent to host.', 'info');

    if (screenShareTimeoutRef.current) clearTimeout(screenShareTimeoutRef.current);
    screenShareTimeoutRef.current = setTimeout(() => {
      setScreenSharePending(false);
      showToast('Screen share request timed out.', 'warning');
    }, 30000);
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

      await fetch(`/api/meetings/participant-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: meetingId,
          identity: localParticipant.identity,
          metadata: updatedMeta
        })
      });
    } catch (e) {
      console.error('Error updating hand raise state:', e);
    }
  };

  // 4. Update Language Preferences
  const handleSaveLanguageSettings = async () => {
    if (!localParticipant) return;
    try {
      let currentMeta: Record<string, any> = {};
      try {
        if (localParticipant.metadata) currentMeta = JSON.parse(localParticipant.metadata);
      } catch {}

      const updatedMeta = {
        ...currentMeta,
        preferences: {
          ...currentMeta.preferences,
          spoken: spokenLang,
          subtitle: subtitleLang,
          audio: audioLang,
          // Senders read this off every participant to decide which languages to
          // translate a chat message into, so it has to be published like the rest.
          chat: chatLang,
        },
      };

      await fetch(`/api/meetings/participant-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: meetingId,
          identity: localParticipant.identity,
          metadata: updatedMeta
        })
      });
      setIsSettingsOpen(false);
    } catch (e) {
      console.error('Error updating language preferences:', e);
    }
  };

  // The selects are bound straight to state, so Cancel has to put back what was
  // last published — otherwise a discarded chat-language change would still be
  // applied to the chat panel.
  const handleCancelLanguageSettings = () => {
    try {
      const meta = localParticipant?.metadata ? JSON.parse(localParticipant.metadata) : null;
      setSpokenLang(meta?.preferences?.spoken || 'en');
      setSubtitleLang(meta?.preferences?.subtitle || 'en');
      setAudioLang(meta?.preferences?.audio || 'none');
      setChatLang(meta?.preferences?.chat || 'en');
    } catch {}
    setIsSettingsOpen(false);
  };

  // 5. Chat Unread Count — counts each new remote message exactly once.
  // Keyed off a seen-index ref so toggling the panel cannot re-count messages.
  const seenMessageCountRef = useRef(0);
  useEffect(() => {
    if (isChatOpen) {
      seenMessageCountRef.current = chatMessages.length;
      Promise.resolve().then(() => setUnreadCount(0));
      return;
    }

    const fresh = chatMessages.slice(seenMessageCountRef.current);
    seenMessageCountRef.current = chatMessages.length;

    const incoming = fresh.filter((m) => m.from?.identity !== localParticipant?.identity);
    if (incoming.length > 0) {
      Promise.resolve().then(() => setUnreadCount((c) => c + incoming.length));
    }
  }, [chatMessages, isChatOpen, localParticipant?.identity]);

  // Auto-scroll chat to the newest message
  useEffect(() => {
    if (!isChatOpen) return;
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages, isChatOpen]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadCount(0);
  };

  // Chat messages are translated once, at send time, into every language someone
  // in the room is actually reading in — not into all 14 supported languages.
  const chatTargetLangs = useMemo(() => {
    const langs = new Set<string>([chatLang || 'en']);
    for (const p of allParticipants) {
      if (
        p.kind === ParticipantKind.AGENT ||
        p.identity.startsWith('agent-') ||
        p.identity.startsWith('translation')
      ) {
        continue;
      }
      try {
        const meta = p.metadata ? JSON.parse(p.metadata) : null;
        const pref = meta?.preferences?.chat;
        if (typeof pref === 'string' && pref) langs.add(pref);
      } catch {}
    }
    return Array.from(langs);
  }, [allParticipants, chatLang]);

  const getChatMessageText = useCallback(
    (msg: { id?: string; timestamp: number; message: string }) => {
      const target = chatLang || 'en';
      const parsed = readChatPayload(msg.message);

      if (!parsed) {
        const raw = typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message);
        return { text: raw, original: raw, shownLang: null, status: 'original' as const };
      }

      const { payload, table, original } = parsed;
      const carried = typeof table[target] === 'string' ? table[target] : undefined;
      const late = lateTranslations[`${chatMessageKey(msg)}|${target}`];
      const text = carried || (late?.status === 'done' ? late.text : undefined);

      if (text) {
        return {
          text,
          original,
          shownLang: target,
          status: original && text !== original ? ('translated' as const) : ('original' as const),
        };
      }

      return {
        text: original || JSON.stringify(payload),
        original,
        shownLang: null,
        status: late?.status === 'pending' ? ('pending' as const) : ('untranslated' as const),
      };
    },
    [chatLang, lateTranslations],
  );

  // Translate messages that did not arrive with this reader's language. Without
  // this, switching chat language mid-meeting would leave the existing history —
  // and any message whose send-time translation failed — stuck in the original.
  useEffect(() => {
    if (!isChatOpen) return;
    const target = chatLang || 'en';

    const missing: Array<{ key: string; original: string }> = [];
    for (const msg of chatMessages) {
      const key = `${chatMessageKey(msg)}|${target}`;
      if (translationsInFlightRef.current.has(key)) continue;
      if ((translationAttemptsRef.current.get(key) ?? 0) >= MAX_TRANSLATION_ATTEMPTS) continue;

      const parsed = readChatPayload(msg.message);
      if (!parsed) continue;
      if (typeof parsed.table[target] === 'string') continue;
      if (!parsed.original.trim()) continue;

      missing.push({ key, original: parsed.original });
    }

    if (missing.length === 0) return;

    for (const item of missing) {
      translationsInFlightRef.current.add(item.key);
      translationAttemptsRef.current.set(item.key, (translationAttemptsRef.current.get(item.key) ?? 0) + 1);
    }
    setLateTranslations((prev) => {
      const next = { ...prev };
      for (const item of missing) next[item.key] = { status: 'pending' };
      return next;
    });

    let cancelled = false;
    (async () => {
      for (const item of missing) {
        let entry: LateTranslation = { status: 'failed' };
        try {
          const res = await fetch(`/api/meetings/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: item.original, targets: [target] }),
          });
          if (res.ok) {
            const data = await res.json();
            const translated = data?.translations?.[target];
            if (typeof translated === 'string' && translated) entry = { status: 'done', text: translated };
          }
        } catch (err) {
          console.error('Chat translation error:', err);
        }

        translationsInFlightRef.current.delete(item.key);
        // Never re-request something we already have; a failure keeps its attempt
        // count so it gets at most MAX_TRANSLATION_ATTEMPTS tries in total.
        if (entry.status === 'done') {
          translationAttemptsRef.current.set(item.key, MAX_TRANSLATION_ATTEMPTS);
        }

        if (cancelled) {
          for (const rest of missing) translationsInFlightRef.current.delete(rest.key);
          return;
        }
        setLateTranslations((prev) => ({ ...prev, [item.key]: entry }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatMessages, chatLang, isChatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTranslatingChat) return;

    const textToSend = chatInput.trim();
    setChatInput('');
    setIsTranslatingChat(true);

    try {
      const res = await fetch(`/api/meetings/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend, targets: chatTargetLangs }),
      });
      if (!res.ok) throw new Error(`Translate API responded ${res.status}`);

      const data = await res.json();
      const translations =
        data?.translations && typeof data.translations === 'object' ? data.translations : {};

      if (Array.isArray(data?.failed) && data.failed.length > 0) {
        showToast(
          `Could not translate into ${data.failed.join(', ').toUpperCase()} — sent in the original language.`,
          'warning',
        );
      }

      await sendChatMessage(
        JSON.stringify({ v: 2, original: textToSend, source: data?.detectedSource, t: translations }),
      );
    } catch (err) {
      console.error('Chat translation API error:', err);
      showToast('Translation unavailable — message sent untranslated.', 'warning');
      // Still deliver the message; each reader retries the translation on their side.
      await sendChatMessage(JSON.stringify({ v: 2, original: textToSend, t: {} }));
    } finally {
      setIsTranslatingChat(false);
    }
  };

  const handleCopyLink = () => {
    const guestUrl = `${window.location.origin}/meeting/${meetingId}/guest`;
    navigator.clipboard.writeText(guestUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Count waiting participants for host badge
  const waitingCount = useMemo(() => {
    return allParticipants.filter(p => {
      if (
        p.kind === ParticipantKind.AGENT ||
        p.identity.startsWith('agent-') ||
        p.identity.startsWith('translation')
      ) {
        return false;
      }
      try {
        const meta = JSON.parse(p.metadata || '{}');
        return meta.status === 'waiting' && meta.role !== 'host';
      } catch { return false; }
    }).length;
  }, [allParticipants]);

  // Connection dropped, but the meeting is still running on the server.
  // Offer to rejoin rather than dumping the user back to the dashboard.
  if (connectionLost) {
    return (
      <div className="h-screen w-screen bg-[#070709] flex items-center justify-center">
        <div className="text-center p-8 bg-[#111116] border border-white/10 rounded-3xl max-w-md w-[90%] shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-amber-400 text-[32px]">wifi_off</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Lost</h2>
          <p className="text-white/50 text-sm mb-6">
            You were disconnected from the meeting. The meeting is likely still running — you can rejoin.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onLeave}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold rounded-2xl text-sm transition-colors"
            >
              Leave
            </button>
            <button
              onClick={() => (onRejoin ? onRejoin() : window.location.reload())}
              className="flex-1 py-3 bg-white text-black font-bold rounded-2xl text-sm hover:bg-white/90 transition-colors"
            >
              Rejoin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exit screens: declined from the waiting room, removed by host, or meeting ended
  if (exitReason) {
    const copy = {
      declined: {
        icon: 'block',
        title: 'Access Denied',
        body: 'Your request to join this meeting was declined by the host.',
      },
      removed: {
        icon: 'person_remove',
        title: 'Removed from Meeting',
        body: 'You have been removed from this meeting by the host.',
      },
      ended: {
        icon: 'call_end',
        title: 'Meeting Ended',
        body: 'The host has ended this meeting for everyone.',
      },
    }[exitReason];

    return (
      <div className="h-screen w-screen bg-[#070709] flex items-center justify-center">
        <div className="text-center p-8 bg-[#111116] border border-white/10 rounded-3xl max-w-md w-[90%] shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-rose-400 text-[32px]">{copy.icon}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{copy.title}</h2>
          <p className="text-white/50 text-sm mb-6">{copy.body}</p>
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
      {/* Reconnecting banner — the call is recovering, not over */}
      {connectionState === 'reconnecting' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-md">
          <span className="w-3 h-3 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-amber-300">Reconnecting…</span>
        </div>
      )}

      {/* Real-time Dubbing Audio Renderer & Subtitles */}
      <CustomAudioRenderer audioLang={audioLang} />
      <CustomSubtitles subtitleLang={subtitleLang} />
      <ReactionsOverlay />
      <AgendaWidget />
      <KeyboardShortcuts
        onToggleMic={toggleMic}
        onToggleVideo={toggleVideo}
        onToggleChat={() => { setIsChatOpen(p => !p); if (!isChatOpen) setUnreadCount(0); }}
        onToggleWhiteboard={() => setIsWhiteboardOpen(p => !p)}
        onToggleHandRaise={toggleHandRaise}
        onClosePanels={() => {
          setIsChatOpen(false);
          setIsParticipantsOpen(false);
          setIsSettingsOpen(false);
          setIsWhiteboardOpen(false);
          if (isHost) setIsHostPanelOpen(false);
        }}
        audioLocked={audioLocked}
        videoLocked={videoLocked}
      />
      {/* Toast Notification Container (Top Right - Minimal & Decent) */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-medium shadow-xl backdrop-blur-md flex items-center gap-2 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/30 text-amber-300'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-300'
              : 'bg-[#111116]/90 border-white/10 text-white/90'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {isWhiteboardOpen && <Whiteboard onClose={() => setIsWhiteboardOpen(false)} />}
      {isHost && (
        <HostControlsPanel
          isOpen={isHostPanelOpen}
          onClose={() => setIsHostPanelOpen(false)}
          meetingId={meetingId}
          hostKey={hostKey}
          screenShareRequests={screenShareRequests}
          onApproveScreenShare={handleApproveScreenShare}
          onDeclineScreenShare={handleDeclineScreenShare}
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

      {/* Top Left Debug UI */}
      <div className="fixed top-4 left-4 z-[9999] bg-black/80 text-green-400 font-mono text-[10px] p-2 rounded pointer-events-none whitespace-pre overflow-hidden max-w-sm max-h-[50vh] overflow-y-auto">
        RAW META: {localParticipant?.metadata || 'none'}{'\n'}
        chatLang STATE: {chatLang || 'en'}{'\n'}
        chatTargetLangs: {JSON.stringify(chatTargetLangs)}{'\n'}
        Last Msg Raw: {chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].message.slice(0, 100) : 'none'}{'\n'}
        Last Msg Parsed: {chatMessages.length > 0 ? JSON.stringify(getChatMessageText(chatMessages[chatMessages.length - 1])) : 'none'}
      </div>

      {/* Main Conference Layout */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Video Stage */}
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center overflow-hidden">
          {activeScreenTrack ? (
            <div className="w-full h-full flex flex-col lg:flex-row gap-4">
              <div className="flex-1 bg-black/60 rounded-3xl border border-white/10 overflow-hidden relative flex items-center justify-center">
                <VideoTrack trackRef={activeScreenTrack} className="w-full h-full object-contain" />
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
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
                  const { text, original, shownLang, status } = getChatMessageText(msg);

                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[11px] font-bold text-white/70">{msg.from?.name || 'Unknown'}</span>
                        <span className="text-[9px] text-white/40">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {shownLang ? (
                          <span className="text-[9px] text-rose-400 font-mono">[{shownLang}]</span>
                        ) : status === 'pending' ? (
                          <span className="text-[9px] text-white/40 font-mono">translating…</span>
                        ) : (
                          <span className="text-[9px] text-amber-400/80 font-mono">original</span>
                        )}
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                          isMe
                            ? 'bg-rose-500 text-white rounded-br-none shadow-lg'
                            : 'bg-white/10 text-white/90 border border-white/10 rounded-bl-none'
                        }`}
                      >
                        <div>{text}</div>
                        {status === 'translated' && original && original !== text && (
                          <div className="mt-1 pt-1 border-t border-white/20 text-[10px] opacity-70 italic">
                            Original: {original}
                          </div>
                        )}
                        {status === 'untranslated' && (
                          <div className="mt-1 pt-1 border-t border-white/20 text-[10px] opacity-70 italic">
                            Not available in {chatLang.toUpperCase()}
                          </div>
                        )}
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
                placeholder={isTranslatingChat ? "Translating & sending..." : "Type a message..."}
                disabled={isTranslatingChat}
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isTranslatingChat}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:opacity-30 disabled:hover:bg-white transition-all shrink-0"
              >
                {isTranslatingChat ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">send</span>
                )}
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
                let meta: { isHost: boolean; preferences: { spoken: string }; isHandRaised: boolean } = { isHost: false, preferences: { spoken: 'en' }, isHandRaised: false };
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
                  <p className="text-xs text-white/40">Configure speech recognition, subtitles, chat & audio dubbing</p>
                </div>
              </div>
              <button
                onClick={handleCancelLanguageSettings}
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

              {/* Chat Language */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  Chat Language (Read messages in)
                </label>
                <select
                  value={chatLang}
                  onChange={(e) => setChatLang(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#111116] text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[10px] text-white/40">
                  Applies to messages already in the chat as well as new ones.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancelLanguageSettings}
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
                : screenShareApproved
                ? 'bg-emerald-500 text-black border-2 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : screenShareApproved ? 'Screen Share Approved! Click to Start' : 'Share Screen'}
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
          ? 'border-amber-500/50 ring-1 ring-amber-500/50'
          : isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
          : 'border-white/10'
      } ${compact ? 'aspect-video max-h-40' : 'aspect-video'}`}
    >
      {/* Video Stream */}
      {isVideoEnabled ? (
        <VideoTrack
          trackRef={{ participant, publication: cameraPub, source: Track.Source.Camera }}
          className={`w-full h-full object-cover ${participant.isLocal ? '-scale-x-100' : ''}`}
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

      {/* Participant Name & Status Overlay */}
      <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2 z-20">
        <span className="text-xs font-medium text-white/90">
          {participant.name || participant.identity}
        </span>
        {isHandRaised && (
          <span className="material-symbols-outlined text-[14px] text-amber-400" title="Hand Raised">
            front_hand
          </span>
        )}
        <span className={`material-symbols-outlined text-[14px] ${participant.isMicrophoneEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
          {participant.isMicrophoneEnabled ? 'mic' : 'mic_off'}
        </span>
      </div>
    </div>
  );
}

