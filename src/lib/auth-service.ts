import { prisma } from '@/lib/prisma';
import { WorkspaceType, MemberRole } from '@prisma/client';

export interface RegisterUserInput {
  email: string;
  fullName: string;
  passwordHash: string;
}

/**
 * Atomically registers a new user and creates their default Personal Workspace
 * with OWNER membership via a Prisma transaction.
 */
export async function registerUserWithDefaultWorkspace(input: RegisterUserInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create the user
    const user = await tx.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash: input.passwordHash,
      },
    });

    // 2. Create the default personal workspace
    const workspace = await tx.workspace.create({
      data: {
        name: `${input.fullName}'s Personal Workspace`,
        type: WorkspaceType.PERSONAL,
        subscriptionTier: 'FREE',
        settings: {},
      },
    });

    // 3. Link user as OWNER of the workspace
    const membership = await tx.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: MemberRole.OWNER,
      },
    });

    return {
      user,
      workspace,
      membership,
    };
  });
}
