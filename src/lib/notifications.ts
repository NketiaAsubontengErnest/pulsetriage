import { NotificationItem, Appointment } from './types';

/**
 * TECHNICAL DEBT IMPLEMENTATION #2: SIMPLIFIED NOTIFICATION QUEUE & EMAIL REMINDERS
 * ---------------------------------------------------------------------------------
 * Simulated Email Dispatch Engine for 24-Hour and 30-Minute Appointment Reminders.
 */

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-24h-001',
    user_id: 'patient-1',
    title: '24-Hour Email Reminder: Upcoming Consultation',
    message: 'Reminder: Your telehealth appointment with Dr. Kwame Mensah (Cardiology) is scheduled for tomorrow at 09:00 AM. Please ensure your device camera and microphone are ready.',
    type: 'APPOINTMENT',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'notif-30m-001',
    user_id: 'patient-1',
    title: '30-Minute Email Reminder: Telehealth Starting Soon',
    message: 'Upcoming Consultation Alert: Your telehealth session with Dr. Kwame Mensah starts in 30 minutes (09:00 AM). Click to join your consultation room.',
    type: 'APPOINTMENT',
    is_read: false,
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'notif-triage-001',
    user_id: 'patient-1',
    title: 'Triage Assessment Completed',
    message: 'Your symptom triage has been evaluated as URGENT (Score: 68/100). Cardiology consultation recommended.',
    type: 'TRIAGE',
    is_read: false,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

let memoryNotifications: NotificationItem[] = [...MOCK_NOTIFICATIONS];

export function getUserNotifications(userId: string): NotificationItem[] {
  return memoryNotifications.filter((n) => n.user_id === userId || userId === 'admin-1');
}

export function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'TRIAGE' | 'APPOINTMENT' | 'PAYMENT' | 'SYSTEM'
): NotificationItem {
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    created_at: new Date().toISOString()
  };
  
  memoryNotifications.unshift(newNotif);
  return newNotif;
}

export function scheduleAppointmentReminders(appointment: Appointment): { notif24h: NotificationItem; notif30m: NotificationItem } {
  const notif24h = createNotification(
    appointment.patient_id,
    `24-Hour Email Reminder: Appointment with ${appointment.doctor_name}`,
    `Reminder: Your telehealth consultation with ${appointment.doctor_name} (${appointment.doctor_specialty}) is scheduled for ${appointment.appointment_date} at ${appointment.start_time}. Email sent to patient inbox.`,
    'APPOINTMENT'
  );

  const notif30m = createNotification(
    appointment.patient_id,
    `30-Minute Email Reminder: Starting Soon`,
    `Upcoming Consultation Alert: Your telehealth session with ${appointment.doctor_name} starts in 30 minutes at ${appointment.start_time}. Click to join your consultation room.`,
    'APPOINTMENT'
  );

  return { notif24h, notif30m };
}

export function markNotificationAsRead(id: string): void {
  const notif = memoryNotifications.find((n) => n.id === id);
  if (notif) {
    notif.is_read = true;
  }
}
