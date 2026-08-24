import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { MemberRole, InviteStatus } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function p(val: unknown): string {
  return Array.isArray(val) ? val[0] : String(val);
}

// --- GET /api/invites/:token (public — fetch invite details) ---
router.get('/:token', async (req, res: Response) => {
  try {
    const token = p(req.params.token);
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, name: true, type: true } },
        invitedBy: { select: { fullName: true } },
      },
    }) as Record<string, unknown> | null;

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite' });
    }

    if (invite.status !== InviteStatus.PENDING) {
      return res.status(400).json({ error: 'This invite has been revoked or already used' });
    }

    const expiresAt = invite.expiresAt as Date;
    if (new Date() > expiresAt) {
      return res.status(400).json({ error: 'This invite has expired' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: invite.email as string } });
    const isAlreadyMember = existingUser
      ? !!(await prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: invite.workspaceId as string, userId: existingUser.id } },
        }))
      : false;

    const workspace = invite.workspace as { id: string; name: string; type: string };
    const invitedBy = invite.invitedBy as { fullName: string };

    return res.json({
      invite: {
        email: invite.email,
        role: (invite.role as string).toLowerCase(),
        workspace: {
          id: workspace.id,
          name: workspace.name,
          type: workspace.type.toLowerCase(),
        },
        invitedBy: invitedBy.fullName,
        expiresAt: invite.expiresAt,
        hasAccount: !!existingUser,
        isAlreadyMember,
      },
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/invites/:token/accept (authenticated) ---
router.post('/:token/accept', authMiddleware, async (req, res: Response) => {
  try {
    const token = p(req.params.token);
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { workspace: true },
    }) as Record<string, unknown> | null;

    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite' });
    }

    if (invite.status !== InviteStatus.PENDING) {
      return res.status(400).json({ error: 'This invite has been revoked or already used' });
    }

    const expiresAt = invite.expiresAt as Date;
    if (new Date() > expiresAt) {
      return res.status(400).json({ error: 'This invite has expired' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (user.email.toLowerCase() !== (invite.email as string).toLowerCase()) {
      return res.status(403).json({ error: 'This invite was sent to a different email address' });
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId as string, userId: req.user!.userId } },
    });

    const workspace = invite.workspace as { id: string; name: string; type: string };

    if (existingMember) {
      return res.json({
        workspace: {
          id: workspace.id,
          name: workspace.name,
          type: workspace.type.toLowerCase(),
          role: existingMember.role.toLowerCase(),
        },
      });
    }

    const [membership] = await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          userId: req.user!.userId,
          workspaceId: invite.workspaceId as string,
          role: invite.role as MemberRole,
        },
      }),
      prisma.invite.update({
        where: { id: invite.id as string },
        data: { status: InviteStatus.ACCEPTED },
      }),
    ]);

    return res.status(201).json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        type: workspace.type.toLowerCase(),
        role: membership.role.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
