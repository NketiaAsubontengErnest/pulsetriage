import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signing key for session tokens.
 *
 * The literal below is a DEVELOPMENT-ONLY fallback so a fresh clone runs
 * without configuration. It is published in this repository, so any deployment
 * that relies on it is signing tokens with a publicly known key and anyone can
 * forge a session for any role. JWT_SECRET must be set in every deployed
 * environment — see technical debt item TD-21.
 */
const DEV_FALLBACK_SECRET = 'pulsetriage-development-only-not-for-deployment';
const JWT_SECRET = process.env.JWT_SECRET?.trim() || DEV_FALLBACK_SECRET;

if (JWT_SECRET === DEV_FALLBACK_SECRET && process.env.NODE_ENV === 'production') {
  console.error(
    '[SECURITY] JWT_SECRET is not set. Session tokens are being signed with the ' +
      'public development key and can be forged. Set JWT_SECRET immediately.'
  );
}

export interface SessionPayload {
  id: string;
  email: string;
  role: string;
  full_name: string;
  exp?: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function sign(input: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(input);
  return hmac.digest('base64url');
}

/**
 * Creates a signed JWT session token valid for 7 days.
 */
export function createSessionToken(user: { id: string; email: string; role: string; full_name: string }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    exp: now + 7 * 24 * 60 * 60, // 7 days
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed JWT session token.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

    // Constant-time comparison: a plain !== returns as soon as two bytes
    // differ, which leaks how much of a forged signature was correct.
    const given = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
