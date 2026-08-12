import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/appointments/[id] — update status, date, time, or doctor
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, payment_status, notes, appointment_date, start_time, end_time, doctor_id, updated_by } = body;

    const appointment = await db.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(payment_status && { payment_status }),
        ...(notes && { notes }),
        ...(appointment_date && { appointment_date }),
        ...(start_time && { start_time }),
        ...(end_time && { end_time }),
        ...(doctor_id && { doctor_id }),
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    await db.auditLog.create({
      data: {
        actor: updated_by || 'SYSTEM',
        action: 'APPOINTMENT_UPDATED',
        entity: 'Appointment',
        entity_id: id,
        details: `Rescheduled/Updated: Date=${appointment_date || 'unchanged'}, Time=${start_time || 'unchanged'}, Status=${status || 'unchanged'}`,
      },
    });

    const result = {
      ...appointment,
      doctor_name: appointment.doctor?.user?.full_name || 'Doctor',
      doctor_specialty: appointment.doctor?.specialization || 'General Practice',
    };

    return NextResponse.json({ appointment: result });
  } catch (error) {
    console.error('[APPOINTMENTS/PATCH]', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}
