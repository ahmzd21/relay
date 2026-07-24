import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_relay_jwt_secret_key_change_me'
);

export interface SessionUser {
  userId: string;
  email: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('relay_session');

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
    if (payload && typeof payload.userId === 'string') {
      return {
        userId: payload.userId,
        email: payload.email as string,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get session user:', error);
    return null;
  }
}
