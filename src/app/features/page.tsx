'use client';

import React from 'react';
import Link from 'next/link';
import { Faq } from '@/components/public/faq';

const TIERS = [
  {
    tier: 'Emergency',
    tone: 'lp-tier-emergency',
    range: '80 – 100',
    meaning: 'A red-flag indicator, or a severe presentation of sudden onset.',
    action: 'Booking is withheld and the patient is directed to emergency services immediately.',
  },
  {
    tier: 'Urgent',
    tone: 'lp-tier-urgent',
    range: '60 – 79',
    meaning: 'Significant symptoms that should not wait for a routine slot.',
    action: 'Fast-tracked to the earliest available consultation, typically the same day.',
  },
  {
    tier: 'Semi-urgent',
    tone: 'lp-tier-semi',
    range: '35 – 59',
    meaning: 'Moderate symptoms warranting review, but not same-hour attention.',
    action: 'Offered a same-day or next-day appointment with the recommended specialty.',
  },
  {
    tier: 'Routine',
    tone: 'lp-tier-routine',
    range: '0 – 34',
    meaning: 'Mild or long-standing complaints, follow-ups and check-ups.',
    action: 'Booked into standard consulting hours at the patient’s convenience.',
  },
];

const SCORING = [
  { factor: 'Reported severity (1–10)', weight: 'up to 80 points', note: 'The patient’s own rating, weighted eight points per level.' },
  { factor: 'Acute onset (under 2 days)', weight: '+15 points', note: 'Sudden onset raises priority; a long-standing complaint adds 5 instead.' },
  { factor: 'Each red flag selected', weight: '+10 points', note: 'Non-critical warning signs accumulate on top of the base score.' },
  { factor: 'Critical red flag', weight: 'overrides to 95', note: 'Chest pain radiating to the arm or jaw, stroke signs and four others short-circuit everything above.' },
];

const CAPABILITIES = [
  {
    icon: 'bi-cpu',
    title: 'Deterministic triage engine',
    copy: 'Thresholds, priority weights and red-flag short-circuits held as data rather than code branches. The same input always produces the same verdict, and the reasoning is readable.',
  },
  {
    icon: 'bi-shield-exclamation',
    title: 'Red-flag safety screening',
    copy: 'Six critical indicators escalate straight to Emergency, replace the booking call-to-action with emergency contact details, and are covered by their own tests.',
  },
  {
    icon: 'bi-calendar2-week',
    title: 'Availability-bound scheduling',
    copy: 'Each clinician publishes weekday consulting hours and slot lengths. Bookable slots are generated from those hours, and the database itself refuses a second booking of the same slot.',
  },
  {
    icon: 'bi-camera-video',
    title: 'Secure video consultations',
    copy: 'Peer-to-peer telehealth rooms with live chat, screen sharing, and the patient’s intake record and a clinical notepad beside the call.',
  },
  {
    icon: 'bi-stars',
    title: 'Multi-model clinical AI',
    copy: 'Several models answer each request in parallel; the best-agreed answer is shown, tagged with which model produced it and how strongly the panel agreed.',
  },
  {
    icon: 'bi-journal-medical',
    title: 'Structured clinical record',
    copy: 'Consultations are signed off as a full SOAP note with ICD-10 suggestions, prescriptions and follow-up, then attached to the patient file.',
  },
  {
    icon: 'bi-credit-card',
    title: 'Checkout and reconciliation',
    copy: 'Mobile Money and card flows produce realistic transaction references and status transitions, logged against the appointment. The provider integration is simulated and documented as such.',
  },
  {
    icon: 'bi-file-earmark-text',
    title: 'Audit trail',
    copy: 'Registrations, assessments, bookings, payments, profile changes and administrative actions all append an audit row with actor, entity and timestamp.',
  },
  {
    icon: 'bi-people',
    title: 'Role-separated portals',
    copy: 'Patients, clinicians and administrators each see only their own surface, with licence verification gating a doctor’s ability to accept bookings.',
  },
];

const RELIABILITY = [
  {
    title: 'Transactional writes',
    copy: 'A booking writes the appointment, the clinician’s notification and the audit row inside a single transaction. A failure part-way leaves nothing behind.',
  },
  {
    title: 'Guaranteed unique slots',
    copy: 'Beyond the availability check, a unique database constraint reserves each slot. Concurrent attempts on one slot cannot both succeed.',
  },
  {
    title: 'Indexed query paths',
    copy: 'Slot generation, patient history, the notification tray and the audit view are each backed by an index rather than a full table scan.',
  },
  {
    title: 'Server-side validation',
    copy: 'Availability, dates and slot times are re-checked on the server. A stale tab or a direct API call cannot book something the picker would not offer.',
  },
];

