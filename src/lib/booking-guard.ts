import { db } from '@/lib/db';
import { buildSlotsForDate, dayOfWeekFor, DAY_NAMES, WeeklyAvailability } from '@/lib/schedule';

/**
 * Server-side booking rules.
 *
 * The slot picker only ever offers free slots, but a UI is not a guarantee:
 * two patients can load the same page, the API is reachable directly, and a
 * stale tab can post a slot that was taken minutes ago. Every write that sets a
 * date/time goes through here, so an unavailable slot is rejected by the
 * server regardless of what the client believed.
 */

export interface SlotRequest {
  doctor_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  /** Set when rescheduling, so the appointment does not collide with itself. */
  ignore_appointment_id?: string;
}

export type SlotCheck =
  | { ok: true; end_time: string }
  | { ok: false; status: number; error: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^\d{2}:\d{2}$/;

/**
 * The value stored in `Appointment.slot_key` while an appointment holds a slot.
 * Paired with the `@@unique([doctor_id, slot_key])` index, this makes the
 * database itself refuse a second booking of the same slot. Cancelled
 * appointments store NULL instead, and Postgres permits any number of NULLs in
 * a unique index, so cancelling genuinely frees the slot.
 */
export const slotKeyFor = (appointment_date: string, start_time: string) => `${appointment_date}_${start_time}`;

/** True when the failure was the slot-uniqueness index rejecting a duplicate. */
export function isSlotConflict(err: unknown): boolean {
  const e = err as { code?: string; meta?: { target?: unknown } };
  if (e?.code !== 'P2002') return false;
  const target = Array.isArray(e.meta?.target) ? e.meta?.target.join(',') : String(e.meta?.target ?? '');
  return target.includes('slot_key');
}

/** Today in the server's local calendar, for the "no bookings in the past" rule. */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Confirms the requested slot is one the doctor actually offers on that day and
 * that nobody else holds it. Returns the authoritative `end_time` derived from
 * the doctor's configured slot length, so a client cannot invent its own.
 */
export async function checkSlotAvailable(req: SlotRequest): Promise<SlotCheck> {
  const { doctor_id, appointment_date, start_time, ignore_appointment_id } = req;

  if (!ISO_DATE.test(appointment_date)) {
    return { ok: false, status: 400, error: 'appointment_date must be in YYYY-MM-DD format.' };
  }
  if (!HH_MM.test(start_time)) {
    return { ok: false, status: 400, error: 'start_time must be in HH:MM format.' };
  }
  if (appointment_date < todayIso()) {
    return { ok: false, status: 400, error: 'That date is in the past. Please choose an upcoming date.' };
  }

  const availability = (await db.doctorSchedule.findMany({
    where: { doctor_id },
  })) as unknown as WeeklyAvailability[];

  if (availability.length === 0) {
    return {
      ok: false,
      status: 409,
      error: 'This doctor has not published any consulting hours yet, so no slot can be booked.',
    };
  }

  const booked = await db.appointment.findMany({
    where: {
      doctor_id,
      appointment_date,
      status: { not: 'CANCELLED' },
      ...(ignore_appointment_id ? { id: { not: ignore_appointment_id } } : {}),
    },
    select: { id: true, start_time: true, status: true },
  });

  const slots = buildSlotsForDate(appointment_date, availability, booked);
  const dayName = DAY_NAMES[dayOfWeekFor(appointment_date)];

  if (slots.length === 0) {
    return { ok: false, status: 409, error: `This doctor does not consult on ${dayName}s. Please choose another date.` };
  }

  const slot = slots.find((s) => s.start_time === start_time);
  if (!slot) {
    return {
      ok: false,
      status: 409,
      error:
        `${start_time} is not one of this doctor's ${dayName} consulting slots. ` +
        `Available: ${slots.filter((s) => s.available).map((s) => s.start_time).join(', ') || 'none left on this date'}.`,
    };
  }

  if (!slot.available) {
    return { ok: false, status: 409, error: `${start_time} has just been booked by someone else. Please pick another slot.` };
  }

  return { ok: true, end_time: slot.end_time };
}
