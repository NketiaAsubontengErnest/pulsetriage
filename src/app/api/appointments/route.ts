import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkSlotAvailable, isSlotConflict, slotKeyFor } from '@/lib/booking-guard';

// GET /api/appointments?patient_id=&doctor_id=&status=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patient_id = searchParams.get('patient_id');
    const status = searchParams.get('status');
    let doctor_id = searchParams.get('doctor_id');

    // Pages know the signed-in User.id, not the Doctor.id — resolve it here.
    const doctor_user_id = searchParams.get('doctor_user_id');
    if (doctor_user_id) {
      const doctor = await db.doctor.findUnique({ where: { user_id: doctor_user_id } });
      if (!doctor) return NextResponse.json({ appointments: [] });
      doctor_id = doctor.id;
    }

    const appointments = await db.appointment.findMany({
      where: {
        ...(patient_id && { patient_id }),
        ...(doctor_id && { doctor_id }),
        ...(status && { status }),
      },
      include: {
        patient: { select: { full_name: true, phone: true } },
        doctor: {
          include: {
            user: { select: { full_name: true } },
          },
        },
        triage: { select: { urgency_level: true, primary_symptom: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = appointments.map((a) => ({
      id: a.id,
      patient_id: a.patient_id,
      patient_name: a.patient.full_name,
      patient_phone: a.patient.phone,
      doctor_id: a.doctor_id,
      doctor_name: a.doctor.user.full_name,
      doctor_specialty: a.doctor.specialization,
      triage_urgency: a.triage?.urgency_level || null,
      appointment_date: a.appointment_date,
      start_time: a.start_time,
      end_time: a.end_time,
      status: a.status,
      payment_status: a.payment_status,
      payment_amount: a.payment_amount,
      reason: a.reason,
      notes: a.notes,
      created_at: a.created_at,
    }));

    return NextResponse.json({ appointments: result });
  } catch (error) {
    console.error('[APPOINTMENTS/GET]', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

// POST /api/appointments — create new appointment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient_id, doctor_id, triage_id,
      appointment_date, start_time, end_time,
      payment_amount, reason, notes,
    } = body;

    if (!patient_id || !doctor_id || !appointment_date || !start_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doctor = await db.doctor.findUnique({ where: { id: doctor_id } });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // The slot must be one the doctor actually publishes, and still free. The
    // picker already filters, but a direct call or a stale tab must not be able
    // to double-book. The re-check inside the transaction closes the window
    // between two patients confirming the same slot.
    const precheck = await checkSlotAvailable({ doctor_id, appointment_date, start_time });
    if (!precheck.ok) {
      return NextResponse.json({ error: precheck.error }, { status: precheck.status });
    }

    // One transaction covers the appointment, the doctor's notification and the
    // audit row, so a failure part-way cannot leave an appointment nobody was
    // told about or a booking with no trail. `slot_key` carries the unique
    // index that makes a duplicate physically impossible.
    let appointment;
    try {
      appointment = await db.$transaction(async (tx) => {
        const created = await tx.appointment.create({
          data: {
            patient_id,
            doctor_id,
            triage_id: triage_id || null,
            appointment_date,
            start_time,
            // The doctor's configured slot length wins over whatever the client sent.
            end_time: precheck.end_time || end_time || '',
            slot_key: slotKeyFor(appointment_date, start_time),
            status: 'PENDING_PAYMENT',
            payment_status: 'PENDING',
            payment_amount: parseFloat(payment_amount) || 0,
            reason: reason || null,
            notes: notes || null,
          },
        });

        // Notify the doctor (notifications reference User.id, not Doctor.id)
        await tx.notification.create({
          data: {
            user_id: doctor.user_id,
            title: 'New Appointment Booked',
            message: `A patient has booked an appointment on ${appointment_date} at ${start_time}.`,
            type: 'APPOINTMENT',
          },
        });

        await tx.auditLog.create({
          data: {
            actor: patient_id,
            action: 'APPOINTMENT_BOOKED',
            entity: 'Appointment',
            entity_id: created.id,
            details: `Appointment booked for ${appointment_date} at ${start_time}`,
          },
        });

        return created;
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

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('[APPOINTMENTS/POST]', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
