'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { evaluateTriageRules, CRITICAL_RED_FLAGS, SYMPTOM_SPECIALTY_MAP } from '@/lib/triage-engine';
import { TriageInput, TriageAssessment, UrgencyLevel } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { createTriage } from '@/lib/api';

interface TriageWizardProps {
  onTriageComplete?: (assessment: TriageAssessment) => void;
}

const DURATIONS = ['Sudden (< 6 hours)', '24-48 hours', '3-7 days', 'Over 1 week'];

const URGENCY_ICON: Record<UrgencyLevel, string> = {
  EMERGENCY: 'bi-exclamation-octagon-fill',
  URGENT: 'bi-exclamation-triangle-fill',
  SEMI_URGENT: 'bi-clock-history',
  ROUTINE: 'bi-check2-circle',
};

const painTone = (score: number) => (score >= 8 ? 'text-bg-danger' : score >= 5 ? 'text-bg-warning' : 'text-bg-success');

export const TriageWizard: React.FC<TriageWizardProps> = ({ onTriageComplete }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  /** Tells the patient when the AI was unreachable instead of failing silently. */
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Form State
  const [primarySymptom, setPrimarySymptom] = useState<string>('Chest Pain / Palpitations');
  const [symptomDuration, setSymptomDuration] = useState<string>('24-48 hours');
  const [painScore, setPainScore] = useState<number>(5);
  const [selectedRedFlags, setSelectedRedFlags] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Result State
  const [assessmentResult, setAssessmentResult] = useState<TriageAssessment | null>(null);

  const handleRedFlagToggle = (flag: string) => {
    if (selectedRedFlags.includes(flag)) {
      setSelectedRedFlags(selectedRedFlags.filter((f) => f !== flag));
    } else {
      setSelectedRedFlags([...selectedRedFlags, flag]);
    }
  };

  const handleExecuteTriage = async () => {
    if (!user) {
      setSubmitError('You must be signed in to run a triage assessment.');
      return;
    }

    const input: TriageInput = {
      primary_symptom: primarySymptom,
      symptom_duration: symptomDuration,
      pain_score: painScore,
      red_flags: selectedRedFlags,
      additional_notes: additionalNotes,
    };

    // Rules run client-side; the resulting assessment is persisted to SQLite.
    const result = evaluateTriageRules(input, user.id);

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const { triage } = await createTriage({
        patient_id: user.id,
        primary_symptom: result.primary_symptom,
        symptom_duration: result.symptom_duration,
        pain_score: result.pain_score,
        red_flag_present: result.red_flag_present,
        red_flags: result.red_flags,
        severity_score: result.severity_score,
        urgency_level: result.urgency_level,
        recommended_specialty: result.recommended_specialty,
        triage_summary: result.triage_summary,
        action_recommendation: result.action_recommendation,
      });

      // Use the persisted record (real DB id) so booking can link to it.
      const saved: TriageAssessment = { ...result, ...triage, red_flags: result.red_flags };
      setAssessmentResult(saved);
      onTriageComplete?.(saved);
      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save your triage assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="h5 mb-1 section-title">
            <i className="bi bi-clipboard2-pulse" aria-hidden="true" />
            <span>Rule-Engine Assessment</span>
          </h2>
          <p className="text-muted mb-0">Answer four short steps for an immediate urgency classification.</p>
        </div>
        <span className="wizard-steps">Step {step} of 4</span>
      </div>

      <div className="progress mb-4" role="progressbar" aria-valuenow={step * 25} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar bg-primary" style={{ width: `${(step / 4) * 100}%` }}>
          {step * 25}%
        </div>
      </div>

      {/* STEP 1 — Primary symptom */}
      {step === 1 && (
        <div>
          {/* AI Natural Language Helper */}
          <div className="p-3 mb-4 rounded-3 border border-primary-subtle bg-primary-subtle bg-opacity-10">
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="bi bi-stars text-warning fs-5" />
              <strong className="text-primary">AI Natural Language Triage Assistant</strong>
              <span className="badge text-bg-warning text-dark uppercase font-mono" style={{ fontSize: '10px' }}>Ollama Cloud</span>
            </div>
            <p className="small text-muted mb-2">
              Or describe how you are feeling in your own words. A panel of AI models will evaluate your symptom urgency, detect red flags, and recommend the right specialty — the answer they agree on is the one you see.
            </p>
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g., I've had a severe throbbing headache and dizziness for 2 days with pain level 8..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                disabled={!additionalNotes.trim() || isSubmitting}
                onClick={async () => {
                  if (!additionalNotes.trim()) return;
                  setIsSubmitting(true);
                  setAiNotice(null);
                  try {
                    const res = await fetch('/api/ai/triage', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        symptomDescription: additionalNotes,
                        painScore: painScore,
                        duration: symptomDuration,
                      }),
                    });
                    const data = await res.json();
                    if (data.success && data.triage) {
                      if (data.triage.primary_symptom) {
                        setPrimarySymptom(data.triage.primary_symptom);
                      }
                      if (data.triage.red_flags_detected?.length > 0) {
                        setSelectedRedFlags(data.triage.red_flags_detected);
                      }
                      // A silent fallback is indistinguishable from a real AI
                      // answer, so say which one this was.
                      if (data.triage.ai_provenance?.method === 'fallback') {
                        setAiNotice(
                          'The AI models could not be reached, so this was filled in by the built-in rules rather than AI. Your assessment is still valid.'
                        );
                      }
                      setStep(3); // Jump straight to red flags / summary
                    } else {
                      setAiNotice(data.error || 'The AI assistant could not analyse your description. Please pick a symptom below instead.');
                    }
                  } catch (e) {
                    console.error(e);
                    setAiNotice('Could not reach the AI assistant. Please pick a symptom below instead.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? <i className="bi bi-arrow-repeat spin" /> : <i className="bi bi-stars text-warning" />}
                <span>AI Analyze &amp; Triage</span>
              </button>
            </div>

            {aiNotice && (
              <div className="alert alert-warning d-flex align-items-start gap-2 py-2 px-3 small mt-2 mb-0" role="status">
                <i className="bi bi-exclamation-triangle-fill mt-1 flex-shrink-0" />
                <span className="flex-grow-1">{aiNotice}</span>
                <button type="button" className="btn-close btn-sm" onClick={() => setAiNotice(null)} aria-label="Dismiss" />
              </div>
            )}
          </div>

          <p className="eyebrow mb-3">Or choose your primary symptom below:</p>

          <div className="row g-2">
            {Object.keys(SYMPTOM_SPECIALTY_MAP).map((symptom) => (
              <div className="col-12 col-md-6" key={symptom}>
                <button
                  type="button"
                  className={`choice-tile h-100${primarySymptom === symptom ? ' selected' : ''}`}
                  onClick={() => setPrimarySymptom(symptom)}
                >
                  <span>
                    {symptom}
                    <small>Specialty: {SYMPTOM_SPECIALTY_MAP[symptom] || 'General Practice'}</small>
                  </span>
                  {primarySymptom === symptom && <i className="bi bi-check-circle-fill" aria-hidden="true" />}
                </button>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-end pt-4 mt-4 border-top">
            <button className="btn btn-primary" type="button" onClick={() => setStep(2)}>
              Next: Duration &amp; Pain Scale <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Duration and pain */}
      {step === 2 && (
        <div>
          <p className="eyebrow mb-3">How long have you experienced these symptoms?</p>

          <div className="row g-2">
            {DURATIONS.map((duration) => (
              <div className="col-6 col-lg-3" key={duration}>
                <button
                  type="button"
                  className={`choice-tile justify-content-center text-center h-100${
                    symptomDuration === duration ? ' selected' : ''
                  }`}
                  onClick={() => setSymptomDuration(duration)}
                >
                  <span>{duration}</span>
                </button>
              </div>
            ))}
          </div>

          <div className="mini-card mt-4">
            <div className="d-flex align-items-center justify-content-between">
              <label className="form-label mb-0" htmlFor="painRange">
                Pain / discomfort intensity (1–10)
              </label>
              <span className={`badge ${painTone(painScore)}`}>{painScore} / 10</span>
            </div>
            <input
              className="form-range"
              id="painRange"
              type="range"
              min={1}
              max={10}
              value={painScore}
              onChange={(e) => setPainScore(parseInt(e.target.value, 10))}
            />
            <div className="d-flex justify-content-between text-muted small">
              <span>1 — Mild</span>
              <span>5 — Moderate</span>
              <span>10 — Unbearable</span>
            </div>
          </div>

          <div className="d-flex justify-content-between pt-4 mt-4 border-top">
            <button className="btn btn-light" type="button" onClick={() => setStep(1)}>
              <i className="bi bi-arrow-left" aria-hidden="true" /> Back
            </button>
            <button className="btn btn-primary" type="button" onClick={() => setStep(3)}>
              Next: Red-Flag Indicators <i className="bi bi-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Red flags */}
      {step === 3 && (
        <div>
          <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
            <i className="bi bi-shield-exclamation mt-1" aria-hidden="true" />
            <div>
              <strong className="d-block">Critical safety screening</strong>
              <span className="small">Select any high-risk indicator that currently applies to your condition.</span>
            </div>
          </div>

          <div className="d-grid gap-2">
            {CRITICAL_RED_FLAGS.map((flag) => {
              const checked = selectedRedFlags.includes(flag);
              return (
                <button
                  key={flag}
                  type="button"
                  className={`choice-tile${checked ? ' selected-danger' : ''}`}
                  onClick={() => handleRedFlagToggle(flag)}
                  aria-pressed={checked}
                >
                  <span className="d-inline-flex align-items-start gap-2">
                    <i className={checked ? 'bi bi-check-square-fill' : 'bi bi-square'} aria-hidden="true" />
                    <span>{flag}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="form-label" htmlFor="triageNotes">
              Additional details or medical history (optional)
            </label>
            <textarea
              className="form-control"
              id="triageNotes"
              rows={3}
              placeholder="Mention pre-existing conditions (e.g. hypertension, diabetes, asthma)…"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>

          {submitError && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mt-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
              <span className="small">{submitError}</span>
            </div>
          )}

          <div className="d-flex justify-content-between pt-4 mt-4 border-top">
            <button className="btn btn-light" type="button" onClick={() => setStep(2)}>
              <i className="bi bi-arrow-left" aria-hidden="true" /> Back
            </button>
            <button className="btn btn-primary" type="button" onClick={handleExecuteTriage} disabled={isSubmitting}>
              <i className={isSubmitting ? 'bi bi-arrow-repeat' : 'bi bi-cpu'} aria-hidden="true" />
              {isSubmitting ? 'Saving assessment…' : 'Evaluate Triage Rules'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Result */}
      {step === 4 && assessmentResult && (
        <div>
          <div
            className={`panel panel-accent mb-3 ${
              assessmentResult.urgency_level === 'EMERGENCY'
                ? 'accent-danger'
                : assessmentResult.urgency_level === 'URGENT'
                  ? 'accent-warning'
                  : assessmentResult.urgency_level === 'ROUTINE'
                    ? 'accent-success'
                    : ''
            }`}
          >
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="score-dial">
                {assessmentResult.severity_score}
                <small>/ 100</small>
              </div>
              <div className="flex-grow-1">
                <span className={`urgency-badge urgency-${assessmentResult.urgency_level.toLowerCase()}`}>
                  <i className={`bi ${URGENCY_ICON[assessmentResult.urgency_level]}`} aria-hidden="true" />
                  {assessmentResult.urgency_level.replace('_', ' ')} status
                </span>
                <p className="mb-0 mt-2">{assessmentResult.action_recommendation}</p>
              </div>
            </div>
          </div>

          <div className="panel-header">
            <div>
              <h3 className="h6 mb-1 section-title">
                <i className="bi bi-file-earmark-medical" aria-hidden="true" />
                <span>Assessment Summary</span>
              </h3>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="info-list">
                <div>
                  <span>Primary symptom</span>
                  <strong>{assessmentResult.primary_symptom}</strong>
                </div>
                <div>
                  <span>Reported duration</span>
                  <strong>{assessmentResult.symptom_duration}</strong>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="info-list">
                <div>
                  <span>Recommended specialty</span>
                  <strong>{assessmentResult.recommended_specialty}</strong>
                </div>
                <div>
                  <span>Pain scale intensity</span>
                  <strong>{assessmentResult.pain_score} / 10</strong>
                </div>
              </div>
            </div>
          </div>

          {assessmentResult.red_flag_present && (
            <div className="alert alert-danger mt-3" role="alert">
              <strong className="d-block mb-1">Red flags detected</strong>
              <ul className="mb-0 ps-3 small">
                {assessmentResult.red_flags.map((rf, i) => (
                  <li key={i}>{rf}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="d-flex flex-wrap justify-content-between gap-2 pt-4 mt-4 border-top">
            <button className="btn btn-light" type="button" onClick={() => setStep(1)}>
              <i className="bi bi-arrow-repeat" aria-hidden="true" /> Re-run Triage Rules
            </button>

            {assessmentResult.urgency_level === 'EMERGENCY' ? (
              <a className="btn btn-danger" href="tel:112">
                <i className="bi bi-telephone-fill" aria-hidden="true" /> Call Emergency Services (112)
              </a>
            ) : (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() =>
                  router.push(
                    `/booking?specialty=${encodeURIComponent(assessmentResult.recommended_specialty)}&triageId=${assessmentResult.id}`
                  )
                }
              >
                <i className="bi bi-calendar2-plus" aria-hidden="true" />
                Book {assessmentResult.recommended_specialty} Slot
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
