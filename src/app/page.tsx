'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Faq } from '@/components/public/faq';

interface PublicStats {
  verified_doctors: number;
  specialties: number;
  consultations_completed: number;
  assessments_run: number;
}

const PRINCIPLES = [
  {
    numeral: 'I',
    title: 'Clinical urgency decides the order',
    copy: 'A deterministic rule engine scores every symptom set from 0 to 100 and sorts the queue by how sick the patient is — not by who called first.',
  },
  {
    numeral: 'II',
    title: 'Emergencies never wait for a slot',
    copy: 'Six critical indicators short-circuit the assessment to EMERGENCY, withhold the booking button, and direct the patient to emergency services.',
  },
  {
    numeral: 'III',
    title: 'The clinician reads the case first',
    copy: 'Symptoms, duration, pain score and red flags reach the doctor before the consultation opens, so the appointment starts already informed.',
  },
  {
    numeral: 'IV',
    title: 'Every decision leaves a record',
    copy: 'Registrations, assessments, bookings and payments append to a tamper-evident trail, so any prioritisation can be explained after the fact.',
  },
];

const JOURNEY = [
  {
    step: '01',
    title: 'Describe your symptoms',
    copy: 'A guided intake captures the symptom category, a 1–10 severity rating, how long it has lasted and any warning signs.',
  },
  {
    step: '02',
    title: 'Receive an urgency tier',
    copy: 'The engine returns a severity score, one of four urgency tiers and the specialty best suited to the presentation.',
  },
  {
    step: '03',
    title: 'Book the right specialist',
    copy: 'Choose from the consulting hours each doctor actually publishes. Slots already taken cannot be selected.',
  },
  {
    step: '04',
    title: 'Consult and receive notes',
    copy: 'Meet by secure video, then receive the signed clinical record — history, assessment, prescriptions and follow-up.',
  },
];

const CAPABILITIES = [
  {
    icon: 'bi-clipboard2-pulse',
    title: 'Symptom triage engine',
    copy: 'Transparent thresholds, priority weights and red-flag short-circuits. Explainable by design — never a black box.',
  },
  {
    icon: 'bi-camera-video',
    title: 'Secure video consultations',
    copy: 'Peer-to-peer telehealth rooms with live chat, screen sharing and the patient record beside the call.',
  },
  {
    icon: 'bi-calendar2-week',
    title: 'Real availability',
    copy: 'Each clinician publishes their consulting hours; bookable slots are generated from them and checked again on the server.',
  },
  {
    icon: 'bi-stars',
    title: 'Clinical decision support',
    copy: 'A panel of AI models drafts SOAP notes, reads lab reports and answers clinical questions — always attributed and reviewable.',
  },
  {
    icon: 'bi-shield-lock',
    title: 'Governed access',
    copy: 'Separate patient, clinician and administrative portals, with licence verification before a doctor can accept bookings.',
  },
  {
    icon: 'bi-journal-text',
    title: 'Complete medical record',
    copy: 'Assessments, consultations and signed notes stay attached to the patient file and travel with them to the next visit.',
  },
];

const AUDIENCES = [
  {
    icon: 'bi-person-heart',
    role: 'For patients',
    copy: 'Understand how urgent your symptoms are, find the right specialist, and manage your own appointments.',
    points: ['Guided symptom assessment', 'Verified specialist directory', 'Reschedule or cancel any time'],
    href: '/register',
    cta: 'Create an account',
  },
  {
    icon: 'bi-hospital',
    role: 'For clinicians',
    copy: 'Open a queue that is already ordered by clinical priority, with the intake record waiting beside the call.',
    points: ['Urgency-sorted patient queue', 'Intake record during consultation', 'Publish your consulting hours'],
    href: '/login',
    cta: 'Clinician sign in',
  },
  {
    icon: 'bi-diagram-3',
    role: 'For administrators',
    copy: 'Govern the clinician registry, tune the triage rules, and review everything the system has done.',
    points: ['Licence verification', 'Rule configuration and testing', 'Full activity and audit trail'],
    href: '/login',
    cta: 'Administrator sign in',
  },
];

const FAQS = [
  {
    question: 'Is PulseTriage a replacement for emergency care?',
    answer:
      'No. Triage here is a prioritisation aid for non-emergency outpatient scheduling. When red-flag indicators are selected, the assessment short-circuits to EMERGENCY and directs the patient to call emergency services rather than book a slot.',
  },
  {
    question: 'How is the severity score calculated?',
    answer:
      'Reported severity contributes up to 80 points, acute onset within two days adds 15, a longer-standing complaint adds 5, and each red flag adds 10 — capped at 100. Scores of 80, 60 and 35 are the boundaries between the four urgency tiers.',
  },
  {
    question: 'Can two patients book the same slot?',
    answer:
      'No. Bookable slots are generated from the consulting hours each clinician publishes, and the server re-checks availability inside a transaction before an appointment is written. A slot taken in the meantime is refused.',
  },
  {
    question: 'Are the payments real?',
    answer:
      'No. Checkout is a simulated gateway that produces realistic transaction references and status transitions without contacting a payment provider. A live provider integration is planned.',
  },
  {
    question: 'How is AI used, and can I rely on it?',
    answer:
      'AI assists clinicians with drafting notes and decision support. Every suggestion is labelled with the models that produced it and how strongly they agreed, and nothing reaches a patient record until the attending clinician reviews and signs it.',
  },
  {
    question: 'Who can see my assessment?',
    answer:
      'Your assessment is stored against your account and shown to the clinician you book with, so they can review your urgency profile before the consultation begins.',
  },
];

