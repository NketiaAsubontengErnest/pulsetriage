/**
 * Unit tests for the REAL post-call clinical record builder
 * (src/lib/consultation-notes.ts) used when a doctor clicks
 * "Done — Submit Notes & Mark Consultation Completed".
 *
 * Run:  npm run test:unit      (npx tsx --test tests/*.unit.test.mts)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { composeConsultationNotes } from '../src/lib/consultation-notes.ts';

const signed_at = new Date('2026-08-14T11:05:00');

test('records every section the doctor filled in after the call', () => {
  const notes = composeConsultationNotes({
    appointment_date: '2026-08-14',
    start_time: '10:00',
    end_time: '10:30',
    specialty: 'Cardiology',
    doctor_name: 'Dr. Kwame Mensah',
    patient_name: 'Ama Serwaa Prempeh',
    summary: 'Patient reports chest tightness after climbing stairs.',
    subjective: 'Exertional chest tightness for two weeks.',
    objective: 'Alert, no distress on video. BP 128/82.',
    assessment: 'Stable angina, likely exertional.',
    icd10: ['I20.9', 'R07.9'],
    plan: '1. Aspirin 75mg daily\n2. ECG and lipid panel',
    follow_up: 'Review in one week, sooner if pain at rest.',
    additional_notes: 'Discussed smoking cessation.',
    signed_at,
  });

  assert.match(notes, /\[TELEHEALTH CONSULTATION RECORD\]/);
  assert.match(notes, /Patient: Ama Serwaa Prempeh/);
  assert.match(notes, /Attending: Dr\. Kwame Mensah/);
  assert.match(notes, /2026-08-14 10:00–10:30 \(Cardiology\)/);
  assert.match(notes, /S - Subjective: Exertional chest tightness for two weeks\./);
  assert.match(notes, /O - Objective: Alert, no distress on video\. BP 128\/82\./);
  assert.match(notes, /A - Assessment \/ Diagnosis: Stable angina, likely exertional\./);
  assert.match(notes, /ICD-10 suggestions: I20\.9, R07\.9/);
  assert.match(notes, /Aspirin 75mg daily/);
  assert.match(notes, /Follow-up instructions: Review in one week/);
  assert.match(notes, /Discussed smoking cessation\./);
});

test('additional notes written after the video call survive into the record', () => {
  const notes = composeConsultationNotes({
    patient_name: 'Ama Serwaa Prempeh',
    additional_notes: 'Patient advised to hydrate and rest. Review in one week.',
    signed_at,
  });

  assert.match(notes, /Additional doctor's notes:\nPatient advised to hydrate and rest\./);
});

test('empty sections fall back to explicit placeholders rather than blanks', () => {
  const notes = composeConsultationNotes({ patient_name: 'Ama Serwaa Prempeh', signed_at });

  assert.match(notes, /Consultation summary:\nTelehealth video consultation completed\./);
  assert.match(notes, /S - Subjective: N\/A/);
  assert.match(notes, /ICD-10 suggestions: N\/A/);
  assert.match(notes, /Follow-up instructions: None recorded\./);
  assert.match(notes, /Additional doctor's notes:\nNone\./);
  assert.ok(!/undefined/.test(notes), 'no undefined placeholders leak into the clinical record');
});

test('whitespace-only input is treated as empty', () => {
  const notes = composeConsultationNotes({ assessment: '   ', follow_up: '\n ', signed_at });

  assert.match(notes, /A - Assessment \/ Diagnosis: N\/A/);
  assert.match(notes, /Follow-up instructions: None recorded\./);
});

test('the sign-off timestamp is stamped on the record', () => {
  const notes = composeConsultationNotes({ signed_at });

  assert.match(notes, new RegExp(`Signed off at ${signed_at.toLocaleString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
});
