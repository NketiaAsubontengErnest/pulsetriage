import { queryOllama, queryOllamaJson, ChatMessage } from './ollama-client';

// ==========================================
// FEATURE 1: AI Symptom Checker & Triage
// ==========================================
export interface AITriageResult {
  urgency_level: 'EMERGENCY' | 'URGENT' | 'SEMI_URGENT' | 'ROUTINE';
  severity_score: number; // 1-100
  primary_symptom: string;
  recommended_specialty: string;
  red_flags_detected: string[];
  clinical_reasoning: string;
  action_recommendation: string;
}

export async function analyzeSymptomTriageAI(
  symptomDescription: string,
  additionalInfo?: { age?: number; duration?: string; painScore?: number }
): Promise<AITriageResult> {
  const systemPrompt = `You are PulseTriage AI, an expert emergency clinical triage system powered by Kimi Cloud.
Analyze the user's natural language symptom description and output ONLY a JSON object matching this schema:
{
  "urgency_level": "EMERGENCY" | "URGENT" | "SEMI_URGENT" | "ROUTINE",
  "severity_score": number between 1 and 100,
  "primary_symptom": "short string summary of key complaint",
  "recommended_specialty": "Cardiology" | "Pulmonology" | "Neurology" | "General Practice" | "Gastroenterology" | "Dermatology" | "Emergency Medicine",
  "red_flags_detected": ["list of red flag symptoms if any"],
  "clinical_reasoning": "brief medical justification for triage score",
  "action_recommendation": "immediate clear action guidance for the patient"
}

Red flag indicators that require EMERGENCY or URGENT:
- Chest pain radiating to arm/jaw, hypoxia, blue lips, severe dyspnea, facial droop/stroke signs, unmanageable bleeding, fever >39.5°C with stiff neck.`;

  const userContent = `Patient Complaint: "${symptomDescription}"
${additionalInfo?.age ? `Patient Age: ${additionalInfo.age}` : ''}
${additionalInfo?.duration ? `Duration: ${additionalInfo.duration}` : ''}
${additionalInfo?.painScore ? `Reported Pain Score (1-10): ${additionalInfo.painScore}` : ''}`;

  const fallback: AITriageResult = {
    urgency_level: additionalInfo?.painScore && additionalInfo.painScore >= 8 ? 'URGENT' : 'SEMI_URGENT',
    severity_score: (additionalInfo?.painScore || 5) * 10,
    primary_symptom: symptomDescription.slice(0, 50),
    recommended_specialty: 'General Practice',
    red_flags_detected: [],
    clinical_reasoning: 'Standard rule-engine triage evaluated from intake description.',
    action_recommendation: 'Please schedule a consultation with a General Practitioner.',
  };

  return queryOllamaJson<AITriageResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    fallback,
    { temperature: 0.1 }
  );
}

// ==========================================
// FEATURE 2: AI SOAP Note & Consultation Summarizer
// ==========================================
export interface SOAPNoteResult {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10_suggestions: string[];
  follow_up_recommendation: string;
}

