'use client';

import React from 'react';
import Link from 'next/link';

const FEATURES = [
  {
    icon: 'bi-cpu',
    ref: 'FR-2.3',
    title: 'Symptom auto-triage rule engine',
    copy: 'Evaluates symptom inputs against a rules-as-data configuration, calculates a 0–100 severity score, screens red flags and classifies each case into one of four urgency tiers.',
  },
  {
    icon: 'bi-shield-exclamation',
    ref: 'FR-2.5',
    title: 'Red-flag safety screening',
    copy: 'Six critical indicators short-circuit the calculation to EMERGENCY at score 95 and replace the booking call-to-action with emergency service contact details.',
  },
  {
    icon: 'bi-calendar2-check',
    ref: 'FR-3.1 / FR-3.6',
    title: 'Atomic doctor slot booking',
    copy: 'Doctor availability is divided into 30-minute consultation windows, and clinicians can block or release individual slots around clinical commitments.',
  },
  {
    icon: 'bi-credit-card',
    ref: 'Technical Debt #1',
    title: 'Simulated payment gateway',
    copy: 'Mobile Money and card checkout producing realistic transaction references, behind an interface ready for a Paystack or Hubtel integration.',
  },
  {
    icon: 'bi-bell',
    ref: 'Technical Debt #2 · FR-6.3',
    title: 'Notification dispatch queue',
    copy: 'Triage results, booking confirmations, payment receipts and reminders queue through a stream administrators can inspect and retry.',
  },
  {
    icon: 'bi-file-earmark-text',
    ref: 'FR-4.5',
    title: 'Immutable audit trail',
    copy: 'Every registration, triage submission, booking, payment and administrative action appends an audit record with actor, entity and timestamp.',
  },
];

const BANDS = [
  {
    tier: 'EMERGENCY',
    range: '80 – 100',
    action: 'Redirect to emergency services — booking is withheld.',
    tone: 'urgency-emergency',
    width: '100%',
    bar: 'bg-danger',
  },
  {
    tier: 'URGENT',
    range: '60 – 79',
    action: 'Consultation within 24 hours.',
    tone: 'urgency-urgent',
    width: '75%',
    bar: 'bg-warning',
  },
  {
    tier: 'SEMI_URGENT',
    range: '35 – 59',
    action: 'Consultation within 48 hours.',
    tone: 'urgency-semi_urgent',
    width: '50%',
    bar: 'bg-warning',
  },
  {
    tier: 'ROUTINE',
    range: '0 – 34',
    action: 'Standard outpatient slot within 7 days.',
    tone: 'urgency-routine',
    width: '28%',
    bar: 'bg-success',
  },
];

const SCORING = [
  { factor: 'Reported severity (1–10)', weight: 'up to +80', icon: 'bi-sliders' },
  { factor: 'Acute onset within 2 days', weight: '+15', icon: 'bi-lightning' },
  { factor: 'Long-standing complaint (14 days+)', weight: '+5', icon: 'bi-clock-history' },
  { factor: 'Each red-flag indicator', weight: '+10', icon: 'bi-flag' },
];

const ROLE_MATRIX = [
  {
    role: 'Patient',
    icon: 'bi-person-heart',
    items: [
      'Symptom auto-triage wizard',
      'Verified specialist directory',
      'Slot booking and simulated checkout',
      'Appointment history, reschedule and cancel',
    ],
  },
  {
    role: 'Doctor',
    icon: 'bi-clipboard2-pulse',
    items: [
      'Urgency-sorted consultation queue',
      'Triage summary ahead of each consult',
      'Clinical notes and completion sign-off',
      'Schedule slot manager',
    ],
  },
  {
    role: 'Administrator',
    icon: 'bi-shield-check',
    items: [
      'Doctor verification and licensing',
      'Patient EHR and triage overview',
      'Dynamic rule configurator and simulator',
      'System audit and dispatch logs',
    ],
  },
];

