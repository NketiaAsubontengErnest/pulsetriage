import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { full_name, email, phone, password } = await req.json();

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
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
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('[AUTH/REGISTER]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
