// Builds the clinical record a doctor signs off after a telehealth call.
// Kept free of React so it can be unit tested directly.

export interface ConsultationNoteInput {
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  specialty?: string;
  doctor_name?: string;
  patient_name?: string;
  summary?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  icd10?: string[];
  plan?: string;
  follow_up?: string;
  additional_notes?: string;
  signed_at?: Date;
}

const orNa = (value?: string) => (value && value.trim() ? value.trim() : 'N/A');

export function composeConsultationNotes(input: ConsultationNoteInput): string {
  const signedAt = input.signed_at ?? new Date();

  return `[TELEHEALTH CONSULTATION RECORD]
Consultation: ${input.appointment_date || 'N/A'} ${input.start_time || ''}–${input.end_time || ''} (${input.specialty || 'General Practice'})
Attending: ${input.doctor_name || 'Attending Physician'}
Patient: ${input.patient_name || 'Patient'}

Consultation summary:
${input.summary?.trim() || 'Telehealth video consultation completed.'}

S - Subjective: ${orNa(input.subjective)}
O - Objective: ${orNa(input.objective)}
A - Assessment / Diagnosis: ${orNa(input.assessment)}
ICD-10 suggestions: ${input.icd10?.length ? input.icd10.join(', ') : 'N/A'}
P - Plan, prescriptions & lab orders:
${orNa(input.plan)}

Follow-up instructions: ${input.follow_up?.trim() || 'None recorded.'}

Additional doctor's notes:
${input.additional_notes?.trim() || 'None.'}

Signed off at ${signedAt.toLocaleString()}`;
}