const DEBT = [
  {
    title: 'Simulated payment gateway',
    priority: 'HIGH',
    tone: 'text-bg-danger',
    cause: 'Merchant account activation and public webhook listeners were out of reach inside the examination window.',
    payback: 'Paystack REST API v2 and Hubtel checkout with HMAC SHA-256 webhook verification.',
  },
  {
    title: 'Simplified notification queue',
    priority: 'MEDIUM',
    tone: 'text-bg-warning',
    cause: 'Avoided introducing an external Redis broker and a paid SMS gateway dependency.',
    payback: 'A Redis-backed BullMQ job queue with dedicated SMS and email workers.',
  },
  {
    title: 'Client-side rule execution',
    priority: 'LOW',
    tone: 'text-bg-secondary',
    cause: 'Prioritised instant feedback while the patient fills in the symptom questionnaire.',
    payback: 'Extract the engine into a service backed by database-stored decision tables.',
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="public-hero">
        <div className="hero-grid hero-split">
          <div>
            <p className="eyebrow mb-2">
              <i className="bi bi-activity me-1" aria-hidden="true" />
              Core capabilities
            </p>
            <h1 className="hero-title">
              A triage engine you can <span className="accent">read line by line</span>
            </h1>
            <p className="hero-lead">
              Nothing here is a black box. Every score is arithmetic you can follow, every rule is data you can edit,
              and every shortcut taken under deadline is written down with a repayment plan.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link className="btn btn-primary" href="/register">
                <i className="bi bi-play-circle" aria-hidden="true" /> Try the Triage Wizard
              </Link>
              <Link className="btn btn-outline-secondary" href="/about">
                <i className="bi bi-info-circle" aria-hidden="true" /> How It Was Built
              </Link>
            </div>
          </div>

          {/* Scoring model preview */}
          <div className="hero-preview" aria-hidden="true">
            <div className="hero-preview-head">
              <span className="d-inline-flex align-items-center gap-2 fw-bold">
                <i className="bi bi-calculator text-primary" />
                Scoring model
              </span>
              <span className="badge text-bg-secondary">0 – 100</span>
            </div>

            {SCORING.map((row) => (
              <div className="hero-preview-row" key={row.factor}>
                <span className="d-inline-flex align-items-center gap-2">
                  <i className={`bi ${row.icon}`} />
                  {row.factor}
                </span>
                <strong>{row.weight}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capability grid ──────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">What it does</p>
          <h2 className="h3">Six subsystems, mapped to requirements</h2>
          <p>Each capability traces back to a numbered requirement in the specification.</p>
        </div>

        <div className="row g-3">
          {FEATURES.map((feature) => (
            <div className="col-12 col-md-6 col-xl-4" key={feature.title}>
              <article className="feature-tile">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <span className="page-icon">
                    <i className={`bi ${feature.icon}`} aria-hidden="true" />
                  </span>
                  <span className="badge text-bg-secondary">{feature.ref}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* ── Urgency bands ────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">The classification</p>
          <h2 className="h3">Four tiers, three thresholds</h2>
          <p>Where a case lands decides how quickly it is seen — and whether it should be booked at all.</p>
        </div>

        <div className="panel">
          {BANDS.map((band) => (
            <div className="row g-3 align-items-center py-3 border-bottom" key={band.tier}>
              <div className="col-12 col-md-3">
                <span className={`urgency-badge ${band.tone}`}>{band.tier.replace('_', ' ')}</span>
              </div>
              <div className="col-6 col-md-2">
                <strong>{band.range}</strong>
                <p className="text-muted small mb-0">severity score</p>
              </div>
              <div className="col-6 col-md-3">
                <div className="progress" role="presentation">
                  <div className={`progress-bar ${band.bar}`} style={{ width: band.width }} />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <p className="text-muted small mb-0">{band.action}</p>
              </div>
            </div>
          ))}
          <p className="text-muted small mb-0 mt-3">
            <i className="bi bi-info-circle me-1" aria-hidden="true" />
            Any red-flag indicator overrides the arithmetic entirely and returns EMERGENCY at score 95.
          </p>
        </div>
      </section>

      {/* ── Role matrix ──────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">Access control</p>
          <h2 className="h3">Role-based operations matrix</h2>
          <p>What each workspace can do once signed in.</p>
        </div>

        <div className="row g-3">
          {ROLE_MATRIX.map((entry) => (
            <div className="col-12 col-lg-4" key={entry.role}>
              <article className="panel h-100">
                <h3 className="h6 section-title mb-3">
                  <i className={`bi ${entry.icon}`} aria-hidden="true" />
                  <span>{entry.role}</span>
                </h3>
                <ul className="compare-list">
                  {entry.items.map((item) => (
                    <li key={item}>
                      <i className="bi bi-check2-circle text-success" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* ── Technical debt ───────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">Honest accounting</p>
          <h2 className="h3">Technical debt, declared up front</h2>
          <p>Three shortcuts were taken deliberately. Each is documented with its cause and its repayment plan.</p>
        </div>

        <div className="row g-3">
          {DEBT.map((item, index) => (
            <div className="col-12 col-lg-4" key={item.title}>
              <article className="panel h-100">
                <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                  <span className="eyebrow mb-0">Debt #{index + 1}</span>
                  <span className={`badge ${item.tone}`}>{item.priority}</span>
                </div>
                <h3 className="h6 mb-3">{item.title}</h3>
                <div className="info-list">
                  <div>
                    <span>Cause</span>
                    <strong className="text-end">{item.cause}</strong>
                  </div>
                  <div>
                    <span>Payback</span>
                    <strong className="text-end">{item.payback}</strong>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="cta-band public-section">
        <h2 className="h3">See the engine run</h2>
        <p>Register a patient account and put your own symptoms through the wizard — it takes about three minutes.</p>
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <Link className="btn btn-light" href="/register">
            <i className="bi bi-person-plus" aria-hidden="true" /> Register as a Patient
          </Link>
          <Link className="btn btn-outline-light" href="/doctors">
            <i className="bi bi-people" aria-hidden="true" /> Browse Specialists
          </Link>
        </div>
      </section>
    </>
  );
}
