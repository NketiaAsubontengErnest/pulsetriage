'use client';

import React from 'react';
import Link from 'next/link';

const OLD_WAY = [
  'A patient in respiratory distress waits behind someone collecting a medical certificate.',
  'The clinician meets the case for the first time when the consultation opens.',
  'Appointments are arranged by phone, where two people can be promised one slot.',
  'Nothing records why one patient was seen before another.',
];

const NEW_WAY = [
  'Every symptom set is scored 0–100 and the queue is ordered by clinical need.',
  'The intake record — symptoms, duration, pain, red flags — reaches the clinician first.',
  'Bookable times come from the hours each clinician publishes, and the database refuses a duplicate.',
  'Assessments, bookings and payments all append to a trail that can be reviewed later.',
];

const VALUES = [
  {
    numeral: 'I',
    title: 'Explainable, not clever',
    copy: 'The triage engine is rules-as-data with visible thresholds and weights. Anyone can read why a case scored what it did — a black box has no place in deciding who is seen first.',
  },
  {
    numeral: 'II',
    title: 'Safety before convenience',
    copy: 'Red-flag indicators short-circuit the assessment and withhold the booking button entirely. The system would rather send someone to an emergency department unnecessarily than schedule them a week out.',
  },
  {
    numeral: 'III',
    title: 'The clinician decides',
    copy: 'AI drafts notes and offers decision support, always labelled with the models behind it. Nothing reaches a patient record until the attending clinician has reviewed and signed it.',
  },
  {
    numeral: 'IV',
    title: 'Accountable by default',
    copy: 'Prioritisation affects care, so every decision the system makes leaves a record that can be inspected, questioned and audited after the fact.',
  },
];

const MILESTONES = [
  { period: 'The problem', copy: 'Outpatient departments order patients by arrival, not by need. Clinical urgency is invisible until someone is already in the room.' },
  { period: 'The approach', copy: 'Move the assessment before the booking. Score the symptoms, screen for danger signs, then let urgency decide the order.' },
  { period: 'The system', copy: 'A triage engine, a scheduling layer bound to real clinician availability, secure video consultations and a complete clinical record.' },
  { period: 'What is next', copy: 'A live payment provider, scheduled reminder delivery, and richer analytics on how well the triage tiers match clinical outcomes.' },
];

export default function AboutPage() {
  return (
    <div className="lp">
      <header className="lp-pagehead">
        <div className="lp-pagehead-inner">
          <p className="lp-eyebrow">About PulseTriage</p>
          <h1 className="lp-display lp-display-sm">
            Care should be ordered by
            <br />
            need, not by arrival time.
          </h1>
          <p>
            PulseTriage is a telehealth triage and appointment system built around one idea: the assessment should
            happen before the booking, so the sickest patient is seen first.
          </p>
        </div>
      </header>

      {/* ── Mission ──────────────────────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-quote">
          <blockquote>
            &ldquo;In a first-come, first-served waiting room, the sickest patient is whoever happened to arrive
            early. We thought that was worth fixing.&rdquo;
          </blockquote>
          <cite>The PulseTriage team</cite>
        </div>
      </section>

      {/* ── Problem / approach ───────────────────────────────────────────── */}
      <section className="lp-section lp-section-tinted">
        <header className="lp-section-head">
          <p className="lp-eyebrow">What we changed</p>
          <h2 className="lp-heading">From arrival order to clinical order</h2>
        </header>

        <div className="lp-contrast">
          <section>
            <h3>How outpatient queues usually work</h3>
            <ul className="lp-list lp-list-negative">
              {OLD_WAY.map((item) => (
                <li key={item}>
                  <i className="bi bi-x-lg" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>How PulseTriage works</h3>
            <ul className="lp-list lp-list-positive">
              {NEW_WAY.map((item) => (
                <li key={item}>
                  <i className="bi bi-check-lg" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────────── */}
      <section className="lp-section">
        <header className="lp-section-head">
          <p className="lp-eyebrow">What we hold to</p>
          <h2 className="lp-heading">Four principles behind the design</h2>
        </header>

        <div className="lp-principles">
          {VALUES.map((value) => (
            <article className="lp-principle" key={value.numeral}>
              <span className="lp-numeral" aria-hidden="true">
                {value.numeral}
              </span>
              <div>
                <h3>{value.title}</h3>
                <p>{value.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Story ────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-tinted">
        <header className="lp-section-head">
          <p className="lp-eyebrow">How it came together</p>
          <h2 className="lp-heading">The shape of the work</h2>
        </header>

        <ol className="lp-journey">
          {MILESTONES.map((milestone) => (
            <li key={milestone.period}>
              <span className="lp-step" aria-hidden="true">
                {milestone.period}
              </span>
              <p>{milestone.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Scope and honesty ────────────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-prose">
          <h3>What this system is — and what it is not</h3>
          <p>
            PulseTriage prioritises and schedules non-emergency outpatient care. It is a decision aid for ordering a
            queue, not a diagnostic device and not a substitute for emergency services. When the assessment detects a
            red-flag indicator it stops, withholds booking, and directs the patient to emergency care.
          </p>
          <p>
            The payment gateway is simulated. It produces realistic transaction references and status transitions
            without contacting a provider, and it is documented as such rather than dressed up as a live integration.
            Appointment reminders are written the moment a booking is confirmed rather than dispatched by a scheduler
            at the reminder time.
          </p>
          <p>
            Where AI is used — drafting clinical notes, reading lab reports, answering a clinician&apos;s question
            during a consultation — every answer is labelled with the models that produced it and how strongly they
            agreed. When the models cannot be reached, the system says so plainly instead of substituting a template
            that would read like a generated answer.
          </p>

          <h3>Built as an academic project</h3>
          <p>
            PulseTriage was developed for CSCD 602 Advanced Software Engineering at the University of Ghana. The
            engineering decisions — a deterministic rule engine over a model, transactional booking over optimistic
            writes, an audit trail over silent updates — were made to be defensible, not merely to work.
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <p className="lp-eyebrow lp-eyebrow-inverse">See it for yourself</p>
          <h2 className="lp-display lp-display-sm">Start with a symptom assessment</h2>
          <p>About three minutes, ending with a clear urgency tier and a specialist you can book straight away.</p>
          <div className="lp-actions lp-actions-center">
            <Link className="lp-btn lp-btn-light" href="/register">
              Create an account
            </Link>
            <Link className="lp-btn lp-btn-outline-light" href="/features">
              Explore the platform
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
