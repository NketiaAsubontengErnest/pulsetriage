import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Default Demo Accounts for instant cloud login
const DEMO_ACCOUNTS: Record<string, { id: string; full_name: string; role: string; phone?: string }> = {
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
    let user = await db.user.findUnique({ where: { email: lowerEmail } });

    // Fallback: Provision demo account if unseeded in cloud serverless environment
    if (!user && DEMO_ACCOUNTS[lowerEmail] && password === 'password123') {
      const demo = DEMO_ACCOUNTS[lowerEmail];
      const hashedPassword = await bcrypt.hash(password, 10);

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
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Return safe user profile
    const { password: _pw, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('[AUTH/LOGIN]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
