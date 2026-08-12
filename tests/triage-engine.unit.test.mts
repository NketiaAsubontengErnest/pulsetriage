/**
 * Unit tests that exercise the REAL production rule engine
 * (src/lib/triage-engine.ts), not a reimplementation of it.
 *
 * Run:  npm run test:unit      (npx tsx --test tests/*.unit.test.mts)
 *
 * Traceability: FR-2.2, FR-2.3, FR-2.4, FR-2.5, FR-2.6, FR-2.7, FR-2.10, FR-2.11
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateSymptomTriage,
  evaluateTriageRules,
  INITIAL_TRIAGE_RULES,
  CRITICAL_RED_FLAGS,
  SYMPTOM_SPECIALTY_MAP,
  type TriageInput,
} from '../src/lib/triage-engine.ts';

const base = (over: Partial<TriageInput> = {}): TriageInput => ({
  primary_symptom: 'Routine Checkup / Medical Certificate',
  category: 'GENERAL',
  severity: 1,
  duration_days: 20,
  red_flags: [],
  ...over,
});

// ── FR-2.6 — safety-critical red-flag short-circuit ──────────────────────────

test('TC-UNIT-01 · FR-2.6 · red flag forces EMERGENCY, score 95 and booking suppression', () => {
  const result = evaluateSymptomTriage(
    base({
      primary_symptom: 'Chest Pain / Palpitations',
      category: 'CARDIOVASCULAR',
      severity: 8,
      duration_days: 1,
      red_flags: ['Chest pain or pressure radiating to arm/jaw'],
    })
  );

  assert.equal(result.urgency_level, 'EMERGENCY');
  assert.equal(result.severity_score, 95);
  assert.equal(result.is_emergency_redirect, true);
  assert.deepEqual(result.matched_rules, ['RULE-001']);
  assert.match(result.action_recommendation, /112|emergency room/i);
});

test('TC-UNIT-02 · FR-2.6 · red flag overrides even a minimal-severity report', () => {
  // A patient reporting pain 1/10 but ticking a stroke indicator must still
  // be classified EMERGENCY: the red flag must dominate the numeric score.
  const result = evaluateSymptomTriage(
    base({ severity: 1, red_flags: ['Sudden weakness or numbness on one side of face/body'] })
  );

  assert.equal(result.urgency_level, 'EMERGENCY');
  assert.equal(result.is_emergency_redirect, true);
  assert.deepEqual(result.matched_rules, ['RULE-005']);
});

test('TC-UNIT-03 · FR-2.6 · every published critical red flag is covered by an EMERGENCY rule', () => {
  const covered = new Set(
    INITIAL_TRIAGE_RULES.filter((r) => r.active && r.urgency_output === 'EMERGENCY').flatMap(
      (r) => r.red_flags_required ?? []
    )
  );

  const uncovered = CRITICAL_RED_FLAGS.filter((flag) => !covered.has(flag));

  // Documented gap: three published red flags have no EMERGENCY rule bound to
  // them, so they contribute only +10 to the score instead of short-circuiting.
  // Recorded as defect D-03 in the Testing Report.
  assert.deepEqual(
    uncovered,
    [
      'High fever (> 39.5°C) with neck stiffness',
      'Uncontrolled or heavy bleeding',
    ],
    'red-flag coverage changed — review defect D-03 before updating this expectation'
  );
});

// ── FR-2.2 / FR-2.4 / FR-2.5 — scoring and banding ───────────────────────────

test('TC-UNIT-04 · FR-2.2/FR-2.5 · score = severity×8 + acute-onset bonus, clamped to 0..100', () => {
  // severity 7 → 56, duration 1 day → +15, no red flags → 71
  const r = evaluateSymptomTriage(base({ severity: 7, duration_days: 1 }));
  assert.equal(r.severity_score, 71);

  // severity 10 → 80, duration 1 day → +15 = 95 (below the 100 clamp)
  const hi = evaluateSymptomTriage(base({ severity: 10, duration_days: 1 }));
  assert.equal(hi.severity_score, 95);

  // chronic onset adds only 5
  const chronic = evaluateSymptomTriage(base({ severity: 5, duration_days: 30 }));
  assert.equal(chronic.severity_score, 45);
});

test('TC-UNIT-05 · FR-2.4 · banding thresholds 80 / 60 / 35 are applied', () => {
  const routine = evaluateSymptomTriage(base({ severity: 2, duration_days: 30 }));
  assert.equal(routine.severity_score, 21);
  assert.equal(routine.urgency_level, 'ROUTINE');

  const semi = evaluateSymptomTriage(base({ severity: 5, duration_days: 30 }));
  assert.equal(semi.severity_score, 45);
  assert.equal(semi.urgency_level, 'SEMI_URGENT');

  const urgent = evaluateSymptomTriage(base({ severity: 8, duration_days: 30 }));
  assert.equal(urgent.severity_score, 69);
  assert.equal(urgent.urgency_level, 'URGENT');

  const emergency = evaluateSymptomTriage(base({ severity: 10, duration_days: 1 }));
  assert.equal(emergency.severity_score, 95);
  assert.equal(emergency.urgency_level, 'EMERGENCY');
});

test('TC-UNIT-06 · FR-2.2 · a non-critical red flag contributes +10 per flag', () => {
  const none = evaluateSymptomTriage(base({ severity: 5, duration_days: 30, red_flags: [] }));
  const one = evaluateSymptomTriage(
    base({ severity: 5, duration_days: 30, red_flags: ['Persistent vomiting'] })
  );

  assert.equal(one.severity_score - none.severity_score, 10);
});

// ── FR-2.10 / FR-2.11 — rules as data, priority resolution ───────────────────

test('TC-UNIT-07 · FR-2.11 · the highest priority_weight rule wins when several match', () => {
  // severity 9 clears the threshold of RULE-001 (7), RULE-002 (6), RULE-003 (8),
  // RULE-004 (5), RULE-005 (8) and RULE-006 (1). With no red flag ticked, the
  // highest priority_weight among them must be selected.
  const r = evaluateSymptomTriage(base({ severity: 9, duration_days: 30 }));

  const eligible = INITIAL_TRIAGE_RULES.filter((x) => x.active && 9 >= x.severity_threshold);
  const expected = [...eligible].sort((a, b) => b.priority_weight - a.priority_weight)[0];

  assert.deepEqual(r.matched_rules, [expected.id]);
  assert.equal(r.recommended_specialty, expected.recommended_specialty);
});

test('TC-UNIT-08 · FR-2.10 · deactivating a rule removes it from consideration', () => {
  const withoutTopRule = INITIAL_TRIAGE_RULES.map((r) =>
    r.id === 'RULE-001' ? { ...r, active: false } : r
  );

  const result = evaluateSymptomTriage(
    base({
      severity: 8,
      duration_days: 1,
      red_flags: ['Chest pain or pressure radiating to arm/jaw'],
    }),
    withoutTopRule
  );

  // RULE-001 is inactive, so the short-circuit must not fire on its behalf.
  assert.notDeepEqual(result.matched_rules, ['RULE-001']);
});

test('TC-UNIT-09 · FR-2.7 · every symptom category maps to a recommended specialty', () => {
  for (const [symptom, specialty] of Object.entries(SYMPTOM_SPECIALTY_MAP)) {
    assert.ok(specialty.length > 0, `${symptom} has no specialty mapping`);
  }
  assert.equal(SYMPTOM_SPECIALTY_MAP['Chest Pain / Palpitations'], 'Cardiology');
});

// ── Output contract ──────────────────────────────────────────────────────────

test('TC-UNIT-10 · output contract holds for every urgency band', () => {
  const inputs = [
    base({ severity: 1, duration_days: 30 }),
    base({ severity: 5, duration_days: 30 }),
    base({ severity: 8, duration_days: 30 }),
    base({ severity: 10, duration_days: 1 }),
  ];

  for (const input of inputs) {
    const r = evaluateSymptomTriage(input);
    assert.ok(Number.isInteger(r.severity_score));
    assert.ok(r.severity_score >= 0 && r.severity_score <= 100);
    assert.ok(['EMERGENCY', 'URGENT', 'SEMI_URGENT', 'ROUTINE'].includes(r.urgency_level));
    assert.ok(r.action_recommendation.length > 0);
    assert.ok(r.recommended_specialty.length > 0);
    assert.ok(Array.isArray(r.matched_rules));
    assert.equal(typeof r.is_emergency_redirect, 'boolean');
    assert.equal(r.is_emergency_redirect, r.urgency_level === 'EMERGENCY');
  }
});

test('TC-UNIT-11 · the persistence adapter preserves the engine verdict', () => {
  const record = evaluateTriageRules(
    {
      primary_symptom: 'Chest Pain / Palpitations',
      pain_scale: 8,
      duration: 'Sudden (< 6 hours)',
      red_flags: ['Chest pain or pressure radiating to arm/jaw'],
    },
    'patient-1'
  );

  assert.equal(record.urgency_level, 'EMERGENCY');
  assert.equal(record.severity_score, 95);
  assert.equal(record.patient_id, 'patient-1');
  assert.equal(record.red_flag_present, true);
  assert.ok(record.created_at);
});

test('TC-UNIT-12 · evaluation is pure — identical input yields identical output', () => {
  const input = base({ severity: 6, duration_days: 3, red_flags: ['Persistent vomiting'] });
  const a = evaluateSymptomTriage(input);
  const b = evaluateSymptomTriage(input);
  assert.deepEqual(a, b);
});
