'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Appointment } from '@/lib/types';
import { PatientBrief } from '@/lib/telehealth-call';
import { AIProvenanceBadge, AIProvenance } from '@/components/ai/ai-provenance-badge';

const URGENCY_TONE: Record<string, string> = {
  EMERGENCY: 'text-bg-danger',
  URGENT: 'text-bg-warning text-dark',
  SEMI_URGENT: 'text-bg-info text-dark',
  ROUTINE: 'text-bg-success',
};

/** Where the in-call scratchpad survives a refresh or an accidental tab close. */
export const draftNotesKey = (appointmentId: string) => `pulsetriage:call-notes:${appointmentId}`;

export function readDraftNotes(appointmentId: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(draftNotesKey(appointmentId)) || '';
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient intake brief — everything the patient submitted before the call
// ─────────────────────────────────────────────────────────────────────────────
export const PatientBriefTab: React.FC<{ appointment: Appointment; brief: PatientBrief | null }> = ({
  appointment,
  brief,
}) => {
  if (!brief) {
    return (
      <div className="p-3 small text-muted d-flex align-items-center gap-2">
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
        Loading the patient&apos;s intake record…
      </div>
    );
  }

  const triage = brief.triage;

  return (
    <div className="p-3 small d-flex flex-column gap-2 overflow-y-auto flex-grow-1">
      <div className="p-2 bg-secondary bg-opacity-25 rounded-3">
        <strong className="text-light d-block mb-1">
          <i className="bi bi-person-vcard me-1" /> {brief.patient_name}
        </strong>
        {brief.patient_phone && (
          <p className="mb-1 text-muted">
            <i className="bi bi-telephone me-1" />
            <a className="link-info text-decoration-none" href={`tel:${brief.patient_phone}`}>
              {brief.patient_phone}
            </a>
          </p>
        )}
        {brief.patient_email && (
          <p className="mb-1 text-muted text-break">
            <i className="bi bi-envelope me-1" />
            {brief.patient_email}
          </p>
        )}
        <p className="mb-0 text-muted">
          <i className="bi bi-calendar-event me-1" />
          {brief.appointment_date} · {brief.start_time}–{brief.end_time}
        </p>
      </div>

      <div className="p-2 bg-secondary bg-opacity-25 rounded-3">
        <strong className="text-light d-block mb-1">Reason for this visit</strong>
        <p className="mb-0 text-muted">{brief.reason || appointment.reason || 'General telehealth consultation.'}</p>
      </div>

      {triage ? (
        <>
          <div className="p-2 bg-secondary bg-opacity-25 rounded-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1 mb-2">
              <strong className="text-light">Triage assessment</strong>
              <span className={`badge ${URGENCY_TONE[triage.urgency_level] || 'text-bg-secondary'}`}>
                {triage.urgency_level.replace('_', '-')}
              </span>
            </div>

            <div className="d-flex flex-wrap gap-1 mb-2">
              <span className="badge text-bg-dark">Severity {triage.severity_score}/100</span>
              <span className="badge text-bg-dark">Pain {triage.pain_score}/10</span>
              <span className="badge text-bg-dark">{triage.symptom_duration}</span>
            </div>

            <p className="mb-1 text-muted">
              <span className="text-light">Primary symptom:</span> {triage.primary_symptom}
            </p>
            <p className="mb-1 text-muted">
              <span className="text-light">Suggested specialty:</span> {triage.recommended_specialty}
            </p>
            <p className="mb-0 text-muted">{triage.triage_summary}</p>
          </div>

          {triage.red_flags.length > 0 && (
            <div className="p-2 rounded-3 border border-danger bg-danger bg-opacity-10">
              <strong className="text-danger d-block mb-1">
                <i className="bi bi-exclamation-octagon-fill me-1" /> Red flags reported
              </strong>
              <ul className="mb-0 ps-3 text-light">
                {triage.red_flags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-2 bg-secondary bg-opacity-25 rounded-3">
            <strong className="text-light d-block mb-1">System recommendation at intake</strong>
            <p className="mb-0 text-muted">{triage.action_recommendation}</p>
          </div>
        </>
      ) : (
        <div className="p-2 bg-secondary bg-opacity-25 rounded-3 text-muted">
          This appointment was booked without a triage assessment.
        </div>
      )}

      {brief.history.length > 0 && (
        <div className="p-2 bg-secondary bg-opacity-25 rounded-3">
          <strong className="text-light d-block mb-2">
            <i className="bi bi-clock-history me-1" /> Previous consultations
          </strong>
          {brief.history.map((visit) => (
            <details key={visit.id} className="mb-2">
              <summary className="text-info" style={{ cursor: 'pointer' }}>
                {visit.appointment_date}
                {visit.doctor_name ? ` · Dr. ${visit.doctor_name}` : ''}
              </summary>
              <pre
                className="small text-muted mt-1 mb-0"
                style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', maxHeight: '160px', overflowY: 'auto' }}
              >
                {visit.notes}
              </pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Live clinical notes — a scratchpad that carries into the wrap-up form
// ─────────────────────────────────────────────────────────────────────────────
export const ClinicalNotesTab: React.FC<{
  appointmentId: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ appointmentId, value, onChange }) => {
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Debounced autosave: a dropped call must not cost the doctor their notes.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(draftNotesKey(appointmentId), value);
        setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch {
        /* private browsing — the notes still reach the wrap-up form in memory */
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [value, appointmentId]);

  const append = (snippet: string) => onChange(value ? `${value.replace(/\s*$/, '')}\n${snippet}` : snippet);

  return (
    <div className="d-flex flex-column flex-grow-1 min-h-0 p-3 gap-2">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
        <strong className="small text-light">
          <i className="bi bi-pencil-square me-1" /> Notes during the consultation
        </strong>
        <span className="small text-muted" style={{ fontSize: '11px' }}>
          {savedAt ? `Saved ${savedAt}` : 'Autosaves as you type'}
        </span>
      </div>

      <div className="d-flex flex-wrap gap-1">
        {['S:', 'O:', 'A:', 'P:', 'Rx:'].map((prefix) => (
          <button
            key={prefix}
            type="button"
            className="btn btn-sm btn-outline-light py-0 px-2"
            style={{ fontSize: '11px' }}
            onClick={() => append(`${prefix} `)}
          >
            {prefix}
          </button>
        ))}
      </div>

      <textarea
        className="form-control form-control-sm bg-black bg-opacity-50 text-white border-secondary flex-grow-1"
        style={{ minHeight: '160px', resize: 'none' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          'Observations, working diagnosis, treatment given…\n\nS: patient reports…\nO: on video, …\nA: …\nP: Tab … 500mg TDS x 5 days'
        }
        aria-label="Clinical notes during the consultation"
      />

      <p className="text-muted mb-0" style={{ fontSize: '11px' }}>
        These notes are carried into the wrap-up form when you end the call — nothing is written to the patient&apos;s
        record until you sign off there.
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// In-call AI assistant — the Ollama panel, available while the call is running
// ─────────────────────────────────────────────────────────────────────────────
interface AiTurn {
  role: 'user' | 'assistant';
  content: string;
  provenance?: AIProvenance;
  failed?: boolean;
}

export const InCallAiTab: React.FC<{
  appointment: Appointment;
  brief: PatientBrief | null;
  notes: string;
  chatTranscript: string;
  onInsertIntoNotes: (text: string) => void;
}> = ({ appointment, brief, notes, chatTranscript, onInsertIntoNotes }) => {
  const [turns, setTurns] = useState<AiTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [turns, busy]);

  /** Everything the models should know about this consultation. */
  const buildContext = useCallback(() => {
    const t = brief?.triage;
    return [
      `Patient: ${brief?.patient_name || appointment.patient_name || 'Patient'}`,
      `Specialty: ${appointment.doctor_specialty || 'General Practice'}`,
      `Reason for visit: ${brief?.reason || appointment.reason || 'Telehealth consultation'}`,
      t
        ? `Triage: ${t.urgency_level}, severity ${t.severity_score}/100, pain ${t.pain_score}/10, ` +
          `primary symptom "${t.primary_symptom}" for ${t.symptom_duration}. ` +
          `Red flags: ${t.red_flags.length ? t.red_flags.join(', ') : 'none reported'}.`
        : 'Triage: not completed.',
      chatTranscript ? `In-call chat:\n${chatTranscript}` : '',
      notes ? `Doctor's working notes:\n${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }, [appointment, brief, chatTranscript, notes]);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setTurns((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setBusy(true);

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context: buildContext() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTurns((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer, provenance: data.ai_provenance, failed: data.ai_provenance?.method === 'fallback' },
        ]);
      } else {
        setTurns((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'The AI service could not be reached.', failed: true },
        ]);
      }
    } catch (err) {
      setTurns((prev) => [
        ...prev,
        { role: 'assistant', content: `Could not reach the AI service: ${(err as Error).message}`, failed: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const quickPrompts = [
    { label: 'Differentials', prompt: 'Give the most likely differential diagnoses for this presentation, most likely first, with the discriminating feature for each.' },
    { label: 'Red flags', prompt: 'What red flags should I rule out before ending this consultation? Be specific to this presentation.' },
    { label: 'Draft plan', prompt: 'Draft a treatment plan with specific drug names, doses, routes, frequencies and durations, plus any labs or imaging to order.' },
    { label: 'Questions to ask', prompt: 'What history questions am I missing that would most change management here?' },
  ];

  return (
    <div className="d-flex flex-column flex-grow-1 min-h-0">
      <div className="flex-grow-1 overflow-y-auto p-3">
        {turns.length === 0 && (
          <div className="text-muted small">
            <p className="mb-2">
              <i className="bi bi-stars text-warning me-1" />
              Ask the AI panel about <strong className="text-light">{brief?.patient_name || appointment.patient_name}</strong>.
              The triage record, in-call chat and your working notes are sent as context automatically.
            </p>
            <p className="mb-0 fst-italic" style={{ fontSize: '11px' }}>
              Decision support only — every suggestion needs your clinical judgement before it reaches the patient.
            </p>
          </div>
        )}

        {turns.map((turn, i) => (
          <div
            key={i}
            className={`mb-2 p-2 rounded-3 ${
              turn.role === 'user'
                ? 'bg-primary text-white ms-4'
                : turn.failed
                  ? 'border border-warning bg-warning bg-opacity-10 text-light'
                  : 'bg-secondary bg-opacity-50 text-light'
            }`}
          >
            {turn.role === 'assistant' && (
              <div className="d-flex align-items-center justify-content-between gap-2 mb-1 flex-wrap">
                <span className="fw-bold opacity-75" style={{ fontSize: '11px' }}>
                  {turn.failed ? '⚠️ AI unavailable' : 'AI panel'}
                </span>
                <AIProvenanceBadge provenance={turn.provenance} />
              </div>
            )}
            <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {turn.content}
            </p>
            {turn.role === 'assistant' && !turn.failed && (
              <button
                type="button"
                className="btn btn-sm btn-outline-light py-0 px-2 mt-2"
                style={{ fontSize: '11px' }}
                onClick={() => onInsertIntoNotes(turn.content)}
              >
                <i className="bi bi-box-arrow-in-down me-1" />
                Insert into notes
              </button>
            )}
          </div>
        ))}

        {busy && (
          <div className="d-flex align-items-center gap-2 text-muted small py-1">
            <span className="spinner-border spinner-border-sm text-warning" role="status" aria-hidden="true" />
            <span className="fst-italic">Consulting the AI panel…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-top border-secondary p-2 flex-shrink-0">
        <div className="d-flex flex-wrap gap-1 mb-2">
          {quickPrompts.map((q) => (
            <button
              key={q.label}
              type="button"
              className="btn btn-sm btn-outline-warning py-0 px-2"
              style={{ fontSize: '11px' }}
              disabled={busy}
              onClick={() => ask(q.prompt)}
            >
              {q.label}
            </button>
          ))}
        </div>

        <form
          className="d-flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input
            type="text"
            className="form-control form-control-sm bg-secondary bg-opacity-25 text-white border-secondary"
            placeholder="Ask about this patient…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            aria-label="Ask the clinical AI"
          />
          <button type="submit" className="btn btn-warning btn-sm px-3" disabled={busy || !input.trim()} aria-label="Send to AI">
            <i className="bi bi-stars" />
          </button>
        </form>
      </div>
    </div>
  );
};
