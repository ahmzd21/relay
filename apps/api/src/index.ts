import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import notificationRoutes from './routes/notifications.js';
import meetingsRoutes from './routes/meetings.js';
import externalMeetingsRoutes from './routes/external-meetings.js';

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/meetings/external', externalMeetingsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
});
