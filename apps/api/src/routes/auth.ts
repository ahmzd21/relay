import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';
import { signSessionToken, signTempToken, verifyTempToken } from '../lib/jwt.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  registerUserWithDefaultWorkspace,
  findOrCreateGoogleUser,
  createVerificationToken,
  createPasswordResetToken,
  verifyEmailToken,
  verifyPasswordResetToken,
} from '../lib/auth-service.js';
import { normalizeEmail, isDisposableEmail, hasValidMxRecord } from '../lib/email-validation.js';
import multer from 'multer';
import cloudinary, { extractPublicId } from '../lib/cloudinary.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.js';
import {
  generateTwoFactorSecret,
  generateQRCodeDataUrl,
  verifyTwoFactorCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from '../lib/totp.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- GET /api/auth/me ---
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        provider: true,
        settings: true,
        twoFactorEnabled: true,
        createdAt: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, ...safeUser } = user;

    return res.json({ user: { ...safeUser, hasPassword: !!passwordHash } });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PATCH /api/auth/profile ---
const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100).optional(),
  jobRole: z.string().max(100).optional(),
});

router.patch('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const body = profileSchema.parse(req.body);

    if (!body.fullName && body.jobRole === undefined) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data: Record<string, unknown> = {};

    if (body.fullName) {
      data.fullName = body.fullName;
    }

    if (body.jobRole !== undefined) {
      const currentSettings = (user.settings || {}) as Record<string, unknown>;
      data.settings = { ...currentSettings, jobRole: body.jobRole };
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        provider: true,
        settings: true,
        twoFactorEnabled: true,
        createdAt: true,
        passwordHash: true,
      },
    });

    const { passwordHash, ...safeUser } = updatedUser;

    return res.json({ success: true, user: { ...safeUser, hasPassword: !!passwordHash } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Multer config (memory storage for Cloudinary) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

// --- POST /api/auth/avatar ---
router.post('/avatar', authMiddleware, (req: Request, res: Response) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Delete old avatar from Cloudinary if it exists
      if (user.avatar) {
        const publicId = extractPublicId(user.avatar);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch(() => {});
        }
      }

      // Upload new avatar
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'avatars',
            public_id: `${req.user!.userId}-${Date.now()}`,
            transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
            format: 'webp',
          },
          (error, result) => {
            if (error || !result) return reject(error || new Error('Upload failed'));
            resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: result.secure_url },
        select: { id: true, email: true, fullName: true, avatar: true, provider: true, settings: true, twoFactorEnabled: true, createdAt: true, passwordHash: true },
      });

      const { passwordHash, ...safeUser } = updatedUser;

      return res.json({ success: true, user: { ...safeUser, hasPassword: !!passwordHash } });
    } catch (error) {
      console.error('Avatar upload error:', error);
      return res.status(500).json({ error: 'Failed to upload avatar' });
    }
  });
});

// --- DELETE /api/auth/avatar ---
router.delete('/avatar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.avatar) {
      return res.status(400).json({ error: 'No avatar to remove' });
    }

    const publicId = extractPublicId(user.avatar);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null },
      select: { id: true, email: true, fullName: true, avatar: true, provider: true, settings: true, twoFactorEnabled: true, createdAt: true, passwordHash: true },
    });

    const { passwordHash, ...safeUser } = updatedUser;

    return res.json({ success: true, user: { ...safeUser, hasPassword: !!passwordHash } });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

// --- POST /api/auth/change-password ---
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const body = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'No password set for this account. Use Google Sign-In.' });
    }

    const passwordValid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!passwordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(body.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Zod Schemas ---
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  fullName: z.string().min(1, 'Full name is required').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// --- POST /api/auth/signup ---
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const body = signupSchema.parse(req.body);

    // 1. Normalize email
    const normalizedEmail = normalizeEmail(body.email);

    // 2. Disposable domain check
    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Disposable email addresses are not allowed' });
    }

    // 3. DNS MX record check
    const hasMx = await hasValidMxRecord(normalizedEmail);
    if (!hasMx) {
      return res.status(400).json({ error: 'Email domain cannot receive emails' });
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(body.password, 10);

    // 5. Create user + personal workspace + verification token
    const result = await registerUserWithDefaultWorkspace({
      email: normalizedEmail,
      fullName: body.fullName,
      passwordHash,
    });

    // 6. Create verification token and send email
    const token = await createVerificationToken(result.user.id);
    await sendVerificationEmail(normalizedEmail, token);

    return res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/auth/login ---
router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(body.email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: { workspace: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.passwordHash) {
      return res.status(403).json({
        error: 'This account uses Google Sign-In. Please use Continue with Google.',
      });
    }

    const passwordValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check email verification
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in',
        requiresVerification: true,
      });
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      const tempToken = await signTempToken(user.id);
      return res.json({
        requires2FA: true,
        tempToken,
      });
    }

    const token = await signSessionToken({ userId: user.id, email: user.email });

    res.cookie('relay_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in ms
    });

    const isNewUser = !user.settings || Object.keys(user.settings as object).length === 0;

    return res.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        memberships: user.memberships,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/auth/logout ---
