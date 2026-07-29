import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// --- POST /api/notifications/subscribe ---
const subscribeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  deviceInfo: z.string().optional(),
});

router.post('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const body = subscribeSchema.parse(req.body);
    const userId = req.user!.userId;

    await prisma.pushSubscription.upsert({
      where: { userId_token: { userId, token: body.token } },
      update: { deviceInfo: body.deviceInfo || null },
      create: {
        userId,
        token: body.token,
        deviceInfo: body.deviceInfo || null,
      },
    });

    return res.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Subscribe error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DELETE /api/notifications/unsubscribe ---
const unsubscribeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

router.delete('/unsubscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const body = unsubscribeSchema.parse(req.body);
    const userId = req.user!.userId;

    await prisma.pushSubscription.deleteMany({
      where: { userId, token: body.token },
    });

    return res.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GET /api/notifications/preferences ---
router.get('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { settings: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const settings = (user.settings || {}) as Record<string, unknown>;
    const notifications = (settings.notifications || {}) as Record<string, unknown>;

    const subscriptionCount = await prisma.pushSubscription.count({
      where: { userId: req.user!.userId },
    });

    return res.json({
      preferences: {
        email: notifications.email ?? true,
        push: notifications.push ?? true,
      },
      deviceCount: subscriptionCount,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PATCH /api/notifications/preferences ---
const preferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
});

router.patch('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const body = preferencesSchema.parse(req.body);
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentSettings = (user.settings || {}) as Record<string, unknown>;
    const currentNotifications = (currentSettings.notifications || {}) as Record<string, unknown>;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...currentSettings,
          notifications: {
            ...currentNotifications,
            ...body,
          },
        },
      },
      select: { settings: true },
    });

    const newSettings = (updatedUser.settings || {}) as Record<string, unknown>;
    const newNotifications = (newSettings.notifications || {}) as Record<string, unknown>;

    return res.json({
      success: true,
      preferences: {
        email: newNotifications.email ?? true,
        push: newNotifications.push ?? true,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update preferences error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
