import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/patients — admin: list all patients with triage and appointment counts
export async function GET() {
  try {
    const patients = await db.user.findMany({
      where: { role: 'PATIENT' },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
        created_at: true,
        triages: {
          select: { id: true, urgency_level: true, created_at: true },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        appointments: {
          select: { id: true, status: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = patients.map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      phone: p.phone,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      last_triage: p.triages[0] || null,
      appointment_count: p.appointments.length,
    }));

    return NextResponse.json({ patients: result });
  } catch (error) {
    console.error('[PATIENTS/GET]', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}
