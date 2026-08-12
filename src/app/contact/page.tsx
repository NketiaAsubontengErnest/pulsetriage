'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Faq } from '@/components/public/faq';

const RED_FLAGS = [
  'Chest pain or pressure radiating to the arm or jaw',
  'Severe shortness of breath at rest',
  'Sudden weakness or numbness on one side of the face or body',
  'High fever above 39.5 °C with neck stiffness',
  'Blue lips, facial discolouration or hypoxia',
  'Uncontrolled or heavy bleeding',
];

const CHANNELS = [
  {
    icon: 'bi-geo-alt',
    label: 'Campus location',
    value: 'Department of Computer Science',
    detail: 'University of Ghana, Legon, Accra',
  },
  {
    icon: 'bi-envelope',
    label: 'Examination support',
    value: 'cscd602-exams@ug.edu.gh',
    detail: 'Replies within one working day',
  },
  {
    icon: 'bi-clock-history',
    label: 'Availability',
    value: '24/7 automated triage',
    detail: 'Consultations run in scheduled windows',
  },
  {
    icon: 'bi-person-badge',
    label: 'Examiner',
    value: 'Prof. Solomon Mensah',
    detail: 'CSCD 602 Advanced Software Engineering',
  },
];

const SUBJECTS = [
  'General enquiry',
  'Account or login problem',
  'Appointment or booking issue',
  'Billing question',
  'Report a defect',
];

const FAQS = [
  {
    question: 'How quickly will I get a reply?',
    answer:
      'Administrative enquiries submitted through this form are routed to clinical administration and answered within one working day. This channel is not monitored overnight.',
  },
  {
    question: 'I need to change an appointment — should I use this form?',
    answer:
      'No, that is faster to do yourself. Sign in, open My Appointments, and use Reschedule or Cancel on the booking. A cancellation records a simulated refund automatically.',
  },
  {
    question: 'I forgot my password. What now?',
    answer:
      'Send an enquiry from this page with the email address on your account and clinical administration will reset it for you. Never share your password in the message body.',
  },
  {
    question: 'Can I request my triage history?',
    answer:
      'Yes. Your full assessment history is already visible on your patient dashboard, and administration can export it on request for your own records.',
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setFormError('Please provide your name, email address and a message.');
      return;
    }
    setFormError('');
    setSubmitted(true);
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="public-hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow mb-2">
              <i className="bi bi-headset me-1" aria-hidden="true" />
              Contact &amp; support
            </p>
            <h1 className="hero-title">
              Talk to us — or <span className="accent">call 112</span> if it cannot wait
            </h1>
            <p className="hero-lead">
              Clinical administration handles account, booking and billing questions. Anything that looks
              life-threatening belongs with emergency services, not an online form.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <a className="btn btn-danger" href="tel:112">
                <i className="bi bi-telephone-fill" aria-hidden="true" /> Emergency: 112
              </a>
              <a className="btn btn-outline-secondary" href="#enquiry">
                <i className="bi bi-send" aria-hidden="true" /> Send an Enquiry
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Emergency notice ─────────────────────────────────────────────── */}
      <section className="panel panel-accent accent-danger public-section">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-lg-7">
            <h2 className="h5 section-title mb-3">
              <i className="bi bi-exclamation-octagon" aria-hidden="true" />
              <span>Life-threatening emergency notice</span>
            </h2>
            <p className="text-muted mb-3">
              If you or someone in your care shows any of the indicators listed here, do <strong>not</strong> submit
              an enquiry and do <strong>not</strong> wait for a telehealth consultation. Call national emergency
              services or go to the nearest emergency room immediately.
            </p>
            <a className="btn btn-danger" href="tel:112">
              <i className="bi bi-telephone-fill" aria-hidden="true" /> Call National Emergency Services (112)
            </a>
          </div>

          <div className="col-12 col-lg-5">
            <ul className="compare-list">
              {RED_FLAGS.map((flag) => (
                <li key={flag}>
                  <i className="bi bi-exclamation-circle-fill text-danger" aria-hidden="true" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Channels ─────────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">Reach us</p>
          <h2 className="h3">Where to find the department</h2>
          <p>Non-clinical enquiries are handled by the same team that maintains the platform.</p>
        </div>

        <div className="row g-3">
          {CHANNELS.map((channel) => (
            <div className="col-12 col-sm-6 col-xl-3" key={channel.label}>
              <div className="contact-tile">
                <span className="section-title mb-1">
                  <i className={`bi ${channel.icon}`} aria-hidden="true" />
                </span>
                <p className="eyebrow mb-0">{channel.label}</p>
                <strong>{channel.value}</strong>
                <span>{channel.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Enquiry form + FAQ ───────────────────────────────────────────── */}
      <section className="public-section" id="enquiry">
        <div className="row g-3">
          <div className="col-12 col-xl-7">
            <div className="panel h-100">
              <div className="panel-header">
                <div>
                  <h2 className="h5 mb-1 section-title">
                    <i className="bi bi-send" aria-hidden="true" />
                    <span>Send an administrative enquiry</span>
                  </h2>
                  <p className="text-muted mb-0">Non-emergency questions only.</p>
                </div>
              </div>

              {submitted ? (
                <div className="empty-state">
                  <i className="bi bi-check2-circle" aria-hidden="true" />
                  <p className="fw-semibold mb-1">Thank you — your enquiry has been dispatched.</p>
                  <p className="mb-3">
                    Clinical administration will reply to <strong>{email}</strong> within one working day.
                  </p>
                  <button
                    className="btn btn-light btn-sm"
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setMessage('');
                      setSubject(SUBJECTS[0]);
                    }}
                  >
                    <i className="bi bi-arrow-repeat" aria-hidden="true" /> Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {formError && (
                    <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                      <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                      <span className="small">{formError}</span>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="contactName">
                        Your full name
                      </label>
                      <input
                        className="form-control"
                        id="contactName"
                        type="text"
                        placeholder="e.g. Ama Serwaa Prempeh"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="contactEmail">
                        Email address
                      </label>
                      <input
                        className="form-control"
                        id="contactEmail"
                        type="email"
                        placeholder="patient@ug.edu.gh"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="contactSubject">
                        Subject
                      </label>
                      <select
                        className="form-select"
                        id="contactSubject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      >
                        {SUBJECTS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label" htmlFor="contactMessage">
                        Message
                      </label>
                      <textarea
                        className="form-control"
                        id="contactMessage"
                        rows={5}
                        placeholder="Describe your non-emergency enquiry…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <p className="text-muted small mt-2 mb-0">
                        <i className="bi bi-shield-lock me-1" aria-hidden="true" />
                        Never include passwords or full medical records in this form.
                      </p>
                    </div>
                  </div>

                  <button className="btn btn-primary w-100 mt-4" type="submit">
                    <i className="bi bi-send" aria-hidden="true" /> Submit Enquiry
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="col-12 col-xl-5">
            <div className="panel h-100">
              <div className="panel-header">
                <div>
                  <h2 className="h5 mb-1 section-title">
                    <i className="bi bi-question-circle" aria-hidden="true" />
                    <span>Common questions</span>
                  </h2>
                  <p className="text-muted mb-0">You may not need to write to us at all.</p>
                </div>
              </div>

              <Faq items={FAQS} />

              <div className="mini-card mt-3">
                <strong>Already have an account?</strong>
                <span>Most booking and record requests are faster to handle from your own dashboard.</span>
                <Link className="btn btn-light btn-sm mt-2 align-self-start" href="/login">
                  <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
