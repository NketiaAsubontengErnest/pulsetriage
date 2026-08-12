import { Doctor, DoctorSchedule, Appointment, UserProfile, TriageAssessment } from './types';

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'patient-1',
    email: 'patient@ug.edu.gh',
    full_name: 'Ama Serwaa Prempeh',
    role: 'PATIENT',
    phone: '+233 24 123 4567',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    created_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 'doctor-1',
    email: 'dr.mensah@ug.edu.gh',
    full_name: 'Dr. Kwame Mensah',
    role: 'DOCTOR',
    phone: '+233 20 888 9999',
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    created_at: '2025-11-01T10:00:00Z'
  },
  {
    id: 'doctor-2',
    email: 'dr.appiah@ug.edu.gh',
    full_name: 'Dr. Akosua Appiah',
    role: 'DOCTOR',
    phone: '+233 55 444 3333',
    avatar_url: 'https://images.unsplash.com/photo-1594824813566-78a9327d7f76?w=150',
    created_at: '2025-11-02T10:00:00Z'
  },
  {
    id: 'doctor-3',
    email: 'dr.owusu@ug.edu.gh',
    full_name: 'Dr. Emmanuel Owusu',
    role: 'DOCTOR',
    phone: '+233 26 111 2222',
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
    created_at: '2025-11-05T10:00:00Z'
  },
  {
    id: 'admin-1',
    email: 'admin@ug.edu.gh',
    full_name: 'Prof. Solomon Mensah (Admin)',
    role: 'ADMIN',
    phone: '+233 30 200 0000',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    created_at: '2025-01-01T10:00:00Z'
  }
];

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    profile_id: 'doctor-1',
    full_name: 'Dr. Kwame Mensah',
    email: 'dr.mensah@ug.edu.gh',
    specialization: 'Cardiology',
    license_number: 'GMC-2018-8472',
    bio: 'Consultant Cardiologist with 12+ years experience in acute cardiovascular management and hypertension triage.',
    consultation_fee: 200.00,
    is_verified: true,
    rating: 4.9,
    avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'
  },
  {
    id: 'doc-2',
    profile_id: 'doctor-2',
    full_name: 'Dr. Akosua Appiah',
    email: 'dr.appiah@ug.edu.gh',
    specialization: 'Pulmonology',
    license_number: 'GMC-2019-9912',
    bio: 'Specialist in respiratory disorders, asthma management, and urgent pulmonary care.',
    consultation_fee: 180.00,
    is_verified: true,
    rating: 4.85,
    avatar_url: 'https://images.unsplash.com/photo-1594824813566-78a9327d7f76?w=150'
  },
  {
    id: 'doc-3',
    profile_id: 'doctor-3',
    full_name: 'Dr. Emmanuel Owusu',
    email: 'dr.owusu@ug.edu.gh',
    specialization: 'General Practice',
    license_number: 'GMC-2020-4410',
    bio: 'Experienced General Practitioner providing comprehensive family health triage and consultations.',
    consultation_fee: 150.00,
    is_verified: true,
    rating: 4.75,
    avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150'
  }
];

export const MOCK_SCHEDULES: DoctorSchedule[] = [
  { id: 'sched-1', doctor_id: 'doc-1', day_of_week: 1, start_time: '08:00', end_time: '14:00', slot_duration_mins: 30, is_active: true },
  { id: 'sched-2', doctor_id: 'doc-1', day_of_week: 3, start_time: '09:00', end_time: '15:00', slot_duration_mins: 30, is_active: true },
  { id: 'sched-3', doctor_id: 'doc-2', day_of_week: 2, start_time: '10:00', end_time: '16:00', slot_duration_mins: 30, is_active: true },
  { id: 'sched-4', doctor_id: 'doc-3', day_of_week: 1, start_time: '08:00', end_time: '17:00', slot_duration_mins: 30, is_active: true }
];

export const MOCK_TRIAGE_RECORDS: TriageAssessment[] = [
  {
    id: 'triage-101',
    patient_id: 'patient-1',
    primary_symptom: 'Chest Pain / Palpitations',
    pain_score: 8,
    symptom_duration: 'Sudden (< 6 hours)',
    red_flag_present: true,
    red_flags: ['Chest pain or pressure radiates to arm/jaw'],
    severity_score: 95,
    urgency_level: 'EMERGENCY',
    triage_summary: 'Red flag emergency detected! Call 112 or proceed immediately to nearest emergency room.',
    action_recommendation: 'Red flag emergency detected! Call 112 or proceed immediately to nearest emergency room.',
    recommended_specialty: 'Emergency Cardiology',
    created_at: '2026-08-12T08:30:00Z'
  },
  {
    id: 'triage-102',
    patient_id: 'patient-1',
    primary_symptom: 'Shortness of Breath / Asthma / Cough',
    pain_score: 6,
    symptom_duration: '1-2 days',
    red_flag_present: false,
    red_flags: [],
    severity_score: 65,
    urgency_level: 'URGENT',
    triage_summary: 'Urgent non-emergency case. Book appointment within 24 hours.',
    action_recommendation: 'Urgent non-emergency case. Book appointment within 24 hours.',
    recommended_specialty: 'Pulmonology',
    created_at: '2026-08-10T14:15:00Z'
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-001',
    patient_id: 'patient-1',
    patient_name: 'Ama Serwaa Prempeh',
    doctor_id: 'doc-1',
    doctor_name: 'Dr. Kwame Mensah',
    doctor_specialty: 'Cardiology',
    appointment_date: '2026-08-14',
    start_time: '09:00 AM',
    end_time: '09:30 AM',
    status: 'CONFIRMED',
    triage_urgency: 'EMERGENCY',
    payment_status: 'SIMULATED_SUCCESS',
    payment_amount: 200.00,
    reason: 'Chest pain followup & ECG consultation',
    created_at: '2026-08-12T09:00:00Z'
  },
  {
    id: 'app-002',
    patient_id: 'patient-1',
    patient_name: 'Ama Serwaa Prempeh',
    doctor_id: 'doc-2',
    doctor_name: 'Dr. Akosua Appiah',
    doctor_specialty: 'Pulmonology',
    appointment_date: '2026-08-16',
    start_time: '11:00 AM',
    end_time: '11:30 AM',
    status: 'CONFIRMED',
    triage_urgency: 'URGENT',
    payment_status: 'SIMULATED_SUCCESS',
    payment_amount: 180.00,
    reason: 'Wheezing and shortness of breath evaluation',
    created_at: '2026-08-10T15:00:00Z'
  }
];

export const MOCK_SYSTEM_METRICS = {
  total_patients: 148,
  active_doctors: 12,
  emergency_triages: 19,
  simulated_revenue: 14650.00
};

export const MOCK_PAYMENT_LOGS = [
  { id: 'PAY-101', appointment_id: 'app-001', amount: 200.00, payment_method: 'Mobile Money (MTN Sim)', status: 'SUCCESS', reference: 'MOMO-8839201', created_at: '2026-08-12T09:00:00Z' },
  { id: 'PAY-102', appointment_id: 'app-002', amount: 180.00, payment_method: 'Visa / Mastercard Sim', status: 'SUCCESS', reference: 'CARD-4491023', created_at: '2026-08-10T15:00:00Z' },
  { id: 'PAY-103', appointment_id: 'app-003', amount: 150.00, payment_method: 'Mobile Money (Telecel Sim)', status: 'SUCCESS', reference: 'MOMO-1192834', created_at: '2026-08-08T11:20:00Z' },
];
