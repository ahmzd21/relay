import { Router, Request, Response } from 'express';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { verifySessionToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

// Initialize RoomServiceClient
const roomService = new RoomServiceClient(
  livekitUrl.replace('ws://', 'http://').replace('wss://', 'https://'),
  apiKey,
  apiSecret
);

/**
 * GET /api/meetings/check/:roomName
 * Check whether a room already exists. Used by the client to decide
 * whether the current user is creating the meeting (host) or joining it.
 */
router.get('/check/:roomName', async (req: Request, res: Response) => {
  try {
    const roomName = req.params.roomName as string;
    const rooms = await roomService.listRooms([roomName]);

    if (rooms.length === 0) {
      return res.status(404).json({ exists: false });
    }

    const meta = JSON.parse(rooms[0].metadata || '{}');
    return res.json({
      exists: true,
      waitingRoomEnabled: !!meta.waitingRoomEnabled,
      numParticipants: rooms[0].numParticipants,
    });
  } catch (error: any) {
    console.error('[Meetings API] Error checking room:', error);
    return res.status(500).json({ error: 'Failed to check room' });
  }
});

/**
 * GET /api/meetings/token
 * Generate LiveKit access token with language preferences and host permissions in metadata
 */
router.get('/token', async (req: Request, res: Response) => {
  try {
    const roomName = (req.query.roomName as string) || (req.query.meetingId as string) || 'default-room';
    let username = (req.query.username as string) || (req.query.participantName as string) || '';
    const requestedHost = req.query.isHost === 'true';
    const waitingRoom = req.query.waitingRoom === 'true';
    const hostKey = (req.query.hostKey as string) || '';
    // Set only by the "start a meeting" flow. Required to create a room and take
    // host; opening an invite link never sets it.
    const isCreateIntent = req.query.create === 'true';

    // Language preferences
    const spokenLang = (req.query.spokenLang as string) || 'en';
    const chatLang = (req.query.chatLang as string) || 'en';
    const audioLang = (req.query.audioLang as string) || 'none';
    const subtitleLang = (req.query.subtitleLang as string) || 'none';

    // 1. Check for logged-in user session
    let userId = '';
    let userAvatar = '';
    const sessionCookie = req.cookies?.relay_session;

    if (sessionCookie) {
      const sessionUser = await verifySessionToken(sessionCookie);
      if (sessionUser && sessionUser.userId) {
        userId = sessionUser.userId;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: sessionUser.userId },
            select: { fullName: true, avatar: true },
          });
          if (dbUser) {
            if (!username && dbUser.fullName) username = dbUser.fullName;
            if (dbUser.avatar) userAvatar = dbUser.avatar;
          }
        } catch (e) {
          console.warn('[Meetings API] Could not fetch user from DB:', e);
        }
      }
    }

    if (!userId) {
      userId = `guest_${Math.random().toString(36).substring(2, 9)}`;
      if (!username) {
        username = `Guest ${userId.substring(6, 10)}`;
      }
    }

    // LiveKit identities must be unique per connection. Using the bare userId
    // means a second tab, a reload, or a rejoin arrives with an identity that
    // already exists, and the server evicts the older connection with
    // DUPLICATE_IDENTITY — which reads to the user as the host being dropped the
    // moment someone joins. Suffix a per-connection nonce and keep the stable
    // userId in metadata for host reclaim.
    const participantIdentity = `${userId}__${Math.random().toString(36).substring(2, 10)}`;

    // 2. Determine host status authoritatively from server state.
    //    The client cannot simply claim to be host — either the room does not
    //    exist yet (this user is creating it) or they present the correct hostKey.
    let existingRoom: any = null;
    try {
      const rooms = await roomService.listRooms([roomName]);
      existingRoom = rooms.length > 0 ? rooms[0] : null;
    } catch (e) {
      console.warn('[Meetings API] Failed to list rooms', e);
      return res.status(500).json({ error: 'Failed to verify room' });
    }

    let isHost = false;
    let effectiveHostKey = '';
    let participantStatus = 'active';

    if (!existingRoom) {
      // Room does not exist. Only someone who explicitly started this meeting may
      // create it. Merely being the first to open an invite link must NOT grant
      // host — otherwise an invitee who clicks early takes host and locks the real
      // host out of their own meeting.
      if (!requestedHost || !isCreateIntent) {
        return res
          .status(404)
          .json({ error: 'Meeting has not started yet. Please wait for the host.' });
      }

      isHost = true;
      effectiveHostKey = hostKey || Math.random().toString(36).substring(2, 10);

      try {
        await roomService.createRoom({
          name: roomName,
          // Keep the room alive through brief host reconnects and while the
          // last participant steps away, so meetings do not close on their own.
          emptyTimeout: 30 * 60,
          departureTimeout: 5 * 60,
          metadata: JSON.stringify({
            waitingRoomEnabled: waitingRoom,
            hostKey: effectiveHostKey,
            hostIdentity: userId,
            createdAt: Date.now(),
          }),
        });
      } catch (e) {
        console.warn('[Meetings API] Failed to create room', e);
        return res.status(500).json({ error: 'Failed to create meeting room' });
      }
    } else {
      const roomMeta = JSON.parse(existingRoom.metadata || '{}');

      // Rejoining host: matching hostKey, or same identity that created the room.
      const keyMatches = !!roomMeta.hostKey && hostKey === roomMeta.hostKey;
      const identityMatches = !!roomMeta.hostIdentity && roomMeta.hostIdentity === userId;

      if (requestedHost && (keyMatches || identityMatches)) {
        isHost = true;
        effectiveHostKey = roomMeta.hostKey || '';
      } else if (roomMeta.waitingRoomEnabled) {
        participantStatus = 'waiting';
      }
    }

    // 3. Build metadata JSON
    const metadata = {
      isHost,
      role: isHost ? 'host' : 'participant',
      status: participantStatus,
      hostKey: isHost ? effectiveHostKey : undefined,
      avatar: userAvatar,
      preferences: {
        spoken: spokenLang,
        chat: chatLang,
        audio: audioLang,
        subtitle: subtitleLang,
      },
    };

    // 4. Create LiveKit Access Token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: username,
      metadata: JSON.stringify(metadata),
      ttl: '12h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      // Someone sitting in the waiting room must not be able to publish media
      // into the meeting before the host admits them.
      canPublish: participantStatus !== 'waiting',
      canSubscribe: participantStatus !== 'waiting',
      canPublishData: true,
    });

    const token = await at.toJwt();

    return res.json({
      serverUrl: livekitUrl,
      token,
      roomName,
      isHost,
      hostKey: isHost ? effectiveHostKey : undefined,
      participantName: username,
      participantId: userId,
      status: participantStatus,
    });
  } catch (error: any) {
    console.error('[Meetings API] Error generating token:', error);
    return res.status(500).json({ error: 'Failed to generate meeting token' });
  }
});

