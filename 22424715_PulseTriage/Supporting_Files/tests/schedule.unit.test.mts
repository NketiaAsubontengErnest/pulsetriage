/**
 * Unit tests for the REAL slot generator (src/lib/schedule.ts) that now backs
 * both the doctor's Schedule Slot Manager and the patient booking flow.
 *
 * Before this module existed the two disagreed: booking offered a fixed list of
 * eight times, the manager showed four hard-coded rows that were never saved,
 * and the seeded `doctor_schedules` table was read by nobody. These tests pin
 * the single source of truth.
 *
 * Run:  npm run test:unit      (npx tsx --test tests/*.unit.test.mts)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSlotsForDate,
  validateAvailability,
  dayOfWeekFor,
  toMinutes,
  toTime,
  type WeeklyAvailability,
} from '../src/lib/schedule.ts';

const monday = '2026-08-17';
const sunday = '2026-08-16';

const mondayNineToTwelve: WeeklyAvailability = {
  day_of_week: 1,
  start_time: '09:00',
  end_time: '12:00',
  slot_duration_mins: 30,
  is_active: true,
};

test('a weekday window expands into back-to-back slots of the configured length', () => {
  const slots = buildSlotsForDate(monday, [mondayNineToTwelve]);

  assert.equal(slots.length, 6);
  assert.deepEqual(
    slots.map((s) => s.start_time),
    ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
  );
  assert.equal(slots[0].end_time, '09:30');
  assert.equal(slots.at(-1)!.end_time, '12:00');
  assert.ok(slots.every((s) => s.available));
});

test('slot length is taken from the doctor, not assumed to be 30 minutes', () => {
  const slots = buildSlotsForDate(monday, [{ ...mondayNineToTwelve, slot_duration_mins: 20 }]);

  assert.equal(slots.length, 9);
  assert.deepEqual(slots.slice(0, 3).map((s) => s.start_time), ['09:00', '09:20', '09:40']);
});

test('a trailing part-slot that does not fit the window is not offered', () => {
  // 09:00-10:10 with 30-minute slots yields two, not two and a stub.
  const slots = buildSlotsForDate(monday, [{ ...mondayNineToTwelve, end_time: '10:10' }]);

  assert.equal(slots.length, 2);
  assert.equal(slots.at(-1)!.end_time, '10:00');
});

test('a day the doctor does not consult on produces no slots', () => {
  assert.equal(buildSlotsForDate(sunday, [mondayNineToTwelve]).length, 0);
});

test('an inactive window is ignored even on its own weekday', () => {
  assert.equal(buildSlotsForDate(monday, [{ ...mondayNineToTwelve, is_active: false }]).length, 0);
});

test('booked appointments mark their slot unavailable and name the patient', () => {
  const slots = buildSlotsForDate(monday, [mondayNineToTwelve], [
    { id: 'app-1', start_time: '10:00', status: 'CONFIRMED', patient_name: 'Ama Serwaa Prempeh' },
  ]);

  const taken = slots.find((s) => s.start_time === '10:00')!;
  assert.equal(taken.available, false);
  assert.equal(taken.booked_by, 'Ama Serwaa Prempeh');
  assert.equal(taken.appointment_id, 'app-1');
  assert.equal(taken.status, 'CONFIRMED');

  // Every other slot stays open.
  assert.equal(slots.filter((s) => s.available).length, 5);
});

test('a cancelled appointment releases its slot back to the patient', () => {
  const slots = buildSlotsForDate(monday, [mondayNineToTwelve], [
    { id: 'app-1', start_time: '10:00', status: 'CANCELLED', patient_name: 'Ama Serwaa Prempeh' },
  ]);

  assert.equal(slots.find((s) => s.start_time === '10:00')!.available, true);
});

test('overlapping windows on one day never offer the same slot twice', () => {
  const slots = buildSlotsForDate(monday, [
    mondayNineToTwelve,
    { ...mondayNineToTwelve, start_time: '11:00', end_time: '13:00' },
  ]);

  const starts = slots.map((s) => s.start_time);
  assert.equal(new Set(starts).size, starts.length);
  assert.deepEqual(starts, ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30']);
});

test('slots come back in chronological order regardless of window order', () => {
  const slots = buildSlotsForDate(monday, [
    { ...mondayNineToTwelve, start_time: '14:00', end_time: '15:00' },
    mondayNineToTwelve,
  ]);

  const minutes = slots.map((s) => toMinutes(s.start_time));
  assert.deepEqual(minutes, [...minutes].sort((a, b) => a - b));
});

test('dates are read as local calendar days, not UTC instants', () => {
  // 2026-08-17 is a Monday everywhere; a UTC-parsed date would slip to Sunday
  // for anyone west of Greenwich.
  assert.equal(dayOfWeekFor('2026-08-17'), 1);
  assert.equal(dayOfWeekFor('2026-08-16'), 0);
});

test('time helpers round-trip', () => {
  assert.equal(toTime(toMinutes('08:05')), '08:05');
  assert.equal(toTime(toMinutes('23:59')), '23:59');
});

// ── Validation ───────────────────────────────────────────────────────────────

test('valid availability is accepted and defaulted', () => {
  const result = validateAvailability([{ day_of_week: 2, start_time: '09:00', end_time: '17:00' }]);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.rows[0].slot_duration_mins, 30);
  assert.equal(result.rows[0].is_active, true);
});

test('validation rejects an out-of-range weekday', () => {
  const result = validateAvailability([{ day_of_week: 9, start_time: '09:00', end_time: '17:00' }]);
  assert.equal(result.ok, false);
});

test('validation rejects a window that ends before it starts', () => {
  const result = validateAvailability([{ day_of_week: 2, start_time: '14:00', end_time: '09:00' }]);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /Tuesday/);
});

test('validation rejects malformed times and absurd slot lengths', () => {
  assert.equal(validateAvailability([{ day_of_week: 1, start_time: '9am', end_time: '17:00' }]).ok, false);
  assert.equal(
    validateAvailability([{ day_of_week: 1, start_time: '09:00', end_time: '17:00', slot_duration_mins: 1 }]).ok,
    false
  );
  assert.equal(validateAvailability('not an array').ok, false);
});
