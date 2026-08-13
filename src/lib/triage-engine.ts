import { UrgencyLevel } from './types';

export interface DynamicTriageRule {
  id: string;
  category: string;
  symptom: string;
  severity_threshold: number;
  red_flags_required?: string[];
  urgency_output: UrgencyLevel;
  action_recommendation: string;
  recommended_specialty: string;
  active: boolean;
  priority_weight: number;
}

export const CRITICAL_RED_FLAGS = [
  'Chest pain or pressure radiating to arm/jaw',
  'Severe shortness of breath at rest',
  'Sudden weakness or numbness on one side of face/body',
  'High fever (> 39.5°C) with neck stiffness',
  'Blue lips, facial discoloration, or hypoxia',
  'Uncontrolled or heavy bleeding',
];

export const SYMPTOM_SPECIALTY_MAP: Record<string, string> = {
  'Chest Pain / Palpitations': 'Cardiology',
  'Shortness of Breath / Asthma / Cough': 'Pulmonology',
  'Severe Headache / Dizziness / Numbness': 'Neurology',
  'High Fever / Chills / Systemic Illness': 'General Practice / Internal Medicine',
  'Severe Abdominal Pain / Vomiting': 'Gastroenterology',
  'Skin Rash / Allergic Flare-up': 'Dermatology',
  'Routine Checkup / Medical Certificate': 'General Practice',
};

export const INITIAL_TRIAGE_RULES: DynamicTriageRule[] = [
  {
    id: 'RULE-001',
    category: 'CARDIOVASCULAR',
    symptom: 'Chest Pain / Pressure',
    severity_threshold: 7,
    red_flags_required: ['Chest pain or pressure radiating to arm/jaw', 'Severe shortness of breath at rest'],
    urgency_output: 'EMERGENCY',
    action_recommendation: 'Red flag emergency detected! Call 112 or proceed immediately to nearest emergency room.',
    recommended_specialty: 'Emergency Cardiology',
    active: true,
    priority_weight: 100,
  },
  {
    id: 'RULE-002',
    category: 'CARDIOVASCULAR',
    symptom: 'Palpitations & Shortness of Breath',
    severity_threshold: 6,
    urgency_output: 'URGENT',
    action_recommendation: 'High urgency cardiovascular assessment required. Book urgent slot within 24 hours.',
    recommended_specialty: 'Cardiology',
    active: true,
    priority_weight: 80,
  },
  {
    id: 'RULE-003',
    category: 'RESPIRATORY',
    symptom: 'Acute Respiratory Distress',
    severity_threshold: 8,
    red_flags_required: ['Blue lips, facial discoloration, or hypoxia'],
    urgency_output: 'EMERGENCY',
    action_recommendation: 'Critical oxygen deficiency indicators! Seek immediate emergency transport.',
    recommended_specialty: 'Emergency Pulmonology',
    active: true,
    priority_weight: 95,
  },
  {
    id: 'RULE-004',
    category: 'RESPIRATORY',
    symptom: 'Persistent Wheezing & Cough',
    severity_threshold: 5,
    urgency_output: 'SEMI_URGENT',
    action_recommendation: 'Moderate respiratory distress. Telehealth consultation recommended within 48 hours.',
    recommended_specialty: 'Pulmonology / General Medicine',
    active: true,
    priority_weight: 50,
  },
  {
    id: 'RULE-005',
    category: 'NEUROLOGICAL',
    symptom: 'Sudden Numbness or Facial Droop',
    severity_threshold: 8,
    red_flags_required: ['Sudden weakness or numbness on one side of face/body'],
    urgency_output: 'EMERGENCY',
    action_recommendation: 'Potential stroke indicators (FAST protocol)! Call 112 emergency services immediately.',
    recommended_specialty: 'Emergency Neurology',
    active: true,
    priority_weight: 100,
  },
  {
    id: 'RULE-006',
    category: 'GENERAL',
    symptom: 'Routine Health Checkup / Certificate',
    severity_threshold: 1,
    urgency_output: 'ROUTINE',
    action_recommendation: 'Standard outpatient consultation. Select any available doctor slot within 7 days.',
    recommended_specialty: 'General Practice',
    active: true,
    priority_weight: 10,
  },
  // RULE-007 and RULE-008 close defect D-03. Both red flags below were already
  // presented to patients by the intake wizard but were not bound to any
  // EMERGENCY rule, so they contributed +10 to the score instead of triggering
  // the safety short-circuit required by FR-2.6.
  //
  // A severity_threshold of 8 is used for both so that neither rule alters the
  // existing non-red-flag rule-selection outcome for moderate presentations;
  // the threshold is not consulted at all on the red-flag short-circuit path.
  {
    id: 'RULE-007',
    category: 'INFECTIOUS',
    symptom: 'High Fever with Neck Stiffness (suspected meningitis)',
    severity_threshold: 8,
    red_flags_required: ['High fever (> 39.5°C) with neck stiffness'],
    urgency_output: 'EMERGENCY',
    action_recommendation:
      'Possible meningitis indicators (fever with neck stiffness)! Call 112 or proceed immediately to the nearest emergency room.',
    recommended_specialty: 'Emergency Medicine / Infectious Disease',
    active: true,
    priority_weight: 98,
  },
  {
    id: 'RULE-008',
    category: 'TRAUMA',
    symptom: 'Uncontrolled or Heavy Bleeding (haemorrhage)',
    severity_threshold: 8,
    red_flags_required: ['Uncontrolled or heavy bleeding'],
    urgency_output: 'EMERGENCY',
    action_recommendation:
      'Uncontrolled bleeding detected! Apply firm direct pressure to the wound and call 112 or proceed immediately to the nearest emergency room.',
    recommended_specialty: 'Emergency Medicine / Trauma',
    active: true,
    priority_weight: 97,
  },
];