/**
 * POST /api/meetings/control
 * Host control actions (mute all, permissions, lock mic/cam)
 */
router.post('/control', async (req: Request, res: Response) => {
  try {
    // Accept both naming conventions the clients use.
    const roomName = req.body.roomName || req.body.meetingId;
    const action = req.body.action;
    const hostKey = req.body.hostKey;
    const targetParticipantId = req.body.targetParticipantId || req.body.targetIdentity;

    if (!roomName || !action || !hostKey) {
      return res.status(400).json({ error: 'Missing required parameters: roomName, action, hostKey' });
    }

    try {
      const rooms = await roomService.listRooms([roomName]);
      if (rooms.length === 0) {
        return res.status(404).json({ error: 'Room not found on server' });
      }
      const roomMeta = JSON.parse(rooms[0].metadata || '{}');
      if (roomMeta.hostKey !== hostKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Host Key' });
      }
    } catch (e) {
      return res.status(401).json({ error: 'Failed to authenticate host key' });
    }

    const getParticipantWithTracks = async (identity: string) => {
      try {
        const p = await roomService.getParticipant(roomName, identity);
        if (p.tracks.length > 0) return p;
      } catch (e) {}
      const participants = await roomService.listParticipants(roomName);
      return participants.find(p => p.identity === identity);
    };

    switch (action) {
      case 'approve-participant': {
        if (!targetParticipantId) return res.status(400).json({ error: 'Missing targetParticipantId' });
        let currentMeta: any = { role: 'participant' };
        try {
          const p = await getParticipantWithTracks(targetParticipantId);
          if (p && p.metadata) {
            currentMeta = JSON.parse(p.metadata);
          }
        } catch (e) {}
        currentMeta.status = 'active';
        await roomService.updateParticipant(roomName, targetParticipantId, JSON.stringify(currentMeta), {
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
        });
        return res.json({ success: true });
      }

      case 'decline-participant':
      case 'kick-participant':
      case 'kick': {
        if (!targetParticipantId) return res.status(400).json({ error: 'Missing targetParticipantId' });

        // Tell the participant why they are being removed so the client can show
        // the correct screen instead of guessing from stale metadata.
        try {
          const reason = action === 'decline-participant' ? 'declined' : 'removed';
          const payload = new TextEncoder().encode(
            JSON.stringify({ type: 'host-command', command: 'removed', reason })
          );
          await roomService.sendData(roomName, payload, 0, {
            destinationIdentities: [targetParticipantId],
          });
        } catch (e) {
          console.warn('[Meetings API] Could not notify removed participant', e);
        }

        await roomService.removeParticipant(roomName, targetParticipantId);
        return res.json({ success: true });
      }

      case 'mute-all': {
        const participants = await roomService.listParticipants(roomName);
        const nonHosts = participants.filter((p) => {
          const meta = JSON.parse(p.metadata || '{}');
          return meta.role !== 'host' && !meta.isHost;
        });

        for (const p of nonHosts) {
          for (const pub of p.tracks) {
            if ([0, 2, 'AUDIO', 'MICROPHONE'].includes(pub.source) || [0, 2, 'AUDIO', 'MICROPHONE'].includes(pub.type)) {
              await roomService.mutePublishedTrack(roomName, p.identity, pub.sid, true);
            }
          }
        }

        // Ask clients to lock their mic. We deliberately do not revoke canPublish
        // here — that would also block camera and screen share.
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ type: 'host-command', command: 'revoke-mic' }));
        const nonHostIdentities = nonHosts.map((p) => p.identity);

        if (nonHostIdentities.length > 0) {
          await roomService.sendData(roomName, data, 0, { destinationIdentities: nonHostIdentities });
        }

        return res.json({ success: true });
      }

      case 'disable-video-all': {
        const participants = await roomService.listParticipants(roomName);
        const nonHosts = participants.filter((p) => {
          const meta = JSON.parse(p.metadata || '{}');
          return meta.role !== 'host' && !meta.isHost;
        });

        for (const p of nonHosts) {
          for (const pub of p.tracks) {
            if ([1, 'VIDEO', 'CAMERA'].includes(pub.source) || [1, 'VIDEO', 'CAMERA'].includes(pub.type)) {
              await roomService.mutePublishedTrack(roomName, p.identity, pub.sid, true);
            }
          }
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ type: 'host-command', command: 'revoke-camera' }));
        const nonHostIdentities = nonHosts.map((p) => p.identity);

        if (nonHostIdentities.length > 0) {
          await roomService.sendData(roomName, data, 0, { destinationIdentities: nonHostIdentities });
        }

        return res.json({ success: true });
      }

      case 'end-meeting': {
        // Notify everyone before tearing the room down so clients can show
        // "meeting ended" rather than a generic disconnect.
        try {
          const payload = new TextEncoder().encode(
            JSON.stringify({ type: 'host-command', command: 'meeting-ended' })
          );
          await roomService.sendData(roomName, payload, 0, {});
        } catch (e) {
          console.warn('[Meetings API] Could not notify participants of meeting end', e);
        }

        await roomService.deleteRoom(roomName);
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error: any) {
    console.error('[Meetings API] Error executing room control:', error);
    return res.status(500).json({ error: 'Failed to perform room control' });
  }
});

