import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { WorkspaceType, MemberRole } from '@prisma/client';

// POST: Complete onboarding - create org workspace if needed, save preferences
export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    workspaceType, // 'personal' | 'organization'
    orgName,
    jobRole,
    speakingLanguage,
    hearingLanguage,
    subtitleLanguage,
    selectedVoice,
  } = await request.json();

  const preferences = {
    jobRole: jobRole || '',
    speakingLanguage: speakingLanguage || 'English',
    hearingLanguage: hearingLanguage || 'Spanish',
    subtitleLanguage: subtitleLanguage || 'English',
    selectedVoice: selectedVoice || 'natural',
  };

  // Save user preferences
  await prisma.user.update({
    where: { id: sessionUser.userId },
    data: { settings: preferences },
  });

  if (workspaceType === 'organization') {
    // Find the user's personal workspace to use its name as basis for org name
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: orgName || `${(await tx.user.findUnique({ where: { id: sessionUser.userId } }))?.fullName}'s Organization`,
          type: WorkspaceType.ORGANIZATION,
          subscriptionTier: 'FREE',
          settings: {
            inviteCode,
            accentColor: 'indigo',
            ...preferences,
          },
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

  // Personal workspace type - mark onboarding as complete, update personal workspace settings
  const personalMembership = await prisma.workspaceMember.findFirst({
    where: {
      userId: sessionUser.userId,
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

  return NextResponse.json({ success: true });
}
