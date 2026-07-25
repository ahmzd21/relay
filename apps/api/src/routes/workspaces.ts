import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { WorkspaceType, MemberRole } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All workspace routes require authentication
router.use(authMiddleware);

// --- GET /api/workspaces ---
router.get('/', async (req, res: Response) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user!.userId },
      include: { workspace: true },
    });

    const workspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      type: m.workspace.type === WorkspaceType.PERSONAL ? 'personal' : 'organization',
      role: m.role === MemberRole.OWNER ? 'owner' : m.role === MemberRole.ADMIN ? 'admin' : 'member',
      settings: m.workspace.settings,
      subscriptionTier: m.workspace.subscriptionTier,
      minutesUsed: m.workspace.minutesUsed,
      minutesLimit: m.workspace.minutesLimit,
    }));

    return res.json({ workspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/workspaces ---
router.post('/', async (req, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: name.trim(),
          type: WorkspaceType.ORGANIZATION,
          subscriptionTier: 'FREE',
          settings: {},
        },
      });

      const membership = await tx.workspaceMember.create({
        data: {
          userId: req.user!.userId,
          workspaceId: workspace.id,
          role: MemberRole.OWNER,
        },
      });

      return { workspace, membership };
    });

    return res.status(201).json({
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        type: 'organization',
        role: 'owner',
      },
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/workspaces/join ---
router.post('/join', async (req, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { id: code.trim() },
          { settings: { path: ['inviteCode'], equals: code.trim() } },
        ],
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Invalid invite code. No workspace found.' });
    }

    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: req.user!.userId,
        },
      },
    });

    if (existingMembership) {
      return res.json({
        workspace: {
          id: workspace.id,
          name: workspace.name,
          type: workspace.type === 'PERSONAL' ? 'personal' : 'organization',
          role: existingMembership.role === MemberRole.OWNER ? 'owner' : existingMembership.role === MemberRole.ADMIN ? 'admin' : 'member',
        },
      });
    }

    const membership = await prisma.workspaceMember.create({
      data: {
        userId: req.user!.userId,
        workspaceId: workspace.id,
        role: MemberRole.MEMBER,
      },
    });

    return res.status(201).json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        type: workspace.type === 'PERSONAL' ? 'personal' : 'organization',
        role: 'member',
      },
    });
  } catch (error) {
    console.error('Join workspace error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/workspaces/onboarding ---
router.post('/onboarding', async (req, res: Response) => {
  try {
    const {
      workspaceType,
      orgName,
      jobRole,
      speakingLanguage,
      hearingLanguage,
      subtitleLanguage,
      selectedVoice,
    } = req.body;

    const preferences = {
      jobRole: jobRole || '',
      speakingLanguage: speakingLanguage || 'English',
      hearingLanguage: hearingLanguage || 'Spanish',
      subtitleLanguage: subtitleLanguage || 'English',
      selectedVoice: selectedVoice || 'natural',
    };

    // Save user preferences
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { settings: preferences },
    });

    if (workspaceType === 'organization') {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: req.user!.userId } });
        const workspace = await tx.workspace.create({
          data: {
            name: orgName || `${user?.fullName}'s Organization`,
            type: WorkspaceType.ORGANIZATION,
            subscriptionTier: 'FREE',
            settings: { inviteCode, ...preferences },
          },
        });

        const membership = await tx.workspaceMember.create({
          data: {
            userId: req.user!.userId,
            workspaceId: workspace.id,
            role: MemberRole.OWNER,
          },
        });

        return { workspace, membership };
      });

      return res.json({
        success: true,
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
          type: 'organization',
          role: 'owner',
          inviteCode,
        },
      });
    }

    // Personal workspace path
    const personalMembership = await prisma.workspaceMember.findFirst({
      where: {
        userId: req.user!.userId,
        workspace: { type: WorkspaceType.PERSONAL },
      },
      include: { workspace: true },
    });

    if (personalMembership) {
      await prisma.workspace.update({
        where: { id: personalMembership.workspaceId },
        data: {
          settings: {
            ...((personalMembership.workspace.settings as object) || {}),
            onboardingComplete: true,
            ...preferences,
          },
        },
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
