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
 * GET /api/meetings/token
 * Generate LiveKit access token with language preferences and host permissions in metadata
 */
router.get('/token', async (req: Request, res: Response) => {
  try {
    const roomName = (req.query.roomName as string) || (req.query.meetingId as string) || 'default-room';
    let username = (req.query.username as string) || (req.query.participantName as string) || '';
    let isHost = req.query.isHost === 'true';
    const waitingRoom = req.query.waitingRoom === 'true';
    const hostKey = (req.query.hostKey as string) || '';
    
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

    let participantStatus = 'active';

    if (isHost) {
      try {
        await roomService.createRoom({
          name: roomName,
          emptyTimeout: 10 * 60,
          metadata: JSON.stringify({
            waitingRoomEnabled: waitingRoom,
            hostKey: hostKey
          })
        });
        await roomService.updateRoomMetadata(roomName, JSON.stringify({
          waitingRoomEnabled: waitingRoom,
          hostKey: hostKey
        }));
      } catch (e) {
        console.warn('Failed to create/update room metadata', e);
      }
    } else {
      try {
        const rooms = await roomService.listRooms([roomName]);
        if (rooms.length === 0) {
          return res.status(404).json({ error: 'Meeting has not started yet. Please wait for the host.' });
        }
        
        const roomMeta = JSON.parse(rooms[0].metadata || '{}');
        if (roomMeta.waitingRoomEnabled) {
          participantStatus = 'waiting';
        }
      } catch (e) {
        console.warn('Failed to fetch room details', e);
        return res.status(500).json({ error: 'Failed to verify room' });
      }
    }

    // 2. Build metadata JSON
    const metadata = {
      isHost,
      role: isHost ? 'host' : 'participant',
      status: participantStatus,
      hostKey: isHost ? hostKey : undefined,
      avatar: userAvatar,
      preferences: {
        spoken: spokenLang,
        chat: chatLang,
        audio: audioLang,
        subtitle: subtitleLang,
      },
    };

    // 3. Create LiveKit Access Token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: username,
      metadata: JSON.stringify(metadata),
      ttl: '4h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return res.json({
      serverUrl: livekitUrl,
      token,
      roomName,
      isHost,
      hostKey: isHost ? hostKey : undefined,
      participantName: username,
      participantId: userId,
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
    const { roomName, action, hostKey, targetParticipantId } = req.body;
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
      case 'kick': {
        if (!targetParticipantId) return res.status(400).json({ error: 'Missing targetParticipantId' });
        await roomService.removeParticipant(roomName, targetParticipantId);
        return res.json({ success: true });
      }

      case 'mute-all': {
        const participants = await roomService.listParticipants(roomName);
        for (const p of participants) {
          const pMeta = JSON.parse(p.metadata || '{}');
          if (pMeta.role === 'host' || pMeta.isHost) continue;

          let mutedAudio = false;
          for (const pub of p.tracks) {
            if ([0, 2, 'AUDIO', 'MICROPHONE'].includes(pub.source) || [0, 2, 'AUDIO', 'MICROPHONE'].includes(pub.type)) {
              await roomService.mutePublishedTrack(roomName, p.identity, pub.sid, true);
              mutedAudio = true;
            }
          }
          if (!mutedAudio) {
            await roomService.updateParticipant(roomName, p.identity, JSON.stringify(pMeta), {
              canPublish: false,
              canSubscribe: true,
              canPublishData: true,
            });
          }
        }
        
        // Send data message to non-host participants
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ type: 'host-command', command: 'revoke-mic' }));
        const nonHostIdentities = participants
          .filter(p => {
            const meta = JSON.parse(p.metadata || '{}');
            return meta.role !== 'host' && !meta.isHost;
          })
          .map(p => p.identity);
        
        if (nonHostIdentities.length > 0) {
          await roomService.sendData(roomName, data, 0, { destinationIdentities: nonHostIdentities });
        }
        
        return res.json({ success: true });
      }

      case 'disable-video-all': {
        const participants = await roomService.listParticipants(roomName);
        for (const p of participants) {
          const pMeta = JSON.parse(p.metadata || '{}');
          if (pMeta.role === 'host' || pMeta.isHost) continue;

          let mutedVideo = false;
          for (const pub of p.tracks) {
            if ([1, 'VIDEO', 'CAMERA'].includes(pub.source) || [1, 'VIDEO', 'CAMERA'].includes(pub.type)) {
              await roomService.mutePublishedTrack(roomName, p.identity, pub.sid, true);
              mutedVideo = true;
            }
          }
          if (!mutedVideo) {
            await roomService.updateParticipant(roomName, p.identity, JSON.stringify(pMeta), {
              canPublish: false,
              canSubscribe: true,
              canPublishData: true,
            });
          }
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ type: 'host-command', command: 'revoke-cam' }));
        const nonHostIdentities = participants
          .filter(p => {
            const meta = JSON.parse(p.metadata || '{}');
            return meta.role !== 'host' && !meta.isHost;
          })
          .map(p => p.identity);
        
        if (nonHostIdentities.length > 0) {
          await roomService.sendData(roomName, data, 0, { destinationIdentities: nonHostIdentities });
        }

        return res.json({ success: true });
      }

      case 'end-meeting': {
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

export default router;
