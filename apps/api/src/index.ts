import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import inviteRoutes from './routes/invites.js';
import notificationRoutes from './routes/notifications.js';
import meetingsRoutes from './routes/meetings.js';
import externalMeetingsRoutes from './routes/external-meetings.js';
import channelRoutes from './routes/channels.js';
import statisticsRoutes from './routes/statistics.js';
import { initWebSocketServer } from './lib/ws.js';
import { cleanupStaleMeetings } from './lib/cleanup.js';

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/meetings/external', externalMeetingsRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/statistics', statisticsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server and attach WebSocket
const server = createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(`[WS] WebSocket server running on ws://localhost:${PORT}/ws`);

  // Run cleanup immediately on server startup
  cleanupStaleMeetings().catch((err) => {
    console.warn('[Startup] Initial cleanup error:', err);
  });
});

// Periodic cleanup of abandoned/stale meetings (every 2 minutes)
setInterval(() => {
  cleanupStaleMeetings().catch((err) => {
    console.warn('[Periodic] Cleanup error:', err);
  });
}, 2 * 60 * 1000);
