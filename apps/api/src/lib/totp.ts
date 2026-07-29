import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';

const ISSUER = 'Relay';

export function generateTwoFactorSecret(email: string) {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  return {
    secret: totp.secret.base32,
    otpauthUri: totp.toString(),
  };
}

export async function generateQRCodeDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export function verifyTwoFactorCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const bytes = crypto.randomBytes(4);
    const code = bytes.toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.replace('-', '').toLowerCase()).digest('hex');
}

export function verifyBackupCode(storedHashes: string[], inputCode: string): { valid: boolean; remaining: string[] } {
  const inputHash = hashBackupCode(inputCode);
  const index = storedHashes.indexOf(inputHash);
  if (index === -1) {
    return { valid: false, remaining: storedHashes };
  }
  const remaining = storedHashes.filter((_, i) => i !== index);
  return { valid: true, remaining };
}
