import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { WorkspaceType, MemberRole, InviteStatus } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// All workspace routes require authentication
router.use(authMiddleware);

// --- Helper: verify caller is a member of the workspace with minimum role ---
async function requireMembership(userId: string, workspaceId: string, minRole: 'owner' | 'admin' | 'member' = 'member') {
  const hierarchy = { owner: 3, admin: 2, member: 1 };
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!membership || hierarchy[membership.role.toLowerCase() as keyof typeof hierarchy] < hierarchy[minRole]) {
    return null;
  }
  return membership;
}

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

// =====================================================
// MEMBERS
// =====================================================

// --- GET /api/workspaces/:id/members ---
router.get('/:id/members', async (req, res: Response) => {
  try {
    const membership = await requireMembership(req.user!.userId, req.params.id);
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.params.id },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, avatar: true, createdAt: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return res.json({
      members: members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        fullName: m.user.fullName,
        avatar: m.user.avatar,
        role: m.role.toLowerCase() as string,
        joinedAt: m.joinedAt,
        createdAt: m.user.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get members error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PATCH /api/workspaces/:id/members/:userId (change role) ---
router.patch('/:id/members/:userId', async (req, res: Response) => {
  try {
    const callerMembership = await requireMembership(req.user!.userId, req.params.id, 'admin');
    if (!callerMembership) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { role } = req.body;
    if (!role || !['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Valid role required (owner, admin, member)' });
    }

    const targetRole = role.toUpperCase() as MemberRole;
    const targetUserId = req.params.userId;

    // Prevent removing the last owner
    if (targetRole !== MemberRole.OWNER) {
      const owners = await prisma.workspaceMember.count({
        where: { workspaceId: req.params.id, role: MemberRole.OWNER },
      });
      const targetIsOwner = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: req.params.id, userId: targetUserId } },
      });
      if (targetIsOwner?.role === MemberRole.OWNER && owners <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last owner' });
      }
    }

    // Only owner can promote to owner
    if (targetRole === MemberRole.OWNER && callerMembership.role !== MemberRole.OWNER) {
      return res.status(403).json({ error: 'Only the owner can transfer ownership' });
    }

    const updated = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: req.params.id, userId: targetUserId } },
      data: { role: targetRole },
      include: { user: { select: { id: true, email: true, fullName: true, avatar: true } } },
    });

    return res.json({
      member: {
        id: updated.user.id,
        email: updated.user.email,
        fullName: updated.user.fullName,
        avatar: updated.user.avatar,
        role: updated.role.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DELETE /api/workspaces/:id/members/:userId (remove member) ---
router.delete('/:id/members/:userId', async (req, res: Response) => {
  try {
    const callerMembership = await requireMembership(req.user!.userId, req.params.id, 'admin');
    if (!callerMembership) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const targetUserId = req.params.userId;

    // Owner cannot remove themselves
    if (targetUserId === req.user!.userId && callerMembership.role === MemberRole.OWNER) {
      return res.status(400).json({ error: 'Owner cannot remove themselves. Transfer ownership first.' });
    }

    // Prevent removing the last owner
    const targetMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: req.params.id, userId: targetUserId } },
    });
    if (targetMembership?.role === MemberRole.OWNER) {
      const owners = await prisma.workspaceMember.count({
        where: { workspaceId: req.params.id, role: MemberRole.OWNER },
      });
      if (owners <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last owner' });
      }
    }

    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId: req.params.id, userId: targetUserId } },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// INVITES
