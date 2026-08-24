import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { ChannelRole } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { broadcastToChannel } from '../lib/ws.js';
import multer from 'multer';
import cloudinary from '../lib/cloudinary.js';

const router = Router();

function p(val: unknown): string {
  return Array.isArray(val) ? val[0] : String(val);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// ===========================
// CHANNEL CRUD
// ===========================

// --- GET /api/channels?workspaceId=... ---
router.get('/', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const workspaceId = p(req.query.workspaceId);

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    const wsMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!wsMember) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const channels = await prisma.channel.findMany({
      where: { workspaceId },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            user: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { fullName: true } },
          },
        },
        _count: { select: { members: true, messages: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({
      channels: channels.map((ch) => ({
        ...ch,
        memberCount: ch._count.members,
        messageCount: ch._count.messages,
        lastMessage: ch.messages[0] || null,
        isMember: ch.members.some((m: { userId: string }) => m.userId === userId),
        myRole: ch.members.find((m: { userId: string; role: ChannelRole }) => m.userId === userId)?.role || null,
      })),
    });
  } catch (error) {
    console.error('List channels error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/channels ---
router.post('/', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { workspaceId, name, description } = req.body;

    if (!workspaceId || !name?.trim()) {
      return res.status(400).json({ error: 'workspaceId and name are required' });
    }

    const trimmedName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ error: 'Channel name must be 2-50 characters' });
    }

    const wsMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!wsMember) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const existing = await prisma.channel.findUnique({
      where: { workspaceId_name: { workspaceId, name: trimmedName } },
    });
    if (existing) {
      return res.status(409).json({ error: 'A channel with this name already exists' });
    }

    const channel = await prisma.channel.create({
      data: {
        workspaceId,
        name: trimmedName,
        description: description?.trim() || null,
        createdBy: userId,
        members: {
          create: { userId, role: ChannelRole.OWNER },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            user: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        _count: { select: { members: true } },
      },
    });

    return res.status(201).json({
      channel: {
        ...channel,
        memberCount: channel._count.members,
        isMember: true,
        myRole: ChannelRole.OWNER,
      },
    });
  } catch (error) {
    console.error('Create channel error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GET /api/channels/:id ---
router.get('/:id', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = p(req.params.id);

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            lastReadAt: true,
            joinedAt: true,
            user: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        _count: { select: { members: true, messages: true } },
      },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const membership = channel.members.find((m: { userId: string }) => m.userId === userId);
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this channel' });
    }

    return res.json({
      channel: {
        ...channel,
        memberCount: channel._count.members,
        messageCount: channel._count.messages,
        isMember: true,
        myRole: membership.role,
      },
    });
  } catch (error) {
    console.error('Get channel error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PATCH /api/channels/:id ---
router.patch('/:id', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = p(req.params.id);
    const { name, description, settings } = req.body;

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: id, userId } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this channel' });
    }
    if (membership.role !== ChannelRole.OWNER && membership.role !== ChannelRole.ADMIN) {
      return res.status(403).json({ error: 'Only owners and admins can update channels' });
    }

    const channel = await prisma.channel.findUnique({ where: { id } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      const trimmedName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res.status(400).json({ error: 'Channel name must be 2-50 characters' });
      }
      if (trimmedName !== channel.name) {
        const existing = await prisma.channel.findUnique({
          where: { workspaceId_name: { workspaceId: channel.workspaceId, name: trimmedName } },
        });
        if (existing) {
          return res.status(409).json({ error: 'A channel with this name already exists' });
        }
      }
      updateData.name = trimmedName;
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (settings !== undefined) {
      const currentSettings = (channel.settings as Record<string, unknown>) || {};
      updateData.settings = { ...currentSettings, ...settings };
    }

    const updated = await prisma.channel.update({
      where: { id },
      data: updateData,
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            user: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        _count: { select: { members: true } },
      },
    });

    broadcastToChannel(id, { type: 'channel:updated', channel: updated });
    return res.json({ channel: updated });
  } catch (error) {
    console.error('Update channel error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DELETE /api/channels/:id ---
router.delete('/:id', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = p(req.params.id);

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: id, userId } },
    });
    if (!membership || membership.role !== ChannelRole.OWNER) {
      return res.status(403).json({ error: 'Only the channel owner can delete it' });
    }

    broadcastToChannel(id, { type: 'channel:deleted', channelId: id });
    await prisma.channel.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete channel error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================
