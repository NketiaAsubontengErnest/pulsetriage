import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/stats — headline figures for the landing page.
 *
 * Counts only. No names, no records: this route is unauthenticated, so it must
 * never expose anything that identifies a patient or a case.
 */
export async function GET() {
  try {
    const [doctors, specialties, completed, triages] = await Promise.all([
      db.doctor.count({ where: { is_verified: true } }),
      db.specialization.count(),
      db.appointment.count({ where: { status: 'COMPLETED' } }),
      db.triageAssessment.count(),
    ]);

    return NextResponse.json({
      verified_doctors: doctors,
      specialties,
      consultations_completed: completed,
      assessments_run: triages,
    });
  } catch (error) {
    console.error('[PUBLIC/STATS]', error);
    // The landing page falls back to its static copy rather than showing an error.
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
