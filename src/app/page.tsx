'use client';

import React from 'react';
import Link from 'next/link';
import { Faq } from '@/components/public/faq';

const STATS = [
  { value: '< 3 min', label: 'Symptom intake' },
  { value: '4', label: 'Urgency tiers' },
  { value: '30 min', label: 'Consultation slots' },
  { value: '0', label: 'Booking collisions' },
];

const PROBLEMS = [
  'Acute chest pain queued behind routine certificate requests.',
  'Doctors see the patient for the first time at the consultation.',
  'Phone-based scheduling loses slots to double bookings.',
  'No record of why a case was prioritised the way it was.',
];

const SOLUTIONS = [
  'A deterministic rule engine scores every symptom set 0–100.',
  'Red-flag screening redirects emergencies before booking opens.',
  'Triage summaries reach the doctor ahead of the appointment.',
  'Every triage, booking and payment writes an immutable audit row.',
];

const STEPS = [
  {
    title: 'Register',
    copy: 'Create a patient account with your name, email and phone in under a minute.',
  },
  {
    title: 'Describe symptoms',
    copy: 'A guided wizard captures your symptom category, 1–10 severity, duration and red flags.',
  },
  {
    title: 'Get triaged',
    copy: 'The engine returns a 0–100 severity score, an urgency tier and a recommended specialty.',
  },
  {
    title: 'Book & pay',
    copy: 'Pick a matching specialist, lock a 30-minute slot and complete simulated checkout.',
  },
];

const FEATURES = [
  {
    icon: 'bi-cpu',
    title: 'Deterministic rule engine',
    copy: 'Rules-as-data thresholds, priority weights and red-flag short-circuits — no black box, fully explainable.',
  },
  {
    icon: 'bi-shield-exclamation',
    title: 'Red-flag safety screening',
    copy: 'Six critical indicators immediately escalate to EMERGENCY and route the patient to emergency services.',
  },
  {
    icon: 'bi-calendar2-check',
    title: 'Specialist slot booking',
    copy: 'Doctor availability is divided into 30-minute consultation windows with status tracked end to end.',
  },
  {
    icon: 'bi-credit-card',
    title: 'Simulated checkout',
    copy: 'Mobile Money and card flows with transaction references, logged as an explicit technical-debt item.',
  },
  {
    icon: 'bi-bell',
    title: 'Notification dispatch',
    copy: 'Triage results, booking confirmations and reminders queue through an inspectable dispatch stream.',
  },
  {
    icon: 'bi-file-earmark-text',
    title: 'Immutable audit trail',
    copy: 'Registrations, triage submissions, bookings and payments all append to a tamper-evident log.',
  },
];

const ROLES = [
  {
    icon: 'bi-person-heart',
    role: 'Patients',
    copy: 'Run triage, discover the right specialist and manage your own appointments.',
    points: ['Symptom auto-triage wizard', 'Verified specialist directory', 'Reschedule and cancel'],
  },
  {
    icon: 'bi-clipboard2-pulse',
    role: 'Doctors',
    copy: 'Work a queue that is already sorted by clinical urgency, not arrival time.',
    points: ['Severity-sorted patient queue', 'Triage summary before consult', 'Slot availability manager'],
  },
  {
    icon: 'bi-shield-check',
    role: 'Administrators',
    copy: 'Govern the registry, tune the engine and review everything the system did.',
    points: ['Doctor licence verification', 'Rule configurator & simulator', 'Audit and dispatch logs'],
  },
];

const FAQS = [
  {
    question: 'Is PulseTriage a replacement for emergency care?',
    answer:
      'No. Triage is a prioritisation aid for non-emergency outpatient scheduling. When red-flag indicators are selected the assessment short-circuits to EMERGENCY and directs the patient to call 112 rather than book a slot.',
  },
  {
    question: 'How is the severity score calculated?',
    answer:
      'Reported severity contributes up to 80 points, acute onset within two days adds 15, a longer-standing complaint adds 5, and each red flag adds 10 — capped at 100. Scores of 80, 60 and 35 are the boundaries between EMERGENCY, URGENT, SEMI_URGENT and ROUTINE.',
  },
  {
    question: 'Are the payments real?',
    answer:
      'No. Checkout is a simulated gateway that produces realistic transaction references and status transitions without contacting a payment provider. It is documented as Technical Debt #1, with a Paystack and Hubtel integration planned for v2.0.',
  },
  {
    question: 'Who can see my triage assessment?',
    answer:
      'Your assessment is stored against your patient account and surfaced to the clinician you book with, so they can review your urgency profile before the consultation begins.',
  },
];

