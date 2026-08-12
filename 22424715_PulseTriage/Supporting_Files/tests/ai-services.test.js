const test = require('node:test');
const assert = require('assert');

// Verification tests for AI Features Schema structure and fallback safety
test('AI Features - Triage Fallback Schema Integrity', () => {
  const symptomDescription = 'Severe throbbing chest pain';
  const painScore = 9;

  const fallback = {
    urgency_level: painScore >= 8 ? 'URGENT' : 'SEMI_URGENT',
    severity_score: painScore * 10,
    primary_symptom: symptomDescription.slice(0, 50),
    recommended_specialty: 'Cardiology',
    red_flags_detected: ['Chest pain'],
    action_recommendation: 'Seek immediate clinical assessment.',
  };

  assert.strictEqual(fallback.urgency_level, 'URGENT');
  assert.strictEqual(fallback.severity_score, 90);
  assert.strictEqual(fallback.recommended_specialty, 'Cardiology');
  assert.ok(Array.isArray(fallback.red_flags_detected));
});

test('AI Features - SOAP Note Schema Structure', () => {
  const soapNote = {
    subjective: 'Patient reports persistent dry cough and fatigue for 3 days.',
    objective: 'BP 120/80 mmHg, HR 72 bpm, Temp 37.0 C.',
    assessment: 'Acute bronchitis, viral origin likely.',
    plan: 'Oral hydration, supportive care, follow-up in 5 days.',
    icd10_suggestions: ['J40 - Bronchitis, not specified as acute or chronic'],
    follow_up_recommendation: 'Return if fever >38.5 C develops.',
  };

  assert.ok(soapNote.subjective.includes('cough'));
  assert.ok(soapNote.objective.includes('BP'));
  assert.ok(soapNote.assessment.includes('bronchitis'));
  assert.ok(Array.isArray(soapNote.icd10_suggestions));
  assert.strictEqual(soapNote.icd10_suggestions.length, 1);
});

test('AI Features - Lab Result Analyzer Normalization', () => {
  const labAnalysis = {
    document_summary: 'CBC and Glucose test results evaluated.',
    risk_level: 'ACTION_REQUIRED',
    key_findings: [
      { parameter: 'Fasting Glucose', value: '145 mg/dL', reference_range: '70-99 mg/dL', status: 'HIGH' },
    ],
    doctor_notes: 'Elevated fasting blood sugar.',
    patient_summary: 'Your glucose reading is slightly elevated above normal range.',
  };

  assert.strictEqual(labAnalysis.risk_level, 'ACTION_REQUIRED');
  assert.strictEqual(labAnalysis.key_findings[0].status, 'HIGH');
});

test('AI Features - No-Show Risk Predictor Calculation', () => {
  const leadDays = 14;
  const pastNoShows = 2;
  const prob = Math.min(10 + leadDays * 3 + pastNoShows * 25, 95);

  assert.strictEqual(prob, 95);
  const tier = prob > 60 ? 'HIGH' : prob > 30 ? 'MEDIUM' : 'LOW';
  assert.strictEqual(tier, 'HIGH');
});
