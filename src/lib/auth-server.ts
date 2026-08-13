import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SessionPayload } from './session';

export function getSessionUser(req: NextRequest): SessionPayload | null {
  // 1. Check HTTP-only cookie
  const cookieToken = req.cookies.get('pulsetriage_session_token')?.value;
  if (cookieToken) {
    const verified = verifySessionToken(cookieToken);
    if (verified) return verified;
  }

  // 2. Check Authorization header: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    const verified = verifySessionToken(bearerToken);
    if (verified) return verified;
  }

  return null;
}

export function requireAuth(
  req: NextRequest,
  allowedRoles?: Array<'PATIENT' | 'DOCTOR' | 'ADMIN'>
): { user: SessionPayload } | { response: NextResponse } {
  const user = getSessionUser(req);

  if (!user) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized. Authentication required.' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role as any)) {
    return {
      response: NextResponse.json(
        { error: 'Forbidden. Access restricted for your role.' },
        { status: 403 }
      ),
    };
  }

  return { user };
}
