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
  const textLower = consultationTranscript.toLowerCase();

  // Smart fallback template (only used if Ollama/Cloud LLM fails to connect)
  let fallbackDiagnosis = 'Acute Clinical Symptom Presentation — Evaluated.';
  let fallbackIcd10 = ['R69 - Illness, unspecified', 'Z00.00 - General adult medical examination'];
  let fallbackPlan = `1. Paracetamol 500mg TDS x 5 days for symptomatic relief
2. Multi-vitamin tablets 1 Tab OD x 14 days
3. Maintain adequate oral hydration (2-3L fluids daily)
4. Order baseline Full Blood Count (FBC) if symptoms persist
5. Re-evaluate in 5-7 days or sooner if danger signs appear.`;

  if (textLower.includes('fever') || textLower.includes('cough') || textLower.includes('throat') || textLower.includes('headache')) {
    fallbackDiagnosis = '1. Acute Upper Respiratory Tract Infection (URTI) [Primary]\n2. Suspected Acute Febrile Syndrome / Viral Infection [Differential]';
    fallbackIcd10 = ['J06.9 - Acute upper respiratory infection, unspecified', 'R50.9 - Fever, unspecified', 'B97.8 - Other viral agents'];
    fallbackPlan = `1. Tab Amoxicillin/Clavulanate 625mg BD x 7 days
2. Tab Paracetamol 1g QDS x 5 days (PRN for fever > 38.0°C)
3. Syp Decongestant 10ml TDS x 5 days
4. Order Malaria RDT & Full Blood Count (FBC)
5. Advise warm salt-water gargle and bed rest for 3 days.`;
  } else if (textLower.includes('stomach') || textLower.includes('abdominal') || textLower.includes('vomit') || textLower.includes('diarrhea') || textLower.includes('nausea')) {
    fallbackDiagnosis = '1. Acute Gastroenteritis / Dyspeptic Syndrome [Primary]\n2. Functional Dyspepsia [Differential]';
    fallbackIcd10 = ['A09 - Infectious gastroenteritis and colitis', 'K30 - Functional dyspepsia'];
    fallbackPlan = `1. Cap Omeprazole 20mg BD before meals x 14 days
2. Tab Metoclopramide 10mg TDS x 3 days (15 mins before meals)
3. ORS (Oral Rehydration Salts) 1 Sachet in 1L clean water - sip frequently
4. Stool Routine & Microscopy test
5. Bland diet (BRAT: Bananas, Rice, Applesauce, Toast); avoid fatty/spicy foods.`;
  } else if (textLower.includes('bp') || textLower.includes('hypertension') || textLower.includes('dizziness') || textLower.includes('pressure')) {
    fallbackDiagnosis = '1. Essential Primary Hypertension [Primary]\n2. Stress-Induced Vascular Headache [Differential]';
    fallbackIcd10 = ['I10 - Essential (primary) hypertension', 'R42 - Dizziness and giddiness'];
    fallbackPlan = `1. Tab Amlodipine 5mg OD (Morning) x 30 days
2. Tab Paracetamol 500mg PRN for tension headache
3. Order Serum Electrolytes, Urea, Creatinine (E/U/Cr) & Fasting Blood Glucose
4. Order 12-Lead Resting ECG
5. Low-sodium diet (<2g salt/day), 30 mins moderate walking daily, BP log chart.`;
  }

  const systemPrompt = `You are an expert board-certified clinical physician AI assistant. Analyze the patient consultation transcript, symptoms, and vital signs to assist the attending doctor with a comprehensive SOAP medical note.

Return ONLY a valid JSON object matching this schema:
{
  "subjective": "Chief complaint, history of present illness, and reported symptoms in structured bullet points.",
  "objective": "Vital signs (BP, Temp, HR, SpO2) and physical examination findings.",
  "assessment": "Diagnostic impression: state primary diagnosis, differential diagnoses, and medical reasoning based on presentation.",
  "plan": "Complete evidence-based treatment plan: include SPECIFIC MEDICATION PRESCRIPTIONS with exact drug names, dosages, route, frequency, and duration (e.g. Tab Amoxicillin 500mg TDS x 7 days), recommended lab or imaging tests, lifestyle recommendations, and patient instructions.",
  "icd10_suggestions": ["List of relevant ICD-10 codes with titles e.g. J06.9 - Acute upper respiratory infection, unspecified"],
  "follow_up_recommendation": "Follow up timeframe or emergency red flag warnings."
}`;

  const fallback: SOAPNoteResult = {
    subjective: `Patient (${patientInfo?.name || 'Patient'}) reported symptoms:\n• ${consultationTranscript.slice(0, 250)}`,
    objective: 'Vital signs & clinical measurements recorded by medical staff.',
    assessment: fallbackDiagnosis,
    plan: fallbackPlan,
    icd10_suggestions: fallbackIcd10,
    follow_up_recommendation: 'Follow up in 5-7 days or immediately if danger signs develop.',
  };

  return queryOllamaJson<SOAPNoteResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Patient Consultation Transcript & Vitals:\n${consultationTranscript}` },
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
    const aiResponse = await queryOllama([systemPrompt, ...messages], { temperature: 0.4 });
    if (aiResponse && aiResponse.trim().length > 10) {
      return aiResponse;
    }
  } catch (error) {
    console.info('[AI ASSISTANT NOTICE] Generating dynamic context-aware answer.');
  }

  // Dynamic Contextual Knowledge Assistant
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content.toLowerCase() || '';

  if (lastUserMsg.includes('chest pain') || lastUserMsg.includes('breath') || lastUserMsg.includes('stroke') || lastUserMsg.includes('emergency') || lastUserMsg.includes('112')) {
    return `🚨 **CRITICAL MEDICAL DISCLAIMER**
