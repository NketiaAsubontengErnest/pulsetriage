import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Default Accounts for instant Database Provisioning fallback if unseeded
const DEMO_SEEDS: Record<string, { id: string; full_name: string; role: string; phone?: string }> = {
  'patient@ug.edu.gh': {
    id: 'patient-1',
    full_name: 'Ama Serwaa Prempeh',
    role: 'PATIENT',
    phone: '+233 24 123 4567',
  },
  'dr.mensah@ug.edu.gh': {
    id: 'doctor-1',
    full_name: 'Dr. Kwame Mensah',
    role: 'DOCTOR',
    phone: '+233 20 888 9999',
  },
  'admin@ug.edu.gh': {
    id: 'admin-1',
    full_name: 'PulseTriage System Admin',
    role: 'ADMIN',
    phone: '+233 30 200 1122',
  },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();

    // Query database directly
    let user = null;
    try {
      user = await db.user.findUnique({
        where: { email: lowerEmail },
      });
    } catch (dbError: any) {
      console.warn('[AUTH/LOGIN] DB Query Warning:', dbError?.message || dbError);
    }

    // Auto-provision demo account into DB if database table was unseeded on serverless instance
    if (!user && DEMO_SEEDS[lowerEmail] && password === 'password123') {
      const demo = DEMO_SEEDS[lowerEmail];
      const hashedPassword = await bcrypt.hash(password, 10);

      try {
        user = await db.user.create({
          data: {
            id: demo.id,
            email: lowerEmail,
            password: hashedPassword,
            full_name: demo.full_name,
            role: demo.role,
            phone: demo.phone,
          },
        });

        if (demo.role === 'DOCTOR') {
          await db.doctor.create({
            data: {
              user_id: user.id,
              specialization: 'Cardiology',
              license_number: 'MDC-GH-998822',
              bio: 'Senior Clinical Specialist in Cardiovascular Medicine.',
              consultation_fee: 150.0,
              is_verified: true,
              rating: 4.9,
            },
          }).catch(() => undefined);
        }
      } catch (createErr) {
        console.warn('[AUTH/LOGIN] Could not auto-seed user:', createErr);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Return safe user profile
    const { password: _pw, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error('[AUTH/LOGIN ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
