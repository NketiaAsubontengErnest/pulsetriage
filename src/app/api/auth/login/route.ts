import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Pure Database Authentication
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();

    // Query user record directly from SQLite / Postgres database
    const user = await db.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify hashed password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Return safe user profile (excluding hashed password)
    const { password: _pw, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('[AUTH/LOGIN]', error);
    return NextResponse.json({ error: 'Database authentication error' }, { status: 500 });
  }
}
