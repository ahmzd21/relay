import { NextResponse } from 'next/server';
import { registerUserWithDefaultWorkspace } from '@/lib/auth-service';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_relay_jwt_secret_key_change_me'
);

export async function POST(request: Request) {
  try {
    const { email, fullName, password } = await request.json();

    if (!email || !fullName || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await registerUserWithDefaultWorkspace({
      email,
      fullName,
      passwordHash,
    });

    // Auto-login session cookie after successful registration so they proceed straight to onboarding
    const token = await new SignJWT({ userId: result.user.id, email: result.user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    (await cookies()).set({
      name: 'relay_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, userId: result.user.id }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
