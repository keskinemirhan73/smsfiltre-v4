import crypto from 'crypto';

/**
 * Base32 Decode RFC 4648
 */
function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generate RFC 6238 TOTP Code for a given secret and counter
 */
export function generateTOTP(secretBase32: string, timeWindowStep = 0): string {
  const timeStep = 30; // 30 seconds interval
  const counter = Math.floor(Date.now() / 1000 / timeStep) + timeStep;
  const key = base32Decode(secretBase32);

  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24 |
      (hmac[offset + 1] & 0xff) << 16 |
      (hmac[offset + 2] & 0xff) << 8 |
      (hmac[offset + 3] & 0xff)) %
    1000000;

  return code.toString().padStart(6, '0');
}

/**
 * Verify Google Authenticator 6-digit TOTP Code
 * Allows ±1 time window drift (30 seconds before/after)
 */
export function verifyTOTP(token: string, secretBase32: string): boolean {
  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) return false;
  if (!secretBase32) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / 30);

  for (let window = -1; window <= 1; window++) {
    const counter = currentCounter + window;
    const key = base32Decode(secretBase32);
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const generatedCode =
      ((hmac[offset] & 0x7f) << 24 |
        (hmac[offset + 1] & 0xff) << 16 |
        (hmac[offset + 2] & 0xff) << 8 |
        (hmac[offset + 3] & 0xff)) %
      1000000;

    const formattedCode = generatedCode.toString().padStart(6, '0');
    if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(formattedCode))) {
      return true;
    }
  }

  return false;
}
