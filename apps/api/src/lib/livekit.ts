import { RoomServiceClient } from 'livekit-server-sdk';

const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

export const roomService = new RoomServiceClient(
  livekitUrl.replace('ws://', 'http://').replace('wss://', 'https://'),
  apiKey,
  apiSecret
);