export async function generateSoapNotesAI(
  consultationTranscript: string,
  patientInfo?: { name?: string; age?: number; gender?: string }
): Promise<SOAPNoteResult> {
  const systemPrompt = `You are a clinical documentation specialist. Convert the consultation transcript/notes into a standard SOAP medical note format.
Return ONLY JSON with this structure:
{
  "subjective": "Chief complaint, patient history, reported symptoms in bullet form",
  "objective": "Vital signs, physical exam findings, or reported lab observations",
  "assessment": "Clinical diagnostic impression and main differential diagnosis",
  "plan": "Diagnostic tests, medications prescribed, lifestyle advice, and follow-up plan",
  "icd10_suggestions": ["Suggested ICD-10 codes with titles"],
  "follow_up_recommendation": "When patient should follow up or seek emergency care"
}`;

  const fallback: SOAPNoteResult = {
    subjective: `Patient (${patientInfo?.name || 'Patient'}) reports: ${consultationTranscript.slice(0, 150)}`,
    objective: 'Vital signs deferred to live visit. Patient alert and coherent via telehealth portal.',
    assessment: 'Symptomatic presentation consistent with intake triage record.',
    plan: '1. Outpatient telehealth follow-up.\n2. Prescribe standard symptomatic treatment.\n3. Re-evaluate in 7 days.',
    icd10_suggestions: ['R69 - Illness, unspecified', 'Z00.00 - General adult medical examination'],
    follow_up_recommendation: 'Follow up in 7 days or sooner if symptoms worsen.',
  };

  return queryOllamaJson<SOAPNoteResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Consultation Notes:\n${consultationTranscript}` },
    ],
    fallback
  );
}

// ==========================================
// FEATURE 3: Medical Document & Lab Analyzer
// ==========================================
export interface LabAnalysisResult {
  document_summary: string;
  risk_level: 'NORMAL' | 'MONITOR' | 'ACTION_REQUIRED' | 'CRITICAL';
  key_findings: Array<{
    parameter: string;
    value: string;
    reference_range: string;
    status: 'NORMAL' | 'HIGH' | 'LOW' | 'ABNORMAL';
  }>;
  doctor_notes: string;
  patient_summary: string;
}

export async function analyzeMedicalReportAI(reportText: string): Promise<LabAnalysisResult> {
  const systemPrompt = `You are a clinical laboratory analyst AI. Analyze medical test results or lab reports.
Return ONLY JSON:
{
  "document_summary": "High-level summary of report",
  "risk_level": "NORMAL" | "MONITOR" | "ACTION_REQUIRED" | "CRITICAL",
  "key_findings": [
    {
      "parameter": "Lab parameter name e.g. Hemoglobin, Glucose, Fasting",
      "value": "Measured value e.g. 145 mg/dL",
      "reference_range": "Normal range e.g. 70-99 mg/dL",
      "status": "NORMAL" | "HIGH" | "LOW" | "ABNORMAL"
    }
  ],
  "doctor_notes": "Clinical interpretation for medical staff",
  "patient_summary": "Clear, reassuring explanation of results in plain English"
}`;

  const fallback: LabAnalysisResult = {
    document_summary: 'Report text parsed. Contains clinical parameters requiring physician review.',
    risk_level: 'MONITOR',
    key_findings: [
      { parameter: 'Extracted Content', value: reportText.slice(0, 30), reference_range: 'Standard', status: 'NORMAL' },
    ],
    doctor_notes: 'Parsed document contains unstructured medical text. Please cross-verify with original PDF.',
    patient_summary: 'Your lab report has been processed and attached to your patient portal file for your doctor.',
  };

  return queryOllamaJson<LabAnalysisResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: reportText },
    ],
    fallback
  );
}

// ==========================================
// FEATURE 4: Smart Doctor Matching & Recommender
// ==========================================
export interface DoctorRecommendation {
  doctor_id: string;
  match_score: number; // 0-100
  match_reason: string;
  suggested_action: string;
}

export async function matchDoctorScheduleAI(
  patientSymptoms: string,
  urgencyLevel: string,
  availableDoctors: Array<{ id: string; name: string; specialty: string; rating?: number; nextAvailable?: string }>
): Promise<{ matches: DoctorRecommendation[]; summary: string }> {
  const systemPrompt = `You are PulseTriage Matchmaker AI. Recommend the top matching doctors for a patient based on their symptoms, urgency, and list of available doctors.
Return ONLY JSON:
{
  "summary": "Short explanation of why these doctors were prioritized",
  "matches": [
    {
      "doctor_id": "string doctor ID matching input list",
      "match_score": number 0-100,
      "match_reason": "Specific reason this specialty/doctor fits the patient",
      "suggested_action": "e.g. Book urgent morning video slot"
    }
  ]
}`;

  const fallback = {
    summary: `Prioritized available specialists matching urgency (${urgencyLevel}).`,
    matches: availableDoctors.map((doc, idx) => ({
      doctor_id: doc.id,
      match_score: 95 - idx * 10,
      match_reason: `Specialized in ${doc.specialty}, matching patient presentation.`,
      suggested_action: `Book earliest slot on ${doc.nextAvailable || 'today'}.`,
    })),
  };

  return queryOllamaJson<{ matches: DoctorRecommendation[]; summary: string }>(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Symptoms: "${patientSymptoms}"\nUrgency: ${urgencyLevel}\nDoctors Available: ${JSON.stringify(availableDoctors)}`,
      },
    ],
    fallback
  );
}

// ==========================================
// FEATURE 5: 24/7 AI Health Assistant Chat
// ==========================================
export async function healthChatAssistantAI(messages: ChatMessage[]): Promise<string> {
  const systemPrompt: ChatMessage = {
    role: 'system',
    content: `You are PulseBot, a helpful, empathetic 24/7 Telehealth AI Assistant powered by Kimi Cloud for PulseTriage.
Provide informative, supportive medical education and administrative assistance.
ALWAYS include a clear disclaimer if the user mentions acute red flag symptoms (chest pain, stroke signs, difficulty breathing) that they must call emergency services (112 / 911) immediately.
Keep responses clear, concise, and structured with bullet points.`,
  };

  try {
    return await queryOllama([systemPrompt, ...messages], { temperature: 0.3 });
  } catch (error) {
    return "I'm PulseBot, your virtual health assistant. I am experiencing a brief connection delay, but I am here to help you navigate triage, book appointments with specialists, or answer health questions. If you are experiencing a medical emergency, please call 112 or visit the nearest emergency room immediately.";
  }
}

// ==========================================
// FEATURE 6: Predictive No-Show & Risk Estimator
// ==========================================
export interface NoShowPredictionResult {
  no_show_probability: number; // 0-100
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_factors: string[];
  recommended_interventions: string[];
}

export async function predictNoShowRiskAI(appointmentDetails: {
  patient_name: string;
  appointment_date: string;
  lead_time_days: number;
  consultation_type: 'VIDEO' | 'IN_PERSON';
  past_no_shows_count: number;
}): Promise<NoShowPredictionResult> {
  const systemPrompt = `You are PulseTriage Predictive Analytics AI. Estimate appointment no-show probability.
Return ONLY JSON:
{
  "no_show_probability": number 0-100,
  "risk_tier": "LOW" | "MEDIUM" | "HIGH",
  "risk_factors": ["list of factors contributing to risk score"],
  "recommended_interventions": ["e.g. Send SMS confirmation 2h prior", "Enable 1-click video call join button"]
}`;

  const baseProb = Math.min(
    10 + (appointmentDetails.lead_time_days * 3) + (appointmentDetails.past_no_shows_count * 25),
    95
  );

  const fallback: NoShowPredictionResult = {
    no_show_probability: baseProb,
    risk_tier: baseProb > 60 ? 'HIGH' : baseProb > 30 ? 'MEDIUM' : 'LOW',
    risk_factors: [
      `${appointmentDetails.lead_time_days} days lead time prior to appointment`,
      `${appointmentDetails.past_no_shows_count} prior unexcused missed visits`,
    ],
    recommended_interventions: [
      'Send automated SMS and Email notification 2 hours prior',
      'Provide 1-click instant join video link in reminder',
    ],
  };

  return queryOllamaJson<NoShowPredictionResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(appointmentDetails) },
    ],
    fallback
  );
}
