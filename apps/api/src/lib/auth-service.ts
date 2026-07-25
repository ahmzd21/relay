import { prisma } from './prisma.js';
import { WorkspaceType, MemberRole } from '@prisma/client';
import crypto from 'node:crypto';

export interface RegisterUserInput {
  email: string;
  fullName: string;
  passwordHash: string;
}

export interface GoogleUserInput {
  email: string;
  fullName: string;
  avatar: string | null;
  providerAccountId: string;
}

export async function registerUserWithDefaultWorkspace(input: RegisterUserInput) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash: input.passwordHash,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: `${input.fullName}'s Personal Workspace`,
        type: WorkspaceType.PERSONAL,
        subscriptionTier: 'FREE',
        settings: {},
      },
    });

    const membership = await tx.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: MemberRole.OWNER,
      },
    });

    return { user, workspace, membership };
  });
}

export async function findOrCreateGoogleUser(input: GoogleUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    return { user: existingUser, isNewUser: false };
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        avatar: input.avatar,
        provider: 'google',
        providerAccountId: input.providerAccountId,
        emailVerified: new Date(),
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: `${input.fullName}'s Personal Workspace`,
        type: WorkspaceType.PERSONAL,
        subscriptionTier: 'FREE',
        settings: {},
      },
    });

    const membership = await tx.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: MemberRole.OWNER,
      },
    });

    return { user, workspace, membership };
  });

  return { user: result.user, isNewUser: true };
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createVerificationToken(userId: string): Promise<string> {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
    },
  });

  return token;
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; userId?: string }> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return { success: false };
  }

  if (new Date() > verificationToken.expiresAt) {
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
    return { success: false };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    });

    await tx.verificationToken.delete({
      where: { id: verificationToken.id },
    });
  });

  return { success: true, userId: verificationToken.userId };
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      type: 'PASSWORD_RESET',
      expiresAt,
    },
  });

  return token;
}

export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean; userId?: string }> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.type !== 'PASSWORD_RESET') {
    return { success: false };
  }

  if (new Date() > verificationToken.expiresAt) {
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
    return { success: false };
  }

  return { success: true, userId: verificationToken.userId };
}
