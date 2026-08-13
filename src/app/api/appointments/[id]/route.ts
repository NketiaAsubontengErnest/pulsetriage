import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkSlotAvailable, isSlotConflict, slotKeyFor } from '@/lib/booking-guard';

// PATCH /api/appointments/[id] — update status, date, time, or doctor
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, payment_status, notes, appointment_date, start_time, end_time, doctor_id, updated_by } = body;

    // Rescheduling has to clear the same bar as booking: a moved appointment
    // must land on a slot the (possibly new) doctor publishes and nobody holds.
    // Status-only updates — payment, completion, cancellation — skip this.
    let resolvedEndTime = end_time;
    if (appointment_date || start_time || doctor_id) {
      const current = await db.appointment.findUnique({
        where: { id },
        select: { doctor_id: true, appointment_date: true, start_time: true },
      });
      if (!current) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

      const check = await checkSlotAvailable({
        doctor_id: doctor_id || current.doctor_id,
        appointment_date: appointment_date || current.appointment_date,
        start_time: start_time || current.start_time,
        ignore_appointment_id: id,
      });
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
      resolvedEndTime = check.end_time;
    }

    // `slot_key` is what the unique index reserves the slot with. Moving an
    // appointment must move its key; cancelling must clear it so the slot goes
    // back on sale.
    let slotKeyUpdate: { slot_key: string | null } | Record<string, never> = {};
    if (status === 'CANCELLED') {
      slotKeyUpdate = { slot_key: null };
    } else if (appointment_date || start_time) {
      const current = await db.appointment.findUnique({
        where: { id },
        select: { appointment_date: true, start_time: true },
      });
      slotKeyUpdate = {
        slot_key: slotKeyFor(appointment_date || current!.appointment_date, start_time || current!.start_time),
      };
    }

    // The update, the patient's notification and the audit row travel together,
    // so a completed consultation can never be recorded without telling the
    // patient or leaving a trail.
    let appointment;
    try {
      appointment = await db.$transaction(async (tx) => {
        const saved = await tx.appointment.update({
          where: { id },
          data: {
            ...(status && { status }),
            ...(payment_status && { payment_status }),
            ...(notes && { notes }),
            ...(appointment_date && { appointment_date }),
            ...(start_time && { start_time }),
            ...(resolvedEndTime && { end_time: resolvedEndTime }),
            ...(doctor_id && { doctor_id }),
            ...slotKeyUpdate,
          },
          include: { doctor: { include: { user: true } } },
        });

        // Signing off a consultation is what the patient portal shows as "done".
        if (status === 'COMPLETED') {
          await tx.notification.create({
            data: {
              user_id: saved.patient_id,
              title: 'Consultation Completed',
              message: `Your consultation with ${saved.doctor?.user?.full_name || 'your doctor'} on ${saved.appointment_date} is complete. The clinical notes are available in your appointment history.`,
              type: 'APPOINTMENT',
            },
          });
        }

        await tx.auditLog.create({
          data: {
            actor: updated_by || 'SYSTEM',
            action: 'APPOINTMENT_UPDATED',
            entity: 'Appointment',
            entity_id: id,
            details: `Rescheduled/Updated: Date=${appointment_date || 'unchanged'}, Time=${start_time || 'unchanged'}, Status=${status || 'unchanged'}`,
          },
        });

        return saved;
      });
    } catch (err) {
      if (isSlotConflict(err)) {
        return NextResponse.json(
          { error: `${start_time} has just been booked by someone else. Please pick another slot.` },
          { status: 409 }
        );
      }
      throw err;
    }

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