router.post('/logout', (_req: Request, res: Response) => {
  res.cookie('relay_session', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return res.json({ success: true });
});

// --- POST /api/auth/google ---
const googleSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

router.post('/google', async (req: Request, res: Response) => {
  try {
    const body = googleSchema.parse(req.body);

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${body.credential}` },
    });

    if (!userInfoResponse.ok) {
      return res.status(401).json({ error: 'Invalid Google access token' });
    }

    const payload = await userInfoResponse.json();
    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Invalid Google token payload' });
    }

    const result = await findOrCreateGoogleUser({
      email: normalizeEmail(payload.email),
      fullName: payload.name || payload.email.split('@')[0],
      avatar: payload.picture || null,
      providerAccountId: payload.sub,
    });

    const token = await signSessionToken({
      userId: result.user.id,
      email: result.user.email,
    });

    res.cookie('relay_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in ms
    });

    return res.json({
      success: true,
      isNewUser: result.isNewUser,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'Google authentication failed' });
  }
});

// --- GET /api/auth/verify-email ---
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const result = await verifyEmailToken(token);

    if (!result.success || !result.userId) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const user = await prisma.user.findUnique({ where: { id: result.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sessionToken = await signSessionToken({ userId: user.id, email: user.email });

    res.cookie('relay_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    const isNewUser = !user.settings || Object.keys(user.settings as object).length === 0;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}${isNewUser ? '/onboarding' : '/dashboard'}`);
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/auth/resend-verification ---
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.emailVerified) {
      // Don't reveal whether the user exists
      return res.json({ success: true, message: 'If an unverified account exists, a new email has been sent.' });
    }

    // Delete old tokens
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id, type: 'EMAIL_VERIFICATION' },
    });

    const token = await createVerificationToken(user.id);
    await sendVerificationEmail(normalizedEmail, token);

    return res.json({ success: true, message: 'If an unverified account exists, a new email has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/auth/forgot-password ---
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(body.email);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user && user.passwordHash) {
      // Delete old reset tokens
      await prisma.verificationToken.deleteMany({
        where: { userId: user.id, type: 'PASSWORD_RESET' },
      });

      const token = await createPasswordResetToken(user.id);
      await sendPasswordResetEmail(normalizedEmail, token);
    }

    // Always return success to prevent email enumeration
    return res.json({ success: true, message: 'If an account exists, a password reset link has been sent.' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/auth/reset-password ---
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const body = resetPasswordSchema.parse(req.body);

    const result = await verifyPasswordResetToken(body.token);
    if (!result.success || !result.userId) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: result.userId! },
        data: { passwordHash },
      });

      await tx.verificationToken.deleteMany({
        where: { userId: result.userId!, type: 'PASSWORD_RESET' },
      });
    });

    return res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== TWO-FACTOR AUTHENTICATION ====================

// --- GET /api/auth/2fa/setup ---
router.get('/2fa/setup', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor authentication is already enabled. Disable it first.' });
    }

    const { secret, otpauthUri } = generateTwoFactorSecret(user.email);
    const qrCodeDataUrl = await generateQRCodeDataUrl(otpauthUri);

    // Store secret (not yet enabled)
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    return res.json({ secret, qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('2FA setup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/auth/2fa/verify ---
router.post('/2fa/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor authentication is already enabled' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: 'No 2FA setup in progress. Please run setup first.' });
    }

    const valid = verifyTwoFactorCode(user.twoFactorSecret, code);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    // Generate backup codes
    const plainCodes = generateBackupCodes();
    const hashedCodes = plainCodes.map(hashBackupCode);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(hashedCodes),
      },
    });

    return res.json({ success: true, backupCodes: plainCodes });
  } catch (error) {
    console.error('2FA verify error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/auth/2fa/disable ---
router.post('/2fa/disable', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { password, code } = req.body;
    if (!password || !code) {
      return res.status(400).json({ error: 'Password and verification code are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Two-factor authentication is not enabled' });
    }

    // Verify password
    if (!user.passwordHash) {
      return res.status(400).json({ error: 'No password set for this account' });
    }
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Verify TOTP code
    const codeValid = verifyTwoFactorCode(user.twoFactorSecret, code);
    if (!codeValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    return res.json({ success: true, message: 'Two-factor authentication has been disabled.' });
  } catch (error) {
    console.error('2FA disable error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/auth/2fa/regenerate-backup-codes ---
router.post('/2fa/regenerate-backup-codes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { password, code } = req.body;
    if (!password || !code) {
      return res.status(400).json({ error: 'Password and verification code are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Two-factor authentication is not enabled' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'No password set for this account' });
    }
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const codeValid = verifyTwoFactorCode(user.twoFactorSecret, code);
    if (!codeValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const plainCodes = generateBackupCodes();
    const hashedCodes = plainCodes.map(hashBackupCode);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorBackupCodes: JSON.stringify(hashedCodes) },
    });

    return res.json({ success: true, backupCodes: plainCodes });
  } catch (error) {
    console.error('2FA regenerate backup codes error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- POST /api/auth/2fa/verify-login ---
router.post('/2fa/verify-login', async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Token and verification code are required' });
    }

    const payload = await verifyTempToken(tempToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Check if it's a backup code (format: XXXX-XXXX)
    let codeValid = false;
    let remainingBackupCodes: string[] | null = null;

    if (code.includes('-') && code.length === 9) {
      // Backup code
      if (user.twoFactorBackupCodes) {
        const storedHashes: string[] = JSON.parse(user.twoFactorBackupCodes);
        const result = verifyBackupCode(storedHashes, code);
        codeValid = result.valid;
        remainingBackupCodes = result.remaining;
      }
    } else {
      // TOTP code
      codeValid = verifyTwoFactorCode(user.twoFactorSecret, code);
    }

    if (!codeValid) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // If backup code was used, update stored hashes
    if (remainingBackupCodes !== null) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: JSON.stringify(remainingBackupCodes) },
      });
    }

    const token = await signSessionToken({ userId: user.id, email: user.email });

    res.cookie('relay_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    const isNewUser = !user.settings || Object.keys(user.settings as object).length === 0;

    return res.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error('2FA verify-login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
