import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();

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

    // Return safe user profile excluding password hash
    const { password: _pw, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error('[AUTH/LOGIN ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

