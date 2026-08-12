const test = require('node:test');
const assert = require('assert');

// Simple JS standalone verification of Triage Logic
function runTriageTest(symptom, painScore, redFlags, duration) {
  let score = 20; // Default base
  if (symptom.includes('Chest Pain')) score = 45;
  if (symptom.includes('Breathing')) score = 50;
  if (symptom.includes('Headache')) score = 40;
  if (symptom.includes('Checkup')) score = 5;

  score += Math.round(painScore * 2.5);
  if (duration === 'Sudden (< 6 hours)') score += 15;
  if (redFlags && redFlags.length > 0) score += 40;

  const finalScore = Math.min(Math.max(score, 5), 100);
  let urgency = 'ROUTINE';
  if (finalScore >= 80 || (redFlags && redFlags.length > 0)) urgency = 'EMERGENCY';
  else if (finalScore >= 60) urgency = 'URGENT';
  else if (finalScore >= 35) urgency = 'SEMI_URGENT';

  return { finalScore, urgency };
}

test('Triage Engine - Emergency Red Flag Trigger', () => {
  const result = runTriageTest('Chest Pain / Palpitations', 8, ['Chest pain or pressure radiates to arm/jaw'], 'Sudden (< 6 hours)');
  assert.strictEqual(result.urgency, 'EMERGENCY');
  assert.ok(result.finalScore >= 80);
});

test('Triage Engine - Urgent Classification', () => {
  const result = runTriageTest('Severe Headache / Dizziness / Numbness', 7, [], 'Sudden (< 6 hours)');
  assert.strictEqual(result.urgency, 'URGENT');
});

test('Triage Engine - Routine Checkup Classification', () => {
  const result = runTriageTest('Routine Checkup / Medical Certificate', 1, [], '3-7 days');
  assert.strictEqual(result.urgency, 'ROUTINE');
  assert.ok(result.finalScore < 35);
});