export default function Home() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="public-hero">
        <div className="hero-grid hero-split">
          <div>
            <p className="eyebrow mb-2">
              <i className="bi bi-mortarboard me-1" aria-hidden="true" />
              CSCD 602 Advanced Software Engineering
            </p>

            <h1 className="hero-title">
              Urgent cases first.
              <br />
              <span className="accent">Not whoever called first.</span>
            </h1>

            <p className="hero-lead">
              PulseTriage scores every patient&apos;s symptoms against a clinical rule engine, redirects genuine
              emergencies, and books the remaining cases with the right specialist — replacing first-come,
              first-served outpatient queues with clinical priority.
            </p>

            <div className="d-flex flex-wrap gap-2">
              <Link className="btn btn-primary" href="/register">
                <i className="bi bi-person-plus" aria-hidden="true" /> Register as a Patient
              </Link>
              <Link className="btn btn-outline-secondary" href="/features">
                <i className="bi bi-compass" aria-hidden="true" /> See How It Works
              </Link>
            </div>

            <div className="hero-points">
              <span>
                <i className="bi bi-check-circle-fill" aria-hidden="true" /> Three role-based portals
              </span>
              <span>
                <i className="bi bi-check-circle-fill" aria-hidden="true" /> Red-flag screening
              </span>
              <span>
                <i className="bi bi-check-circle-fill" aria-hidden="true" /> Full audit trail
              </span>
            </div>
          </div>

          {/* Product preview — a triage result as the patient sees it. */}
          <div className="hero-preview" aria-hidden="true">
            <div className="hero-preview-head">
              <span className="d-inline-flex align-items-center gap-2 fw-bold">
                <i className="bi bi-activity text-primary" />
                Triage result
              </span>
              <span className="hero-preview-dots">
                <span />
                <span />
                <span />
              </span>
            </div>

            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="score-dial">
                95<small>/ 100</small>
              </div>
              <div>
                <span className="urgency-badge urgency-emergency">
                  <i className="bi bi-exclamation-octagon-fill" />
                  Emergency
                </span>
                <p className="text-muted small mb-0 mt-2">
                  Red flag detected — proceed immediately to the nearest emergency room.
                </p>
              </div>
            </div>

            <div className="hero-preview-row">
              <span>Primary symptom</span>
              <strong>Chest pain</strong>
            </div>
            <div className="hero-preview-row">
              <span>Onset</span>
              <strong>Sudden (&lt; 6 hours)</strong>
            </div>
            <div className="hero-preview-row">
              <span>Specialty</span>
              <strong>Emergency Cardiology</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat band ────────────────────────────────────────────────────── */}
      <section className="stat-band public-section" aria-label="Platform figures">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      {/* ── Problem / solution ───────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">The problem</p>
          <h2 className="h3">Outpatient queues ignore clinical urgency</h2>
          <p>
            In a first-come, first-served waiting room, the sickest patient is whoever happened to arrive early.
            PulseTriage changes what determines the order.
          </p>
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className="panel panel-accent accent-danger h-100">
              <h3 className="h6 section-title mb-3">
                <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                <span>Without triage</span>
              </h3>
              <ul className="compare-list">
                {PROBLEMS.map((item) => (
                  <li key={item}>
                    <i className="bi bi-x-circle-fill text-danger" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="panel panel-accent accent-success h-100">
              <h3 className="h6 section-title mb-3">
                <i className="bi bi-check2-circle" aria-hidden="true" />
                <span>With PulseTriage</span>
              </h3>
              <ul className="compare-list">
                {SOLUTIONS.map((item) => (
                  <li key={item}>
                    <i className="bi bi-check-circle-fill text-success" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">How it works</p>
          <h2 className="h3">From symptom to confirmed slot in four steps</h2>
          <p>The whole journey runs in the browser — no phone calls, no waiting room.</p>
        </div>

        <div className="step-flow">
          {STEPS.map((step, index) => (
            <article className="step-item" key={step.title}>
              <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Capabilities ─────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">Capabilities</p>
          <h2 className="h3">Everything the platform does</h2>
          <p>Six subsystems, each documented against the requirements specification.</p>
        </div>

        <div className="row g-3">
          {FEATURES.map((feature) => (
            <div className="col-12 col-md-6 col-xl-4" key={feature.title}>
              <article className="feature-tile">
                <span className="page-icon">
                  <i className={`bi ${feature.icon}`} aria-hidden="true" />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roles ────────────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">Built for three audiences</p>
          <h2 className="h3">One platform, three workspaces</h2>
          <p>Each role signs in to a portal scoped to what that role actually needs to do.</p>
        </div>

        <div className="row g-3">
          {ROLES.map((role) => (
            <div className="col-12 col-lg-4" key={role.role}>
              <article className="panel h-100">
                <span className="page-icon mb-3">
                  <i className={`bi ${role.icon}`} aria-hidden="true" />
                </span>
                <h3 className="h5 mb-2">{role.role}</h3>
                <p className="text-muted small">{role.copy}</p>
                <ul className="compare-list mt-3">
                  {role.points.map((point) => (
                    <li key={point}>
                      <i className="bi bi-check2 text-success" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="section-head">
              <p className="eyebrow mb-1">Questions</p>
              <h2 className="h3">Before you start</h2>
              <p>The things patients ask most often about how triage works.</p>
            </div>
            <Link className="btn btn-outline-secondary btn-sm" href="/contact">
              <i className="bi bi-chat-dots" aria-hidden="true" /> Ask something else
            </Link>
          </div>

          <div className="col-12 col-lg-8">
            <Faq items={FAQS} />
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="cta-band public-section">
        <h2 className="h3">Start your symptom assessment</h2>
        <p>
          Create a patient account and run your first triage in under three minutes. Doctors and administrators can
          sign in to their existing workspaces.
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <Link className="btn btn-light" href="/register">
            <i className="bi bi-person-plus" aria-hidden="true" /> Register as a Patient
          </Link>
          <Link className="btn btn-outline-light" href="/login">
            <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Sign In
          </Link>
        </div>
      </section>
    </>
  );
}