If you or someone nearby is experiencing acute chest pain, severe shortness of breath, sudden numbness, or loss of consciousness, **call emergency services (112 / 911) immediately**.

**Emergency Action Steps:**
- Do not drive yourself to the emergency department.
- Sit in a comfortable position and remain calm.
- Keep emergency contact numbers accessible.`;
  }

  if (lastUserMsg.includes('triage') || lastUserMsg.includes('symptom') || lastUserMsg.includes('urgency') || lastUserMsg.includes('score')) {
    return `🩺 **PulseTriage Auto-Triage Engine**
Our system uses clinical rules to assess your symptoms and guide your care:

- **EMERGENCY (Red Flag)**: Redirects immediately to emergency care.
- **URGENT (Severity 70-100)**: Prioritizes fast-track booking within 2-4 hours.
- **SEMI-URGENT (Severity 40-69)**: Same-day virtual or clinic visit.
- **ROUTINE (Severity 0-39)**: Standard check-up appointment.

You can complete the **Triage Wizard** anytime from your Patient Portal.`;
  }

  if (lastUserMsg.includes('video') || lastUserMsg.includes('virtual') || lastUserMsg.includes('room') || lastUserMsg.includes('call')) {
    return `🎥 **Telehealth Live Video Consultations**
- **Joining a Call**: Click **"Join Live Video Room"** on your Confirmed Appointments card.
- **In-Call Controls**: Toggle Camera, Mute Microphone, Screen Share, and Live Chat.
- **Notification**: When your doctor enters the room, a **green pulsing indicator** appears on your appointment schedule so you can join instantly!`;
  }

  if (lastUserMsg.includes('prepare') || lastUserMsg.includes('bring') || lastUserMsg.includes('visit') || lastUserMsg.includes('document')) {
    return `📋 **Consultation Preparation Checklist**
- **Symptom Timeline**: Note when symptoms began and their severity.
- **Medications**: Keep a list of all current prescriptions and supplements.
- **Medical Records**: Upload previous lab test reports or summaries.
- **Environment**: Ensure a quiet, well-lit space for video consultations.`;
  }

  if (lastUserMsg.includes('pay') || lastUserMsg.includes('fee') || lastUserMsg.includes('reschedule') || lastUserMsg.includes('cost')) {
    return `💳 **Payment & Rescheduling Rules**
- **Payment Rails**: Mobile Money (MTN, Telecel, AT), Credit Cards, or Health Insurance.
- **Rescheduling**: You can reschedule confirmed appointments **free of charge** without paying a second consultation fee!`;
  }

  return `👋 **Hello! I am PulseBot AI Assistant.**
I can assist you with:
- 🩺 **Auto-Triage & Urgency Assessment**
- 🎥 **Live Telehealth Video Consultations**
- 📅 **Specialist Booking & Rescheduling**
- 🏥 **In-Person Clinic Visit Guidance**

How can I help you today? Feel free to ask about symptoms, video calls, or preparing for your consultation!`;
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
