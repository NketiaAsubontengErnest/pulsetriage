'use client';

import React from 'react';
import Link from 'next/link';

const PROCESS = [
  {
    phase: 'Requirements analysis',
    copy: 'Non-emergency outpatient workflows were mapped to identify where scheduling delay and mis-prioritisation actually originate.',
  },
  {
    phase: 'Software requirements specification',
    copy: 'Functional and non-functional requirements were documented to IEEE 830, covering the rule engine, booking, RBAC and notification subsystems.',
  },
  {
    phase: 'Effort estimation',
    copy: 'Use Case Points produced an adjusted 98.7 UCP — roughly 38 person-hours — which scoped the build to the examination window.',
  },
  {
    phase: 'System design',
    copy: 'A monolithic client-server architecture on the Next.js App Router with serverless route handlers and an ORM-managed relational schema.',
  },
  {
    phase: 'Implementation',
    copy: 'Twelve API route handlers, nine data models and three role-scoped portals, with every mutation writing an audit record.',
  },
  {
    phase: 'Testing & QA',
    copy: 'Automated unit tests over the triage algorithm, plus integration and user-acceptance passes across all three roles.',
  },
];

const PILLARS = [
  {
    icon: 'bi-cpu',
    title: 'Rule engine auto-triage',
    copy: 'Symptom category, pain scale, duration and red flags produce a 0–100 severity score and a specialty recommendation — deterministic and reproducible.',
  },
  {
    icon: 'bi-calendar2-check',
    title: 'Slot-locking booking',
    copy: 'Availability is divided into 30-minute consultation windows so urgent non-emergency cases reach a clinician first.',
  },
  {
    icon: 'bi-wrench-adjustable',
    title: 'Technical debt governance',
    copy: 'Payment and notification subsystems sit behind abstracted interfaces, each with a documented cause, impact and repayment plan.',
  },
];

const STACK = [
  { label: 'Framework', value: 'Next.js 15 · App Router', icon: 'bi-lightning-charge' },
  { label: 'Interface', value: 'React 19 · Bootstrap 5', icon: 'bi-window' },
  { label: 'Language', value: 'TypeScript 5', icon: 'bi-filetype-tsx' },
  { label: 'Data layer', value: 'Prisma ORM', icon: 'bi-database' },
  { label: 'Authentication', value: 'bcrypt password hashing', icon: 'bi-shield-lock' },
  { label: 'Testing', value: 'node:test runner', icon: 'bi-check2-square' },
];

export default function AboutPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="public-hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow mb-2">
              <i className="bi bi-heart-pulse me-1" aria-hidden="true" />
              About the platform
            </p>
            <h1 className="hero-title">
              Engineering <span className="accent">clinical priority</span> into outpatient scheduling
            </h1>
            <p className="hero-lead">
              PulseTriage began as a question: why does the order of a waiting room have so little to do with how
              sick anyone is? The answer became a capstone project in disciplined software engineering — from
              requirements analysis through to deployment and a documented maintenance strategy.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link className="btn btn-primary" href="/features">
                <i className="bi bi-activity" aria-hidden="true" /> Explore Capabilities
              </Link>
              <Link className="btn btn-outline-secondary" href="/doctors">
                <i className="bi bi-people" aria-hidden="true" /> Meet the Specialists
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="row g-3">
          <div className="col-12 col-xl-7">
            <div className="panel h-100">
              <h2 className="h5 section-title mb-3">
                <i className="bi bi-compass" aria-hidden="true" />
                <span>Our clinical mission</span>
              </h2>
              <p className="text-muted">
                In a traditional outpatient waiting room, a patient with acute cardiovascular pain or sudden
                respiratory distress is queued alongside someone collecting a medical certificate. Order is decided
                by arrival time. Clinicians meanwhile get no advance signal about who is waiting or why.
              </p>
              <p className="text-muted">
                PulseTriage inserts a deterministic assessment between the patient and the appointment book. Symptom
                inputs are evaluated against a clinical rule set that classifies each case as{' '}
                <strong>EMERGENCY</strong>, <strong>URGENT</strong>, <strong>SEMI_URGENT</strong> or{' '}
                <strong>ROUTINE</strong> in real time — and life-threatening presentations are redirected to
                emergency services before a booking is ever offered.
              </p>
              <p className="text-muted mb-0">
                The result is a queue ordered by clinical need, a clinician who arrives informed, and a record of why
                every decision was made.
              </p>
            </div>
          </div>

          <div className="col-12 col-xl-5">
            <div className="panel h-100">
              <h2 className="h5 section-title mb-3">
                <i className="bi bi-mortarboard" aria-hidden="true" />
                <span>Academic context</span>
              </h2>
              <div className="info-list">
                <div>
                  <span>Course</span>
                  <strong>CSCD 602 Advanced Software Engineering</strong>
                </div>
                <div>
                  <span>Institution</span>
                  <strong>University of Ghana, Legon</strong>
                </div>
                <div>
                  <span>Department</span>
                  <strong>Computer Science</strong>
                </div>
                <div>
                  <span>Examiner</span>
                  <strong>Prof. Solomon Mensah</strong>
                </div>
                <div>
                  <span>Estimated effort</span>
                  <strong>98.7 adjusted use case points</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillars ──────────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">Architecture</p>
          <h2 className="h3">Three pillars the platform stands on</h2>
          <p>Each subsystem is isolated behind its own interface so it can be replaced without disturbing the rest.</p>
        </div>

        <div className="row g-3">
          {PILLARS.map((pillar, index) => (
            <div className="col-12 col-lg-4" key={pillar.title}>
              <article className="feature-tile">
                <span className="page-icon">
                  <i className={`bi ${pillar.icon}`} aria-hidden="true" />
                </span>
                <p className="eyebrow mb-0 mt-3">Pillar {index + 1}</p>
                <h3>{pillar.title}</h3>
                <p>{pillar.copy}</p>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* ── Engineering process ──────────────────────────────────────────── */}
      <section className="public-section">
        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="section-head">
              <p className="eyebrow mb-1">Method</p>
              <h2 className="h3">How the system was built</h2>
              <p>
                The project follows a full software engineering lifecycle rather than jumping straight to code — the
                deliverable is the discipline as much as the application.
              </p>
            </div>
            <Link className="btn btn-outline-secondary btn-sm" href="/features">
              <i className="bi bi-diagram-3" aria-hidden="true" /> See the resulting features
            </Link>
          </div>

          <div className="col-12 col-lg-7">
            <div className="panel">
              <ul className="timeline">
                {PROCESS.map((entry) => (
                  <li key={entry.phase}>
                    <strong>{entry.phase}</strong>
                    <span>{entry.copy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stack ────────────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">Implementation</p>
          <h2 className="h3">The technology underneath</h2>
          <p>Modern, mainstream and boring on purpose — every choice is one a maintainer can pick up quickly.</p>
        </div>

        <div className="row g-3">
          {STACK.map((item) => (
            <div className="col-12 col-sm-6 col-lg-4" key={item.label}>
              <div className="contact-tile">
                <span className="section-title mb-1">
                  <i className={`bi ${item.icon}`} aria-hidden="true" />
                </span>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="cta-band public-section">
        <h2 className="h3">Ready to experience PulseTriage?</h2>
        <p>Register a patient account to run the triage wizard, or sign in to an existing clinical workspace.</p>
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
