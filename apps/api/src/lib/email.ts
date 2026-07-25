import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend';

// --- Mailpit (SMTP) transport ---
function getMailpitTransport() {
  return nodemailer.createTransport({
    host: process.env.MAILPIT_HOST || 'localhost',
    port: parseInt(process.env.MAILPIT_PORT || '1025', 10),
    secure: false,
    ignoreTLS: true,
  });
}

// --- Resend transport ---
let resend: Resend | null = null;
function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// --- Unified send function ---
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (EMAIL_PROVIDER === 'mailpit') {
    const from = process.env.MAILPIT_FROM || 'Relay <relay@localhost>';
    const transport = getMailpitTransport();
    await transport.sendMail({ from, to, subject, html });
    console.log(`[Mailpit] Email sent to ${to} — view at http://localhost:${process.env.MAILPIT_PORT || '8025'}`);
    return;
  }

  // Default: Resend
  const from = process.env.RESEND_FROM || 'Relay <onboarding@resend.dev>';
  const { error } = await getResendClient().emails.send({ from, to: [to], subject, html });
  if (error) {
    console.error('Failed to send email via Resend:', error);
    throw error;
  }
}

// --- Email templates ---

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your Relay account',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #1c1b1b; margin-bottom: 8px;">Welcome to Relay</h1>
        <p style="font-size: 16px; color: #8C8880; margin-bottom: 32px;">
          Please verify your email address to get started.
        </p>
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(to right, #FF416C, #FF4B2B); color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px;">
          Verify Email Address
        </a>
        <p style="font-size: 13px; color: #8C8880; margin-top: 32px;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your Relay password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #1c1b1b; margin-bottom: 8px;">Reset your password</h1>
        <p style="font-size: 16px; color: #8C8880; margin-bottom: 32px;">
          Click the button below to set a new password for your Relay account.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #FF416C, #FF4B2B); color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px;">
          Reset Password
        </a>
        <p style="font-size: 13px; color: #8C8880; margin-top: 32px;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
