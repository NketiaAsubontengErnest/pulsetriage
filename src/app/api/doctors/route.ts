import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/doctors — list all doctors with their user profile
export async function GET() {
  try {
    const doctors = await db.doctor.findMany({
      include: { user: { select: { full_name: true, email: true, phone: true, avatar_url: true } } },
      orderBy: { user: { full_name: 'asc' } },
    });

    const result = doctors.map((d) => ({
      id: d.id,
      profile_id: d.user_id,
      full_name: d.user.full_name,
      email: d.user.email,
      phone: d.user.phone,
      avatar_url: d.avatar_url || d.user.avatar_url,
      specialization: d.specialization,
      license_number: d.license_number,
      bio: d.bio,
      consultation_fee: d.consultation_fee,
      is_verified: d.is_verified,
      rating: d.rating,
    }));

    return NextResponse.json({ doctors: result });
  } catch (error) {
    console.error('[DOCTORS/GET]', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}

// POST /api/doctors — admin adds a new doctor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name, email, phone, password,
      specialization, license_number, bio,
      consultation_fee, is_verified, avatar_url,
      added_by,
    } = body;

    if (!full_name || !email || !specialization || !license_number) {
      return NextResponse.json({ error: 'full_name, email, specialization, license_number are required' }, { status: 400 });
    }

    // Check for existing user
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    // Create user account for doctor
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        full_name,
        role: 'DOCTOR',
        phone: phone || null,
        avatar_url: avatar_url || null,
      },
    });

    // Create doctor profile
    const doctor = await db.doctor.create({
      data: {
        user_id: user.id,
        specialization,
        license_number,
        bio: bio || '',
        consultation_fee: parseFloat(consultation_fee) || 0,
        is_verified: is_verified ?? false,
        avatar_url: avatar_url || null,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        actor: added_by || 'admin',
        action: 'DOCTOR_ADDED',
        entity: 'Doctor',
        entity_id: doctor.id,
        details: `Doctor ${full_name} (${specialization}) added`,
      },
    });

    return NextResponse.json({ doctor: { ...doctor, full_name, email } }, { status: 201 });
  } catch (error) {
    console.error('[DOCTORS/POST]', error);
    return NextResponse.json({ error: 'Failed to create doctor' }, { status: 500 });
  }
}