export default function Home() {
  // Headline figures come from the database. If the request fails the section
  // simply renders its descriptive labels without numbers rather than inventing
  // them.
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/stats', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && !data.error) setStats(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const figures = [
    { value: stats?.verified_doctors, label: 'Verified clinicians' },
    { value: stats?.specialties, label: 'Specialties covered' },
    { value: stats?.assessments_run, label: 'Assessments completed' },
    { value: stats?.consultations_completed, label: 'Consultations concluded' },
  ];

  return (
    <div className="lp">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <p className="lp-eyebrow lp-rule-above">Telehealth triage &amp; appointment system</p>

          <h1 className="lp-display">
            The most urgent patient
            <br />
            should be seen first.
          </h1>

          <p className="lp-lead">
            PulseTriage assesses every patient&apos;s symptoms against a transparent clinical rule engine, routes genuine
            emergencies to emergency care, and books everyone else with the right specialist at a time that clinician
            genuinely has free.
          </p>

          <div className="lp-actions">
            <Link className="lp-btn lp-btn-primary" href="/register">
              Create a patient account
            </Link>
            <Link className="lp-btn lp-btn-ghost" href="/features">
              Explore the platform
            </Link>
          </div>

          <p className="lp-hero-note">
            <i className="bi bi-shield-check" aria-hidden="true" /> Not for medical emergencies — if symptoms are severe,
            call your local emergency number immediately.
          </p>
        </div>
      </section>

      {/* ── Figures ──────────────────────────────────────────────────────── */}
      <section className="lp-figures" aria-label="Platform figures">
        {figures.map((figure) => (
          <div className="lp-figure" key={figure.label}>
            <strong>{figure.value === undefined ? '—' : figure.value.toLocaleString()}</strong>
            <span>{figure.label}</span>
          </div>
        ))}
      </section>

      {/* ── Principles ───────────────────────────────────────────────────── */}
      <section className="lp-section">
        <header className="lp-section-head">
          <p className="lp-eyebrow">Our principles</p>
          <h2 className="lp-heading">Four commitments that shape every decision</h2>
          <p className="lp-section-lead">
            In a first-come, first-served waiting room, the sickest patient is whoever happened to arrive early. These
            are the rules we replaced that with.
          </p>
        </header>

        <div className="lp-principles">
          {PRINCIPLES.map((principle) => (
            <article className="lp-principle" key={principle.numeral}>
              <span className="lp-numeral" aria-hidden="true">
                {principle.numeral}
              </span>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Journey ──────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-tinted">
        <header className="lp-section-head">
          <p className="lp-eyebrow">How it works</p>
          <h2 className="lp-heading">From first symptom to signed clinical note</h2>
        </header>

        <ol className="lp-journey">
          {JOURNEY.map((stage) => (
            <li key={stage.step}>
              <span className="lp-step" aria-hidden="true">
                {stage.step}
              </span>
              <h3>{stage.title}</h3>
              <p>{stage.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Capabilities ─────────────────────────────────────────────────── */}
      <section className="lp-section">
        <header className="lp-section-head">
          <p className="lp-eyebrow">Capabilities</p>
          <h2 className="lp-heading">Built for the whole episode of care</h2>
          <p className="lp-section-lead">
            Assessment, scheduling, consultation and the record that follows — one system rather than four that do not
            speak to each other.
          </p>
        </header>

        <div className="lp-capabilities">
          {CAPABILITIES.map((capability) => (
            <article className="lp-card" key={capability.title}>
              <span className="lp-card-icon"><i className={`bi ${capability.icon}`} aria-hidden="true" /></span>
              <h3>{capability.title}</h3>
              <p>{capability.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Audiences ────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-tinted">
        <header className="lp-section-head">
          <p className="lp-eyebrow">Who it serves</p>
          <h2 className="lp-heading">Three portals, one clinical record</h2>
        </header>

        <div className="lp-audiences">
          {AUDIENCES.map((audience) => (
            <article className="lp-card lp-audience" key={audience.role}>
              <span className="lp-card-icon"><i className={`bi ${audience.icon}`} aria-hidden="true" /></span>
              <h3>{audience.role}</h3>
              <p>{audience.copy}</p>
              <ul>
                {audience.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Link className="lp-link" href={audience.href}>
                {audience.cta} <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="lp-section">
        <header className="lp-section-head">
          <p className="lp-eyebrow">Common questions</p>
          <h2 className="lp-heading">What patients and clinicians ask us</h2>
        </header>

        <div className="lp-faq">
          <Faq items={FAQS} />
        </div>
      </section>

      {/* ── Closing call to action ───────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <p className="lp-eyebrow lp-eyebrow-inverse">Get started</p>
          <h2 className="lp-display lp-display-sm">Begin with a symptom assessment</h2>
          <p>
            It takes about three minutes, and it ends with a clear urgency tier, a recommended specialty and a
            consultation you can book straight away.
          </p>
          <div className="lp-actions">
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
