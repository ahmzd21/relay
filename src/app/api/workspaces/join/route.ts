import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { MemberRole } from '@prisma/client';

// POST: Join an existing workspace via invite code
export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code || !code.trim()) {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
  }

  // Find workspace by invite code stored in settings or use workspace ID directly
  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { id: code.trim() },
        {
          settings: {
            path: ['inviteCode'],
            equals: code.trim(),
          },
        },
      ],
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: 'Invalid invite code. No workspace found.' }, { status: 404 });
  }

  // Check if user is already a member
  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: sessionUser.userId,
      },
    },
  });

  if (existingMembership) {
    return NextResponse.json({
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
      userId: sessionUser.userId,
      workspaceId: workspace.id,
      role: MemberRole.MEMBER,
    },
  });

  return NextResponse.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      type: workspace.type === 'PERSONAL' ? 'personal' : 'organization',
      role: membership.role === MemberRole.OWNER ? 'owner' : membership.role === MemberRole.ADMIN ? 'admin' : 'member',
    },
  }, { status: 201 });
}