const FAQS = [
  {
    question: 'What happens if I select a red-flag symptom?',
    answer:
      'The assessment stops immediately, returns Emergency at a score of 95, and replaces the booking button with emergency service contact details. No appointment can be made from that assessment.',
  },
  {
    question: 'Can I change my mind after booking?',
    answer:
      'Yes. Confirmed appointments can be rescheduled or cancelled from your portal at no additional charge. Rescheduling re-checks availability, so you can only move to a slot that is genuinely free.',
  },
  {
    question: 'How does the clinician see my information?',
    answer:
      'Your intake record — symptoms, duration, pain score and any red flags — is shown beside the video call along with notes from your previous consultations, so the appointment begins already informed.',
  },
  {
    question: 'Is the AI making clinical decisions?',
    answer:
      'No. AI drafts notes and offers decision support to the attending clinician, who reviews and edits everything before signing. Each answer carries the models that produced it and their agreement score, and when the models are unreachable the system says so rather than substituting a template.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="lp">
      <header className="lp-pagehead">
        <div className="lp-pagehead-inner">
          <p className="lp-eyebrow">The platform</p>
          <h1 className="lp-display lp-display-sm">Everything the system does, and how</h1>
          <p>
            From the first symptom description to the signed clinical note — the mechanics behind each stage, stated
            plainly enough to be checked.
          </p>
        </div>
      </header>

      {/* ── Urgency tiers ────────────────────────────────────────────────── */}
      <section className="lp-section">
        <header className="lp-section-head">
          <p className="lp-eyebrow">Triage output</p>
          <h2 className="lp-heading">Four urgency tiers</h2>
          <p className="lp-section-lead">
            Every assessment resolves to exactly one tier, and the tier determines what the patient is offered next.
          </p>
        </header>

        <div className="lp-table-wrap">
          <table className="lp-table">
            <caption>
              Boundaries are fixed at 80, 60 and 35. A critical red flag overrides the calculation entirely.
            </caption>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Score</th>
                <th scope="col">What it means</th>
                <th scope="col">What happens</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((tier) => (
                <tr key={tier.tier}>
                  <td>
                    <span className={`lp-tier ${tier.tone}`}>{tier.tier}</span>
                  </td>
                  <td>{tier.range}</td>
                  <td>{tier.meaning}</td>
                  <td>{tier.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Scoring ──────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-tinted">
        <header className="lp-section-head">
          <p className="lp-eyebrow">How the score is built</p>
          <h2 className="lp-heading">Nothing hidden in the calculation</h2>
        </header>

        <div className="lp-table-wrap">
          <table className="lp-table">
            <caption>The total is capped at 100.</caption>
            <thead>
              <tr>
                <th scope="col">Factor</th>
                <th scope="col">Contribution</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {SCORING.map((row) => (
                <tr key={row.factor}>
                  <td>{row.factor}</td>
                  <td>{row.weight}</td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Capabilities ─────────────────────────────────────────────────── */}
      <section className="lp-section">
        <header className="lp-section-head">
          <p className="lp-eyebrow">Capabilities</p>
          <h2 className="lp-heading">Built for the whole episode of care</h2>
        </header>

        <div className="lp-capabilities">
          {CAPABILITIES.map((capability) => (
            <article className="lp-capability" key={capability.title}>
              <i className={`bi ${capability.icon}`} aria-hidden="true" />
              <h3>{capability.title}</h3>
              <p>{capability.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Reliability ──────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-tinted">
        <header className="lp-section-head">
          <p className="lp-eyebrow">Underneath</p>
          <h2 className="lp-heading">What keeps the data honest</h2>
          <p className="lp-section-lead">
            Scheduling is where a healthcare system either holds together or quietly corrupts itself. These are the
            guarantees behind it.
          </p>
        </header>

        <ol className="lp-journey">
          {RELIABILITY.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="lp-section">
        <header className="lp-section-head">
          <p className="lp-eyebrow">Common questions</p>
          <h2 className="lp-heading">Before you begin</h2>
        </header>
        <div className="lp-faq">
          <Faq items={FAQS} />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <p className="lp-eyebrow lp-eyebrow-inverse">Ready when you are</p>
          <h2 className="lp-display lp-display-sm">Run your first assessment</h2>
          <p>Three minutes, an urgency tier, a recommended specialty, and a consultation you can book immediately.</p>
          <div className="lp-actions lp-actions-center">
            <Link className="lp-btn lp-btn-light" href="/register">
              Create an account
            </Link>
            <Link className="lp-btn lp-btn-outline-light" href="/doctors">
              Browse our clinicians
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