// =====================================================

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateInviteCode(): string {
  return 'RELAY-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// --- POST /api/workspaces/:id/invite (create email invite) ---
router.post('/:id/invite', async (req, res: Response) => {
  try {
    const callerMembership = await requireMembership(req.user!.userId, req.params.id, 'admin');
    if (!callerMembership) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { email, role } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const inviteRole = (role || 'member').toUpperCase() as MemberRole;
    if (!['ADMIN', 'MEMBER'].includes(inviteRole)) {
      return res.status(400).json({ error: 'Role must be admin or member' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: req.params.id, userId: existingUser.id } },
      });
      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member of this workspace' });
      }
    }

    // Revoke any existing pending invites for this email + workspace
    await prisma.invite.updateMany({
      where: { workspaceId: req.params.id, email: trimmedEmail, status: InviteStatus.PENDING },
      data: { status: InviteStatus.REVOKED },
    });

    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: {
        workspaceId: req.params.id,
        email: trimmedEmail,
        role: inviteRole,
        invitedById: req.user!.userId,
        token,
        expiresAt,
      },
      include: {
        workspace: { select: { name: true } },
        invitedBy: { select: { fullName: true } },
      },
    });

    // Send email (non-blocking — don't fail the route if email fails)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${FRONTEND_URL}/invite?token=${token}`;
    import('../lib/email.js')
      .then((mod) => mod.sendInviteEmail(trimmedEmail, inviteUrl, invite.workspace.name, invite.invitedBy.fullName))
      .catch((err) => console.error('Failed to send invite email:', err));

    return res.status(201).json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role.toLowerCase(),
        status: invite.status.toLowerCase(),
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    console.error('Create invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/workspaces/:id/invite/resend/:inviteId ---
router.post('/:id/invite/resend/:inviteId', async (req, res: Response) => {
  try {
    const callerMembership = await requireMembership(req.user!.userId, req.params.id, 'admin');
    if (!callerMembership) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const invite = await prisma.invite.findFirst({
      where: { id: req.params.inviteId, workspaceId: req.params.id, status: InviteStatus.PENDING },
      include: {
        workspace: { select: { name: true } },
        invitedBy: { select: { fullName: true } },
      },
    });
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found or no longer pending' });
    }

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${FRONTEND_URL}/invite?token=${invite.token}`;
    import('../lib/email.js')
      .then((mod) => mod.sendInviteEmail(invite.email, inviteUrl, invite.workspace.name, invite.invitedBy.fullName))
      .catch((err) => console.error('Failed to resend invite email:', err));

    return res.json({ success: true });
  } catch (error) {
    console.error('Resend invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DELETE /api/workspaces/:id/invite/:inviteId (revoke) ---
router.delete('/:id/invite/:inviteId', async (req, res: Response) => {
  try {
    const callerMembership = await requireMembership(req.user!.userId, req.params.id, 'admin');
    if (!callerMembership) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const invite = await prisma.invite.findFirst({
      where: { id: req.params.inviteId, workspaceId: req.params.id },
    });
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: InviteStatus.REVOKED },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Revoke invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GET /api/workspaces/:id/invites (list pending invites) ---
router.get('/:id/invites', async (req, res: Response) => {
  try {
    const membership = await requireMembership(req.user!.userId, req.params.id);
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const invites = await prisma.invite.findMany({
      where: { workspaceId: req.params.id, status: InviteStatus.PENDING },
      include: { invitedBy: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      invites: invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role.toLowerCase(),
        status: inv.status.toLowerCase(),
        invitedBy: inv.invitedBy.fullName,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get invites error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/workspaces/:id/invite/regenerate-code ---
router.post('/:id/invite/regenerate-code', async (req, res: Response) => {
  try {
    const callerMembership = await requireMembership(req.user!.userId, req.params.id, 'admin');
    if (!callerMembership) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const inviteCode = generateInviteCode();
    await prisma.workspace.update({
      where: { id: req.params.id },
      data: { settings: { ...((await prisma.workspace.findUnique({ where: { id: req.params.id } }))?.settings as object || {}), inviteCode } },
    });

    return res.json({ inviteCode });
  } catch (error) {
    console.error('Regenerate invite code error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// WORKSPACE SETTINGS & DELETION
// =====================================================

// --- PATCH /api/workspaces/:id (update settings) ---
router.patch('/:id', async (req, res: Response) => {
  try {
    const callerMembership = await requireMembership(req.user!.userId, req.params.id, 'owner');
    if (!callerMembership) {
      return res.status(403).json({ error: 'Only the owner can update workspace settings' });
    }

    const { settings, name } = req.body;
    const updateData: Record<string, unknown> = {};

    if (name && typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    if (settings && typeof settings === 'object') {
      const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });
      updateData.settings = { ...((workspace?.settings as object) || {}), ...settings };
    }

    const updated = await prisma.workspace.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return res.json({
      workspace: {
        id: updated.id,
        name: updated.name,
        settings: updated.settings,
      },
    });
  } catch (error) {
    console.error('Update workspace error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DELETE /api/workspaces/:id ---
router.delete('/:id', async (req, res: Response) => {
  try {
    const callerMembership = await requireMembership(req.user!.userId, req.params.id, 'owner');
    if (!callerMembership) {
      return res.status(403).json({ error: 'Only the owner can delete a workspace' });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    if (workspace.type === WorkspaceType.PERSONAL) {
      return res.status(400).json({ error: 'Cannot delete personal workspace' });
    }

    // Delete the workspace (cascade deletes members, invites)
    await prisma.workspace.delete({ where: { id: req.params.id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete workspace error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
