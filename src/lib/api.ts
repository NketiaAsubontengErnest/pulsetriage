// Thin client-side wrapper around the /api routes backed by SQLite (Prisma).
import { Appointment, Doctor, NotificationItem, PaymentLog, TriageAssessment, UserProfile } from './types';
import type { WeeklyAvailability, DerivedSlot } from './schedule';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...(init?.headers || {}) } : init?.headers,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

const qs = (params: Record<string, string | undefined | null>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) search.set(k, v); });
  const str = search.toString();
  return str ? `?${str}` : '';
};

// ─── Doctors ────────────────────────────────────────────────────────────────
export const getDoctors = () =>
  request<{ doctors: Doctor[] }>('/api/doctors').then((d) => d.doctors);

export const createDoctor = (payload: Record<string, unknown>) =>
  request<{ doctor: Doctor }>('/api/doctors', { method: 'POST', body: JSON.stringify(payload) });

export const updateDoctor = (id: string, payload: Record<string, unknown>) =>
  request<{ doctor: Doctor }>(`/api/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

// ─── Profile ────────────────────────────────────────────────────────────────
export interface DoctorProfile {
  specialization: string;
  bio: string;
  consultation_fee: number;
  license_number: string;
}

export const getProfile = (user_id: string) =>
  request<{ user: UserProfile; doctor: DoctorProfile | null }>(`/api/profile${qs({ user_id })}`);

export const updateProfile = (payload: {
  user_id: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  current_password?: string;
  new_password?: string;
  specialization?: string;
  bio?: string;
}) =>
  request<{ success: boolean; user: UserProfile }>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

// ─── Doctor availability ────────────────────────────────────────────────────
// `id` may be either the Doctor row id or the doctor's user id — the API
// resolves both, because the doctor pages hold a session user and the booking
// flow holds a doctor record.
export const getDoctorSchedule = (id: string, date?: string) =>
  request<{ doctor_id: string; availability: WeeklyAvailability[]; date?: string; slots?: DerivedSlot[] }>(
    `/api/doctors/${id}/schedule${qs({ date })}`
  );

export const saveDoctorSchedule = (id: string, availability: WeeklyAvailability[]) =>
  request<{ success: boolean; availability: WeeklyAvailability[] }>(`/api/doctors/${id}/schedule`, {
    method: 'PUT',
    body: JSON.stringify({ availability }),
  });

export const deleteDoctor = (id: string, deleted_by?: string) =>
  request<{ success: boolean }>(`/api/doctors/${id}`, { method: 'DELETE', body: JSON.stringify({ deleted_by }) });

// ─── Patients ───────────────────────────────────────────────────────────────
export interface PatientRow extends UserProfile {
  last_triage: { id: string; urgency_level: string; created_at: string } | null;
  appointment_count: number;
}

export const getPatients = () =>
  request<{ patients: PatientRow[] }>('/api/patients').then((d) => d.patients);

// ─── Appointments ───────────────────────────────────────────────────────────
export const getAppointments = (filters: {
  patient_id?: string;
  doctor_id?: string;
  doctor_user_id?: string;
  status?: string;
} = {}) =>
  request<{ appointments: Appointment[] }>(`/api/appointments${qs(filters)}`).then((d) => d.appointments);

export const createAppointment = (payload: Record<string, unknown>) =>
  request<{ appointment: Appointment }>('/api/appointments', { method: 'POST', body: JSON.stringify(payload) });

export const updateAppointment = (id: string, payload: Record<string, unknown>) =>
  request<{ appointment: Appointment }>(`/api/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

// ─── Telehealth rooms ───────────────────────────────────────────────────────
export interface ActiveRoom {
  appointment_id: string;
  doctor_present: boolean;
  patient_present: boolean;
  participants: string[];
}

/** Which of these appointments currently have somebody sitting in the video room. */
export const getActiveRooms = (appointmentIds: string[]) =>
  appointmentIds.length === 0
    ? Promise.resolve([] as ActiveRoom[])
    : request<{ active_rooms: ActiveRoom[] }>(`/api/room?appointment_ids=${encodeURIComponent(appointmentIds.join(','))}`)
        .then((d) => d.active_rooms);

// ─── Triage ─────────────────────────────────────────────────────────────────
export const getTriages = (patient_id?: string) =>
  request<{ triages: TriageAssessment[] }>(`/api/triage${qs({ patient_id })}`).then((d) => d.triages);

export const createTriage = (payload: Record<string, unknown>) =>
  request<{ triage: TriageAssessment }>('/api/triage', { method: 'POST', body: JSON.stringify(payload) });

// ─── Payments ───────────────────────────────────────────────────────────────
export interface PaymentRow extends PaymentLog {
  patient?: { full_name: string; email: string };
  appointment?: { appointment_date: string };
}

export const getPayments = (patient_id?: string) =>
  request<{ payments: PaymentRow[] }>(`/api/payments${qs({ patient_id })}`).then((d) => d.payments);

export const createPayment = (payload: Record<string, unknown>) =>
  request<{ payment: PaymentLog }>('/api/payments', { method: 'POST', body: JSON.stringify(payload) });

// ─── Notifications ──────────────────────────────────────────────────────────
export interface NotificationRow extends NotificationItem {
  user?: { full_name: string; email: string };
}

export const getNotifications = (user_id: string) =>
  request<{ notifications: NotificationRow[] }>(`/api/notifications${qs({ user_id })}`).then((d) => d.notifications);

export const getAllNotifications = () =>
  request<{ notifications: NotificationRow[] }>('/api/notifications?all=true').then((d) => d.notifications);

export const createNotifications = (
  notifications: Array<{ user_id: string; title: string; message: string; type: NotificationItem['type'] }>
) =>
  request<{ success: boolean; notifications: NotificationRow[] }>('/api/notifications', {
    method: 'POST',
    body: JSON.stringify({ notifications }),
  });

export const markNotificationRead = (id: string) =>
  request<{ success: boolean }>('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id }) });

export const markAllNotificationsRead = (user_id: string) =>
  request<{ success: boolean }>('/api/notifications', { method: 'PATCH', body: JSON.stringify({ user_id, mark_all: true }) });

// ─── Specializations ────────────────────────────────────────────────────────
export interface Specialization { id: string; name: string; created_at: string }

export const getSpecializations = () =>
  request<{ specializations: Specialization[] }>('/api/specializations').then((d) => d.specializations);

export const createSpecialization = (name: string, added_by?: string) =>
  request<{ specialization: Specialization }>('/api/specializations', { method: 'POST', body: JSON.stringify({ name, added_by }) });

export const deleteSpecialization = (name: string) =>
  request<{ success: boolean }>(`/api/specializations${qs({ name })}`, { method: 'DELETE' });

// ─── Audit ──────────────────────────────────────────────────────────────────
export interface AuditRow {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export const getAuditLogs = (limit = 50) =>
  request<{ logs: AuditRow[] }>(`/api/audit${qs({ limit: String(limit) })}`).then((d) => d.logs);
