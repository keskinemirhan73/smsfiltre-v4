import { timingSafeEqual } from 'node:crypto';

export interface AdminSecrets {
  password: string;
  totpSecret: string;
}

export function getAdminSecrets(): AdminSecrets | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  const totpSecret = process.env.ADMIN_TOTP_SECRET?.trim();
  if (!password || !totpSecret) return null;
  return { password, totpSecret };
}

export function secretsMatch(actual: unknown, expected: string): boolean {
  if (typeof actual !== 'string') return false;
  const actualBuffer = Buffer.from(actual, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer);
}
