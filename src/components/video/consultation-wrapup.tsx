'use client';

import React, { useState } from 'react';
import { Appointment } from '@/lib/types';
import { updateAppointment } from '@/lib/api';
import { composeConsultationNotes } from '@/lib/consultation-notes';

interface ConsultationWrapUpProps {
  appointment: Appointment;
  /** In-call chat log, used to pre-fill the consultation summary. */
  transcript?: string;
  doctorName?: string;
  onSubmitted: (notes: string) => void;
  onExitWithoutCompleting: () => void;
}

/**
 * Post-call clinical documentation. The doctor stays here after hanging up,
 * writes (or AI-generates) the full record, and only then marks the
 * appointment COMPLETED — which is what the patient portal reflects.
 */
export function ConsultationWrapUp({
  appointment,
  transcript = '',
  doctorName,
  onSubmitted,
  onExitWithoutCompleting,
}: ConsultationWrapUpProps) {
  const [summary, setSummary] = useState(transcript || appointment.reason || '');
  const [subjective, setSubjective] = useState(appointment.reason || '');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [icd10, setIcd10] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleGenerateSoap = async () => {
    setIsGenerating(true);
    setAiMessage(null);
    const fullTranscript = `Patient: ${appointment.patient_name || 'Patient'}
Presenting complaint: ${appointment.reason || 'Telehealth consultation'}
Consultation summary / transcript:
${summary}
Doctor observations: ${objective || 'Observed over telehealth video consultation.'}
Working impression: ${assessment || 'To be determined.'}`;

    try {
      const res = await fetch('/api/ai/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullTranscript, patientName: appointment.patient_name }),
      });
      const data = await res.json();
      if (data.success && data.soapNote) {
        const note = data.soapNote;
        if (note.subjective) setSubjective(note.subjective);
        if (note.objective) setObjective(note.objective);
        if (note.assessment) setAssessment(note.assessment);
        if (note.plan) setPlan(note.plan);
        if (Array.isArray(note.icd10_suggestions)) setIcd10(note.icd10_suggestions);
        setAiMessage('✨ AI SOAP note drafted from the consultation. Review and edit before submitting.');
      } else {
        setAiMessage('⚠️ AI unavailable — please complete the note manually.');
      }
    } catch (err) {
      console.warn('[wrap-up] AI SOAP generation failed', err);
      setAiMessage('⚠️ AI unavailable — please complete the note manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setSaveError(null);
    const notes = composeConsultationNotes({
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      specialty: appointment.doctor_specialty,
      doctor_name: doctorName || appointment.doctor_name,
      patient_name: appointment.patient_name,
      summary,
      subjective,
      objective,
      assessment,
      icd10,
      plan,
      follow_up: followUp,
      additional_notes: additionalNotes,
    });
    try {
      await updateAppointment(appointment.id, {
        status: 'COMPLETED',
        notes,
        updated_by: doctorName || appointment.doctor_name || 'Attending Physician',
      });
      onSubmitted(notes);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to submit the consultation record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-100 h-100 overflow-y-auto bg-light text-dark">
      <div className="container py-4" style={{ maxWidth: '960px' }}>
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-primary text-white p-3 border-0 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-journal-medical fs-4 text-warning" />
              <div>
                <h2 className="h6 text-white mb-0 fw-bold">Consultation Wrap-Up &amp; Clinical Notes</h2>
                <small className="text-white-50" style={{ fontSize: '11px' }}>
                  Video call ended · Patient: <strong>{appointment.patient_name}</strong> · {appointment.appointment_date} at{' '}
                  {appointment.start_time}
                </small>
              </div>
            </div>
            <span className="badge text-bg-warning text-dark">Awaiting sign-off</span>
          </div>

          <div className="card-body p-4">
            <div className="alert alert-info d-flex align-items-start gap-2 py-2 px-3 small" role="status">
              <i className="bi bi-info-circle-fill mt-1" />
              <span>
                Take as long as you need. The patient sees this appointment as <strong>COMPLETED</strong> only once you
                submit below.
              </span>
            </div>

            {aiMessage && (
              <div className="alert alert-secondary d-flex align-items-center justify-content-between py-2 px-3 small" role="status">
                <span>{aiMessage}</span>
                <button type="button" className="btn-close btn-sm" onClick={() => setAiMessage(null)} aria-label="Close" />
              </div>
            )}

            {saveError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small" role="alert">
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="d-flex justify-content-end mb-3">
              <button
                type="button"
                className="btn btn-warning btn-sm fw-bold text-dark d-flex align-items-center gap-1.5"
                onClick={handleGenerateSoap}
                disabled={isGenerating}
              >
                <i className={`bi ${isGenerating ? 'bi-arrow-repeat spin' : 'bi-stars'}`} />
                <span>{isGenerating ? 'AI drafting SOAP note…' : '✨ Draft SOAP note with AI'}</span>
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold mb-1" htmlFor="wrapup-summary">
                Consultation summary / transcript
              </label>
              <textarea
                id="wrapup-summary"
                rows={4}
                className="form-control form-control-sm"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What was discussed during the video consultation…"
              />
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold mb-1" htmlFor="wrapup-subjective">
                  S — Subjective (history &amp; symptoms)
                </label>
                <textarea
                  id="wrapup-subjective"
                  rows={4}
                  className="form-control form-control-sm"
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold mb-1" htmlFor="wrapup-objective">
                  O — Objective (observations &amp; vitals)
                </label>
                <textarea
                  id="wrapup-objective"
                  rows={4}
                  className="form-control form-control-sm"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="BP, temperature, visible findings over video…"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold mb-1" htmlFor="wrapup-assessment">
                  A — Assessment &amp; diagnosis
                </label>
                <textarea
                  id="wrapup-assessment"
                  rows={4}
                  className="form-control form-control-sm"
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                />
                {icd10.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {icd10.map((code) => (
                      <span key={code} className="badge text-bg-light border text-dark" style={{ fontSize: '10px' }}>
                        <i className="bi bi-tag-fill text-primary me-1" />
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold mb-1" htmlFor="wrapup-plan">
                  P — Plan, prescriptions &amp; lab orders
                </label>
                <textarea
                  id="wrapup-plan"
                  rows={4}
                  className="form-control form-control-sm font-mono"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="1. Medication, dose, frequency, duration&#10;2. Lab / imaging orders"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold mb-1" htmlFor="wrapup-followup">
                  Follow-up instructions for the patient
                </label>
                <textarea
                  id="wrapup-followup"
                  rows={3}
                  className="form-control form-control-sm"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="Review in 7 days, return sooner if symptoms worsen…"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold mb-1" htmlFor="wrapup-additional">
                  Additional notes
                </label>
                <textarea
                  id="wrapup-additional"
                  rows={3}
                  className="form-control form-control-sm"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Anything else worth recording after the call…"
                />
              </div>
            </div>
          </div>

          <div className="card-footer bg-white p-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border-top">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onExitWithoutCompleting} disabled={isSaving}>
              Exit without completing
            </button>
            <button
              type="button"
              className="btn btn-success fw-bold d-flex align-items-center gap-2"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              <i className={`bi ${isSaving ? 'bi-arrow-repeat spin' : 'bi-check2-circle'}`} />
              <span>{isSaving ? 'Submitting…' : 'Done — Submit Notes & Mark Consultation Completed'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
