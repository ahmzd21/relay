import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { WorkspaceType, MemberRole } from '@prisma/client';

// GET: Fetch all workspaces the authenticated user belongs to
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: sessionUser.userId },
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

  return NextResponse.json({ workspaces });
}

// POST: Create a new Organization workspace (owner = creator)
export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
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
        userId: sessionUser.userId,
        workspaceId: workspace.id,
        role: MemberRole.OWNER,
      },
    });

    return { workspace, membership };
  });

  return NextResponse.json({
    workspace: {
      id: result.workspace.id,
      name: result.workspace.name,
      type: 'organization',
      role: 'owner',
    },
  }, { status: 201 });
}
