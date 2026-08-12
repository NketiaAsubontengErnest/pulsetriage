// Thin client-side wrapper around the /api routes backed by SQLite (Prisma).
import { Appointment, Doctor, NotificationItem, PaymentLog, TriageAssessment, UserProfile } from './types';

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
