import dns from 'node:dns';
import isDisposable from 'email-disposable';

/**
 * Normalize email: lowercase, trim, collapse whitespace.
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/\s+/g, '');
}

/**
 * Check if the domain is a known disposable/temporary email provider.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1];
  if (!domain) return false;
  return isDisposable(domain);
}

/**
 * Verify the domain has valid MX records (can receive email).
 */
export async function hasValidMxRecord(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;

  // In development / local testing or with Mailpit, allow local/mock domains
  if (process.env.NODE_ENV !== 'production' || process.env.EMAIL_PROVIDER === 'mailpit') {
    return true;
  }

  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