export interface TriageInput {
  primary_symptom: string;
  category: string;
  severity: number; // 1-10
  duration_days: number;
  red_flags: string[];
  additional_notes?: string;
}

export interface TriageResultOutput {
  severity_score: number; // 0 - 100
  urgency_level: UrgencyLevel;
  action_recommendation: string;
  recommended_specialty: string;
  matched_rules: string[];
  is_emergency_redirect: boolean;
}

export function evaluateSymptomTriage(
  input: TriageInput,
  customRules: DynamicTriageRule[] = INITIAL_TRIAGE_RULES
): TriageResultOutput {
  const activeRules = customRules.filter((r) => r.active);
  let matchedRules: string[] = [];

  // Check Red Flag Emergency Redirects
  const hasRedFlagMatch = activeRules.find(
    (rule) =>
      rule.urgency_output === 'EMERGENCY' &&
      rule.red_flags_required?.some((rf) => input.red_flags.includes(rf))
  );

  if (hasRedFlagMatch) {
    return {
      severity_score: 95,
      urgency_level: 'EMERGENCY',
      action_recommendation: hasRedFlagMatch.action_recommendation,
      recommended_specialty: hasRedFlagMatch.recommended_specialty,
      matched_rules: [hasRedFlagMatch.id],
      is_emergency_redirect: true,
    };
  }

  // Calculate Base Severity Score (0 - 100)
  let score = input.severity * 8; // Max 80 from slider

  if (input.duration_days <= 2) {
    score += 15; // Acute onset bonus
  } else if (input.duration_days > 14) {
    score += 5; // Chronic onset
  }

  if (input.red_flags.length > 0) {
    score += input.red_flags.length * 10;
  }

  const finalScore = Math.min(100, Math.max(0, score));

  // Match best active rule
  const matchedRule = activeRules
    .filter((r) => input.severity >= r.severity_threshold)
    .sort((a, b) => b.priority_weight - a.priority_weight)[0];

  if (matchedRule) {
    matchedRules.push(matchedRule.id);
  }

  let urgency: UrgencyLevel = 'ROUTINE';
  let actionRec = 'Routine telehealth consultation recommended within 7 days.';
  let specialty = 'General Practice';

  if (finalScore >= 80) {
    urgency = 'EMERGENCY';
    actionRec = 'Severe symptom score detected! Please seek immediate emergency medical care.';
    specialty = 'Emergency Medical Services';
  } else if (finalScore >= 60 || (matchedRule && matchedRule.urgency_output === 'URGENT')) {
    urgency = 'URGENT';
    actionRec = 'Urgent non-emergency case. Book appointment within 24 hours.';
    specialty = matchedRule ? matchedRule.recommended_specialty : 'Cardiology / Internal Medicine';
  } else if (finalScore >= 35 || (matchedRule && matchedRule.urgency_output === 'SEMI_URGENT')) {
    urgency = 'SEMI_URGENT';
    actionRec = 'Semi-urgent condition. Book consultation within 48 hours.';
    specialty = matchedRule ? matchedRule.recommended_specialty : 'General Practice';
  }

  if (matchedRule) {
    actionRec = matchedRule.action_recommendation;
    specialty = matchedRule.recommended_specialty;
  }

  return {
    severity_score: finalScore,
    urgency_level: urgency,
    action_recommendation: actionRec,
    recommended_specialty: specialty,
    matched_rules: matchedRules,
    is_emergency_redirect: urgency === 'EMERGENCY',
  };
}

// Alias for backward compatibility
export function evaluateTriageRules(input: any, patientId?: string) {
  const formattedInput: TriageInput = {
    primary_symptom: input.primary_symptom || 'General Symptom',
    category: 'GENERAL',
    severity: input.pain_scale || input.severity || 5,
    duration_days: input.duration === 'Sudden (< 6 hours)' ? 1 : 4,
    red_flags: input.red_flags || [],
    additional_notes: input.additional_notes,
  };

  const res = evaluateSymptomTriage(formattedInput);

  return {
    id: `triage-${Date.now().toString().slice(-4)}`,
    patient_id: patientId || 'patient-1',
    primary_symptom: formattedInput.primary_symptom,
    symptom_duration: input.duration || '1-3 days',
    pain_scale: formattedInput.severity,
    pain_score: formattedInput.severity,
    red_flag_present: formattedInput.red_flags.length > 0,
    red_flags: formattedInput.red_flags,
    urgency_level: res.urgency_level,
    severity_score: res.severity_score,
    triage_summary: res.action_recommendation,
    action_recommendation: res.action_recommendation,
    recommended_specialty: res.recommended_specialty,
    is_emergency_redirect: res.is_emergency_redirect,
    matched_rules: res.matched_rules,
    created_at: new Date().toISOString()
  };
}
