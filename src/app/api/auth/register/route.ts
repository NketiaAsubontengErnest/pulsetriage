import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { validatePasswordStrength } from '@/lib/password-validator';
import { createSessionToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { full_name, email, phone, password } = await req.json();

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return NextResponse.json({ error: strength.errors[0] || 'Password does not meet complexity requirements' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        full_name,
        role: 'PATIENT',
        phone: phone || null,
      },
    });

    // Log audit
    await db.auditLog.create({
      data: {
        actor: email,
        action: 'PATIENT_REGISTERED',
        entity: 'User',
        entity_id: user.id,
        details: `New patient account created: ${full_name}`,
      },
    });

    const { password: _pw, ...safeUser } = user;

    const token = createSessionToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      full_name: safeUser.full_name,
    });

    const response = NextResponse.json({ user: safeUser, token }, { status: 201 });
    response.cookies.set({
      name: 'pulsetriage_session_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[AUTH/REGISTER]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
