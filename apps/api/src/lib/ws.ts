import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { verifySessionToken } from './jwt.js';
import { prisma } from './prisma.js';

export interface AuthenticatedSocket extends WebSocket {
  userId: string;
  channels: Set<string>;
}

// channelId -> Set of connected sockets
const channelRooms = new Map<string, Set<AuthenticatedSocket>>();
// userId -> Set of connected sockets (user can have multiple tabs)
const userSockets = new Map<string, Set<AuthenticatedSocket>>();

function parseCookies(req: IncomingMessage): Record<string, string> {
  const raw = req.headers.cookie || '';
  const result: Record<string, string> = {};
  for (const pair of raw.split(';')) {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      result[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  }
  return result;
}

export function initWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const socket = ws as AuthenticatedSocket;
    socket.channels = new Set();

    // Authenticate via cookie
    const cookies = parseCookies(req);
    const token = cookies.relay_session;

    if (!token) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    const user = await verifySessionToken(token);
    if (!user) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    socket.userId = user.userId;

    // Track user sockets
    if (!userSockets.has(user.userId)) {
      userSockets.set(user.userId, new Set());
    }
    userSockets.get(user.userId)!.add(socket);

    console.log(`[WS] User ${user.userId} connected`);

    socket.on('message', async (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'join': {
            const { channelId } = msg;
            if (!channelId) break;

            // Verify user is a member of the channel
            const member = await prisma.channelMember.findUnique({
              where: { channelId_userId: { channelId, userId: socket.userId } },
            });
            if (!member) break;

            socket.channels.add(channelId);
            if (!channelRooms.has(channelId)) {
              channelRooms.set(channelId, new Set());
            }
            channelRooms.get(channelId)!.add(socket);
            break;
          }

          case 'leave': {
            const { channelId } = msg;
            if (!channelId) break;
            socket.channels.delete(channelId);
            channelRooms.get(channelId)?.delete(socket);
            if (channelRooms.get(channelId)?.size === 0) {
              channelRooms.delete(channelId);
            }
            break;
          }

          case 'typing': {
            const { channelId } = msg;
            if (!channelId) break;
            broadcastToChannel(channelId, {
              type: 'typing',
              userId: socket.userId,
              channelId,
            }, socket.userId);
            break;
          }

          case 'stop_typing': {
            const { channelId } = msg;
            if (!channelId) break;
            broadcastToChannel(channelId, {
              type: 'stop_typing',
              userId: socket.userId,
              channelId,
            }, socket.userId);
            break;
          }
        }
      } catch (err) {
        console.error('[WS] Invalid message:', err);
      }
    });

    socket.on('close', () => {
      console.log(`[WS] User ${socket.userId} disconnected`);
      userSockets.get(socket.userId)?.delete(socket);
      if (userSockets.get(socket.userId)?.size === 0) {
        userSockets.delete(socket.userId);
      }
      // Remove from all channel rooms
      for (const channelId of socket.channels) {
        channelRooms.get(channelId)?.delete(socket);
        if (channelRooms.get(channelId)?.size === 0) {
          channelRooms.delete(channelId);
        }
      }
    });

    socket.on('error', (err) => {
      console.error('[WS] Socket error:', err);
    });
  });

  return wss;
}

export function broadcastToChannel(channelId: string, data: object, excludeUserId?: string) {
  const room = channelRooms.get(channelId);
  if (!room) return;

  const payload = JSON.stringify(data);
  for (const socket of room) {
    if (socket.userId !== excludeUserId && socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

export function sendToUser(userId: string, data: object) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  const payload = JSON.stringify(data);
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

export function getOnlineMembers(channelId: string): string[] {
  const room = channelRooms.get(channelId);
  if (!room) return [];
  return Array.from(room).map((s) => s.userId);
}

export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}
