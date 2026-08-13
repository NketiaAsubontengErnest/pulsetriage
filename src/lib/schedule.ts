/**
 * Slot arithmetic shared by the schedule API, the doctor's availability
 * manager and the patient booking flow.
 *
 * Before this existed, three places invented their own times: the booking modal
 * offered a fixed list of eight, the doctor's manager showed four hard-coded
 * rows that were never saved, and the seeded `doctor_schedules` table was read
 * by nobody. Everything now derives from the same weekly availability rows.
 */

export interface WeeklyAvailability {
  id?: string;
  day_of_week: number; // 0 = Sunday … 6 = Saturday
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  slot_duration_mins: number;
  is_active: boolean;
}

export interface DerivedSlot {
  start_time: string;
  end_time: string;
  /** False when a confirmed appointment already occupies this slot. */
  available: boolean;
  booked_by?: string;
  appointment_id?: string;
  status?: string;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

export const toTime = (minutes: number): string => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
};

/** "YYYY-MM-DD" → 0-6, parsed as a local calendar date rather than a UTC instant. */
export const dayOfWeekFor = (isoDate: string): number => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getDay();
};

/**
 * Expands the weekly availability rows that apply to `date` into concrete
 * slots, marking the ones already taken by an appointment.
 */
export function buildSlotsForDate(
  date: string,
  availability: WeeklyAvailability[],
  booked: Array<{ id: string; start_time: string; status: string; patient_name?: string | null }> = []
): DerivedSlot[] {
  const day = dayOfWeekFor(date);
  const takenByStart = new Map(
    booked.filter((b) => b.status !== 'CANCELLED').map((b) => [b.start_time, b])
  );

  const slots: DerivedSlot[] = [];
  const seen = new Set<string>();

  for (const window of availability) {
    if (window.day_of_week !== day || !window.is_active) continue;

    const duration = Math.max(5, window.slot_duration_mins || 30);
    const start = toMinutes(window.start_time);
    const end = toMinutes(window.end_time);

    for (let cursor = start; cursor + duration <= end; cursor += duration) {
      const startTime = toTime(cursor);
      // Overlapping windows must not produce the same slot twice.
      if (seen.has(startTime)) continue;
      seen.add(startTime);

      const taken = takenByStart.get(startTime);
      slots.push({
        start_time: startTime,
        end_time: toTime(cursor + duration),
        available: !taken,
        ...(taken
          ? { booked_by: taken.patient_name ?? 'Booked', appointment_id: taken.id, status: taken.status }
          : {}),
      });
    }
  }

  return slots.sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
}

/** Rejects the shapes the UI can produce before they reach the database. */
export function validateAvailability(rows: unknown): { ok: true; rows: WeeklyAvailability[] } | { ok: false; error: string } {
  if (!Array.isArray(rows)) return { ok: false, error: 'availability must be an array' };

  const cleaned: WeeklyAvailability[] = [];
  for (const raw of rows) {
    const row = raw as Partial<WeeklyAvailability>;
    const day = Number(row.day_of_week);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return { ok: false, error: `day_of_week must be 0-6 (got ${row.day_of_week})` };
    }
    if (typeof row.start_time !== 'string' || !/^\d{2}:\d{2}$/.test(row.start_time)) {
      return { ok: false, error: `start_time must be HH:MM (got ${row.start_time})` };
    }
    if (typeof row.end_time !== 'string' || !/^\d{2}:\d{2}$/.test(row.end_time)) {
      return { ok: false, error: `end_time must be HH:MM (got ${row.end_time})` };
    }
    if (toMinutes(row.end_time) <= toMinutes(row.start_time)) {
      return { ok: false, error: `${DAY_NAMES[day]}: end time must be after start time` };
    }
    const duration = Number(row.slot_duration_mins ?? 30);
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
      return { ok: false, error: 'slot_duration_mins must be between 5 and 240' };
    }

    cleaned.push({
      day_of_week: day,
      start_time: row.start_time,
      end_time: row.end_time,
      slot_duration_mins: duration,
      is_active: row.is_active !== false,
    });
  }

  return { ok: true, rows: cleaned };
}