// CHANNEL MEMBERS
// ===========================

// --- POST /api/channels/:id/join ---
router.post('/:id/join', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = p(req.params.id);

    const channel = await prisma.channel.findUnique({ where: { id } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const wsMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: channel.workspaceId, userId } },
    });
    if (!wsMember) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const existing = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: id, userId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Already a member' });
    }

    const member = await prisma.channelMember.create({
      data: { channelId: id, userId, role: ChannelRole.MEMBER },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    });

    broadcastToChannel(id, { type: 'member:joined', member });
    return res.status(201).json({ member });
  } catch (error) {
    console.error('Join channel error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/channels/:id/leave ---
router.post('/:id/leave', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = p(req.params.id);

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: id, userId } },
    });
    if (!membership) return res.status(404).json({ error: 'Not a member of this channel' });
    if (membership.role === ChannelRole.OWNER) {
      return res.status(400).json({ error: 'Owners must transfer ownership before leaving' });
    }

    broadcastToChannel(id, { type: 'member:left', userId });
    await prisma.channelMember.delete({
      where: { channelId_userId: { channelId: id, userId } },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Leave channel error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GET /api/channels/:id/members ---
router.get('/:id/members', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = p(req.params.id);

    const isMember = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: id, userId } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not a member of this channel' });

    const members = await prisma.channelMember.findMany({
      where: { channelId: id },
      include: {
        user: { select: { id: true, fullName: true, avatar: true, email: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return res.json({ members });
  } catch (error) {
    console.error('List members error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PATCH /api/channels/:id/members/:memberId ---
router.patch('/:id/members/:memberId', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = p(req.params.id);
    const memberId = p(req.params.memberId);
    const { role } = req.body;

    if (!role || !Object.values(ChannelRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const myMembership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: id, userId } },
    });
    if (!myMembership || (myMembership.role !== ChannelRole.OWNER && myMembership.role !== ChannelRole.ADMIN)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (role === ChannelRole.OWNER && myMembership.role !== ChannelRole.OWNER) {
      return res.status(403).json({ error: 'Only owners can assign owner role' });
    }

    const targetMembership = await prisma.channelMember.findUnique({ where: { id: memberId } });
    if (!targetMembership || targetMembership.channelId !== id) {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (targetMembership.role === ChannelRole.OWNER && myMembership.role !== ChannelRole.OWNER) {
      return res.status(403).json({ error: 'Only owners can change owner role' });
    }

    const updated = await prisma.channelMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    });

    broadcastToChannel(id, { type: 'member:updated', member: updated });
    return res.json({ member: updated });
  } catch (error) {
    console.error('Update member role error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DELETE /api/channels/:id/members/:memberId ---
router.delete('/:id/members/:memberId', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = p(req.params.id);
    const memberId = p(req.params.memberId);

    const myMembership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: id, userId } },
    });
    if (!myMembership || (myMembership.role !== ChannelRole.OWNER && myMembership.role !== ChannelRole.ADMIN)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const targetMembership = await prisma.channelMember.findUnique({ where: { id: memberId } });
    if (!targetMembership || targetMembership.channelId !== id) {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (targetMembership.role === ChannelRole.OWNER) {
      return res.status(403).json({ error: 'Cannot remove the owner' });
    }

    broadcastToChannel(id, { type: 'member:left', userId: targetMembership.userId });
    await prisma.channelMember.delete({ where: { id: memberId } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================
// MESSAGES
// ===========================

// --- GET /api/channels/:channelId/messages ---
router.get('/:channelId/messages', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const channelId = p(req.params.channelId);
    const before = p(req.query.before);
    const limit = p(req.query.limit) || '50';

    const isMember = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not a member of this channel' });

    const take = Math.min(parseInt(limit, 10) || 50, 100);

    const where: Record<string, unknown> = {
      channelId,
      deletedAt: null,
      replyToId: null,
    };

    if (before) {
      const cursorMessage = await prisma.channelMessage.findUnique({ where: { id: before } });
      if (cursorMessage) {
        where.createdAt = { lt: cursorMessage.createdAt };
      }
    }

    const messages = await prisma.channelMessage.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        mentions: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        attachments: true,
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    await prisma.channelMember.update({
      where: { channelId_userId: { channelId, userId } },
      data: { lastReadAt: new Date() },
    });

    return res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('List messages error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/channels/:channelId/messages ---
router.post('/:channelId/messages', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const channelId = p(req.params.channelId);
    const { content, replyToId, attachmentIds } = req.body;

    if (!content?.trim() && (!attachmentIds || attachmentIds.length === 0)) {
      return res.status(400).json({ error: 'Message content or attachments are required' });
    }

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this channel' });

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const settings = (channel.settings as Record<string, unknown>) || {};
    if (settings.isReadOnly && membership.role === ChannelRole.MEMBER) {
      return res.status(403).json({ error: 'This channel is read-only' });
    }

    if (replyToId) {
      const parent = await prisma.channelMessage.findFirst({
        where: { id: replyToId, channelId, deletedAt: null },
      });
      if (!parent) return res.status(400).json({ error: 'Reply target not found' });
    }

    const message = await prisma.channelMessage.create({
      data: {
        channelId,
        userId,
        content: content?.trim() || '',
        replyToId: replyToId || null,
      },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        mentions: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        attachments: true,
        _count: { select: { replies: true } },
      },
    });

    // Attach files if provided
    if (attachmentIds && attachmentIds.length > 0) {
      for (const att of attachmentIds) {
        if (att.url && att.fileName) {
          await prisma.messageAttachment.create({
            data: {
              messageId: message.id,
              fileName: att.fileName,
              fileSize: att.fileSize || 0,
              mimeType: att.mimeType || 'application/octet-stream',
              url: att.url,
            },
          });
        }
      }

      const updated = await prisma.channelMessage.findUnique({
        where: { id: message.id },
        include: {
          user: { select: { id: true, fullName: true, avatar: true } },
          mentions: {
            include: { user: { select: { id: true, fullName: true } } },
          },
          attachments: true,
          _count: { select: { replies: true } },
        },
      });

      broadcastToChannel(channelId, { type: 'message', message: updated });
      return res.status(201).json({ message: updated });
    }

    // Parse @mentions
    if (content) {
      const mentionPattern = /@([\w.-]+)/g;
      let match;
      while ((match = mentionPattern.exec(content)) !== null) {
        const mentionedName = match[1];
        const mentionedUser = await prisma.user.findFirst({
          where: {
            fullName: { contains: mentionedName, mode: 'insensitive' },
          },
        });
        if (mentionedUser && mentionedUser.id !== userId) {
          await prisma.channelMention.create({
            data: { messageId: message.id, userId: mentionedUser.id },
          });
        }
      }
    }

    broadcastToChannel(channelId, { type: 'message', message });
    return res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PATCH /api/channels/:channelId/messages/:id ---
router.patch('/:channelId/messages/:id', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const channelId = p(req.params.channelId);
    const id = p(req.params.id);
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await prisma.channelMessage.findFirst({
      where: { id, channelId, deletedAt: null },
    });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.userId !== userId) {
      return res.status(403).json({ error: 'Can only edit your own messages' });
    }

    const updated = await prisma.channelMessage.update({
      where: { id },
      data: { content: content.trim(), editedAt: new Date() },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        mentions: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        attachments: true,
        _count: { select: { replies: true } },
      },
    });

    broadcastToChannel(channelId, { type: 'message:edited', message: updated });
    return res.json({ message: updated });
  } catch (error) {
    console.error('Edit message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DELETE /api/channels/:channelId/messages/:id ---
router.delete('/:channelId/messages/:id', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const channelId = p(req.params.channelId);
    const id = p(req.params.id);

    const message = await prisma.channelMessage.findFirst({
      where: { id, channelId, deletedAt: null },
    });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    const canDelete = message.userId === userId ||
      membership?.role === ChannelRole.OWNER ||
      membership?.role === ChannelRole.ADMIN;

    if (!canDelete) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await prisma.channelMessage.update({
      where: { id },
      data: { deletedAt: new Date(), content: '' },
    });

    broadcastToChannel(channelId, { type: 'message:deleted', messageId: id });
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GET /api/channels/:channelId/messages/:id/thread ---
router.get('/:channelId/messages/:id/thread', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const channelId = p(req.params.channelId);
    const id = p(req.params.id);

    const isMember = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    const parent = await prisma.channelMessage.findFirst({
      where: { id, channelId, deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        mentions: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        attachments: true,
      },
    });
    if (!parent) return res.status(404).json({ error: 'Message not found' });

    const replies = await prisma.channelMessage.findMany({
      where: { replyToId: id, deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        mentions: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ parent, replies });
  } catch (error) {
    console.error('Get thread error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================
// FILE UPLOAD
// ===========================

// --- POST /api/channels/upload ---
router.post('/upload', authMiddleware, (req, res: Response) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 25MB.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const file = req.file;
      const isImage = file.mimetype.startsWith('image/');

      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'channel-attachments',
            public_id: `att-${req.user!.userId}-${Date.now()}`,
            resource_type: isImage ? 'image' : 'video',
            ...(isImage ? { transformation: [{ width: 1200, crop: 'limit' }] } : {}),
          },
          (error, result) => {
            if (error || !result) return reject(error || new Error('Upload failed'));
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      return res.json({
        attachment: {
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          url: result.secure_url,
        },
      });
    } catch (error) {
      console.error('Channel file upload error:', error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  });
});

// ===========================
// CHANNEL MEETINGS
// ===========================

// --- POST /api/channels/:channelId/meetings ---
router.post('/:channelId/meetings', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const channelId = p(req.params.channelId);
    const { title, meetingType = 'native', language } = req.body;

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this channel' });

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const roomName = meetingType === 'native'
      ? `channel-${channelId}-${Date.now()}`
      : null;

    const meeting = await prisma.channelMeeting.create({
      data: {
        channelId,
        createdById: userId,
        title: title || `${channel.name} meeting`,
        meetingType,
        roomName,
        status: 'starting',
        language: language || 'en',
      },
    });

    broadcastToChannel(channelId, { type: 'meeting:started', meeting });
    return res.status(201).json({ meeting });
  } catch (error) {
    console.error('Start meeting error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/channels/:channelId/meetings/:meetingId/end ---
router.post('/:channelId/meetings/:meetingId/end', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const channelId = p(req.params.channelId);
    const meetingId = p(req.params.meetingId);

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this channel' });

    const meeting = await prisma.channelMeeting.findFirst({
      where: { id: meetingId, channelId },
    });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    if (meeting.createdById !== userId && membership.role === ChannelRole.MEMBER) {
      return res.status(403).json({ error: 'Only the meeting creator can end it' });
    }

    const updated = await prisma.channelMeeting.update({
      where: { id: meetingId },
      data: { status: 'ended', endedAt: new Date() },
    });

    broadcastToChannel(channelId, { type: 'meeting:ended', meeting: updated });
    return res.json({ meeting: updated });
  } catch (error) {
    console.error('End meeting error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GET /api/channels/:channelId/meetings ---
router.get('/:channelId/meetings', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const channelId = p(req.params.channelId);
    const limit = p(req.query.limit) || '20';

    const isMember = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!isMember) return res.status(403).json({ error: 'Not a member' });

    const take = Math.min(parseInt(limit, 10) || 20, 50);

    const meetings = await prisma.channelMeeting.findMany({
      where: { channelId },
      include: {
        creator: { select: { id: true, fullName: true, avatar: true } },
      },
      orderBy: { startedAt: 'desc' },
      take,
    });

    return res.json({ meetings });
  } catch (error) {
    console.error('List meetings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