/**
 * POST /api/meetings/agenda
 * Agenda Management
 */
router.post('/agenda', async (req: Request, res: Response) => {
  try {
    const { roomName, agenda } = req.body;
    if (!roomName || !agenda || !Array.isArray(agenda)) {
      return res.status(400).json({ error: 'Missing roomName or invalid agenda' });
    }

    const rooms = await roomService.listRooms([roomName]);
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    let existingMeta: any = {};
    try {
      existingMeta = JSON.parse(rooms[0].metadata || '{}');
    } catch (e) {
      console.warn('Failed to parse existing room metadata', e);
    }

    const updatedMeta = { ...existingMeta, agenda };
    await roomService.updateRoomMetadata(roomName, JSON.stringify(updatedMeta));

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[Meetings API] Error updating agenda:', error);
    return res.status(500).json({ error: 'Failed to update agenda' });
  }
});

/**
 * POST /api/meetings/participant-metadata
 * Metadata Updates
 */
router.post('/participant-metadata', async (req: Request, res: Response) => {
  try {
    const { roomName, identity, metadata } = req.body;
    if (!roomName || !identity || !metadata) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    await roomService.updateParticipant(roomName, identity, JSON.stringify(metadata));
    return res.json({ success: true });
  } catch (error: any) {
    console.error('[Meetings API] Error updating participant metadata:', error);
    return res.status(500).json({ error: 'Failed to update participant metadata' });
  }
});

/**
 * POST /api/meetings/translate
 * Translate chat message text into all supported target languages
 */
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const targetLanguages = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'ru', 'pt', 'it', 'hi', 'ko', 'tr', 'ur'];

    if (apiKey) {
      try {
        const prompt = `Translate the following chat message into these target languages: English (en), Spanish (es), French (fr), German (de), Japanese (ja), Chinese (zh), Arabic (ar), Russian (ru), Portuguese (pt), Italian (it), Hindi (hi), Korean (ko), Turkish (tr), and Urdu (ur).
Return ONLY a valid JSON object where the keys are exactly 'en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'ru', 'pt', 'it', 'hi', 'ko', 'tr', 'ur', and the values are the accurately translated text strings. Do not wrap the response in markdown or backticks, output raw JSON only.

Text to translate: "${text.replace(/"/g, '\\"')}"`;

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            const translations = JSON.parse(generatedText.trim());
            for (const lang of targetLanguages) {
              if (!translations[lang]) translations[lang] = text;
            }
            translations['original'] = text;
            return res.json(translations);
          }
        }
      } catch (e) {
        console.warn('[Meetings API] Gemini translation error, using fallback:', e);
      }
    }

    // Fallback if no API key or error: return original for all languages
    const fallback: Record<string, string> = { original: text };
    for (const lang of targetLanguages) {
      fallback[lang] = text;
    }
    return res.json(fallback);
  } catch (error: any) {
    console.error('[Meetings API] Error translating chat message:', error);
    return res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
