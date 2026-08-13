import { Appointment } from './types';
import { createNotifications } from './api';

/**
 * Appointment reminder dispatch.
 *
 * This module used to keep an in-memory array seeded with three fixed
 * notifications hard-coded to `patient-1`. Every visitor saw the same three,
 * real reminders vanished on reload, and the navbar bell disagreed with the
 * admin dispatch queue, which had always read the database. Reminders are rows
 * in the `notifications` table now, so both read the same source.
 */

/**
 * Queues the 24-hour and 30-minute reminders for a freshly booked or
 * rescheduled appointment.
 *
 * Reminder delivery itself is simulated: the rows are written immediately and
 * shown in the patient's notification tray rather than being dispatched by a
 * scheduler at the actual send time. A production system would hand these to a
 * job queue.
 */
export async function scheduleAppointmentReminders(appointment: Appointment): Promise<void> {
  if (!appointment.patient_id) return;

  const doctor = appointment.doctor_name || 'your doctor';
  const specialty = appointment.doctor_specialty ? ` (${appointment.doctor_specialty})` : '';

  try {
    await createNotifications([
      {
        user_id: appointment.patient_id,
        title: `24-Hour Reminder: Appointment with ${doctor}`,
        message:
          `Your telehealth consultation with ${doctor}${specialty} is scheduled for ` +
          `${appointment.appointment_date} at ${appointment.start_time}.`,
        type: 'APPOINTMENT',
      },
      {
        user_id: appointment.patient_id,
        title: '30-Minute Reminder: Consultation Starting Soon',
        message:
          `Your telehealth session with ${doctor} starts at ${appointment.start_time}. ` +
          'Open My Appointments to join the consultation room.',
        type: 'APPOINTMENT',
      },
    ]);
  } catch (err) {
    // A reminder that fails to queue must never block a confirmed booking.
    console.warn('[notifications] could not queue appointment reminders', err);
  }
}
