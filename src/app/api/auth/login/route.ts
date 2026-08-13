import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { createSessionToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const rateLimitKey = `login:${clientIp}:${lowerEmail}`;

    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (rateLimit.isRateLimited) {
      const waitMins = Math.ceil(rateLimit.resetMs / 60000);
      return NextResponse.json(
        { error: `Too many failed login attempts. Please try again in ${waitMins} minute${waitMins > 1 ? 's' : ''}.` },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)) } }
      );
    }

    // Query database for user profile
    const user = await db.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password hash against database record
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch {
      isValidPassword = false;
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Reset rate limit counter on successful authentication
    resetRateLimit(rateLimitKey);

    // Return safe user profile excluding password hash
    const { password: _pw, ...safeUser } = user;

    // Create session token
    const token = createSessionToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      full_name: safeUser.full_name,
    });

    const response = NextResponse.json({ user: safeUser, token });
    response.cookies.set({
      name: 'pulsetriage_session_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[AUTH/LOGIN ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

