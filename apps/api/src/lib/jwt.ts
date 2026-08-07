import { SignJWT, jwtVerify } from 'jose';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  return new TextEncoder().encode(secret);
};

export interface SessionUser {
  userId: string;
  email: string;
}

export async function signSessionToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload && typeof payload.userId === 'string' && typeof payload.email === 'string') {
      return {
        userId: payload.userId,
        email: payload.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// --- 2FA temporary tokens (5-minute expiry) ---

export async function signTempToken(userId: string): Promise<string> {
  return new SignJWT({ userId, purpose: '2fa-login' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getJwtSecret());
}

export async function verifyTempToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload && typeof payload.userId === 'string' && payload.purpose === '2fa-login') {
      return { userId: payload.userId };
    }
    return null;
  } catch {
    return null;
  }
}
