export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type UrgencyLevel = 'EMERGENCY' | 'URGENT' | 'SEMI_URGENT' | 'ROUTINE';

export type AppointmentStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type PaymentStatus = 'PENDING' | 'SIMULATED_SUCCESS' | 'FAILED';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  specialization: string;
  license_number: string;
  bio: string;
  consultation_fee: number;
  is_verified: boolean;
  rating: number;
  avatar_url?: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0-6
  start_time: string; // "09:00"
  end_time: string; // "17:00"
  slot_duration_mins: number;
  is_active: boolean;
}

export interface TriageInput {
  primary_symptom: string;
  symptom_duration: string; // "Less than 24h", "1-3 days", "Over 1 week"
  pain_score: number; // 1-10
  red_flags: string[]; // e.g. ["Chest pain", "Shortness of breath"]
  additional_notes?: string;
}

export interface TriageAssessment {
  id: string;
  patient_id: string;
  primary_symptom: string;
  symptom_duration: string;
  pain_score: number;
  red_flag_present: boolean;
  red_flags: string[];
  severity_score: number; // 0 - 100
  urgency_level: UrgencyLevel;
  recommended_specialty: string;
  triage_summary: string;
  action_recommendation: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  doctor_id: string;
  doctor_name?: string;
  doctor_specialty?: string;
  triage_id?: string;
  triage_urgency?: UrgencyLevel;
  triage_assessment?: TriageAssessment;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  payment_amount: number;
  notes?: string;
  reason?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'TRIAGE' | 'APPOINTMENT' | 'PAYMENT' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
}

export interface PaymentLog {
  id: string;
  appointment_id: string;
  patient_id: string;
  transaction_ref: string;
  amount: number;
  payment_method: 'MOBILE_MONEY' | 'CREDIT_CARD' | 'HEALTH_INSURANCE';
  provider: string; // e.g., 'MTN Mobile Money', 'Visa / Mastercard'
  status: 'SUCCESS' | 'DECLINED';
  created_at: string;
}
