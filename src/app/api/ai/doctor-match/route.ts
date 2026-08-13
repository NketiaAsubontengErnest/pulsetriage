import { NextRequest, NextResponse } from 'next/server';
import { matchDoctorScheduleAI } from '@/lib/ai/ai-services';
import { db } from '@/lib/db';

// Ensemble calls fan out to several cloud models, so the default serverless
// budget is too tight. Vercel caps this at the plan maximum.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/ai/doctor-match
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symptoms, urgencyLevel } = body;

    if (!symptoms) {
      return NextResponse.json({ error: 'Symptoms string required' }, { status: 400 });
    }

    // Fetch active doctors from database with user relation
    const doctors = await db.doctor.findMany({
      include: {
        user: {
          select: {
            full_name: true,
          },
        },
      },
    });

    const doctorsPayload = doctors.map((d) => ({
      id: d.id,
      name: d.user?.full_name || 'Dr. Specialist',
      specialty: d.specialization,
      nextAvailable: 'Today',
    }));

    const result = await matchDoctorScheduleAI(symptoms, urgencyLevel || 'ROUTINE', doctorsPayload);

    return NextResponse.json({ success: true, matchData: result });
  } catch (error: any) {
    console.error('[API/AI/DOCTOR-MATCH]', error);
    return NextResponse.json({ error: error.message || 'Doctor matching failed' }, { status: 500 });
  }
}
