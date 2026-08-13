import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildSlotsForDate, validateAvailability, WeeklyAvailability } from '@/lib/schedule';

export const dynamic = 'force-dynamic';

/**
 * GET /api/doctors/[id]/schedule            → the doctor's weekly availability
 * GET /api/doctors/[id]/schedule?date=…     → plus the concrete slots for that
 *                                             date, with booked ones marked
 *
 * `id` accepts either the Doctor record id or the doctor's user id, because the
 * doctor pages hold a session user while the booking flow holds a doctor row.
 */
async function resolveDoctorId(id: string): Promise<string | null> {
  const byDoctorId = await db.doctor.findUnique({ where: { id }, select: { id: true } });
  if (byDoctorId) return byDoctorId.id;
  const byUserId = await db.doctor.findFirst({ where: { user_id: id }, select: { id: true } });
  return byUserId?.id ?? null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doctorId = await resolveDoctorId(id);
    if (!doctorId) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const date = req.nextUrl.searchParams.get('date');

    const availability = await db.doctorSchedule.findMany({
      where: { doctor_id: doctorId },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
    });

    if (!date) {
      return NextResponse.json({ doctor_id: doctorId, availability });
    }

    const booked = await db.appointment.findMany({
      where: { doctor_id: doctorId, appointment_date: date, status: { not: 'CANCELLED' } },
      select: { id: true, start_time: true, status: true, patient: { select: { full_name: true } } },
    });

    const slots = buildSlotsForDate(
      date,
      availability as unknown as WeeklyAvailability[],
      booked.map((b) => ({
        id: b.id,
        start_time: b.start_time,
        status: b.status,
        patient_name: b.patient?.full_name ?? null,
      }))
    );

    return NextResponse.json({ doctor_id: doctorId, date, availability, slots });
  } catch (error) {
    console.error('[API/DOCTORS/SCHEDULE/GET]', error);
    return NextResponse.json({ error: 'Failed to load the schedule' }, { status: 500 });
  }
}

/**
 * PUT /api/doctors/[id]/schedule — replace the doctor's weekly availability.
 *
 * A full replace rather than row-level edits: the manager UI submits the whole
 * week, so this cannot leave orphaned windows behind.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doctorId = await resolveDoctorId(id);
    if (!doctorId) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const body = await req.json();
    const parsed = validateAvailability(body.availability);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    await db.$transaction([
      db.doctorSchedule.deleteMany({ where: { doctor_id: doctorId } }),
      db.doctorSchedule.createMany({
        data: parsed.rows.map((row) => ({
          doctor_id: doctorId,
          day_of_week: row.day_of_week,
          start_time: row.start_time,
          end_time: row.end_time,
          slot_duration_mins: row.slot_duration_mins,
          is_active: row.is_active,
        })),
      }),
    ]);

    const availability = await db.doctorSchedule.findMany({
      where: { doctor_id: doctorId },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
    });

    return NextResponse.json({ success: true, doctor_id: doctorId, availability });
  } catch (error) {
    console.error('[API/DOCTORS/SCHEDULE/PUT]', error);
    return NextResponse.json({ error: 'Failed to save the schedule' }, { status: 500 });
  }
}
