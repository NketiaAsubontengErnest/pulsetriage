'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const SUBJECTS = [
  'General enquiry',
  'Booking or rescheduling help',
  'Clinician registration',
  'Technical problem',
  'Billing question',
  'Feedback or complaint',
];

const CHANNELS = [
  {
    icon: 'bi-envelope',
    title: 'Email',
    body: 'support@pulsetriage.health',
    note: 'We aim to reply within one working day.',
  },
  {
    icon: 'bi-telephone',
    title: 'Telephone',
    body: '+233 (0) 30 250 0000',
    note: 'Monday to Friday, 08:00 – 17:00 GMT.',
  },
  {
    icon: 'bi-geo-alt',
    title: 'Address',
    body: 'Department of Computer Science, University of Ghana, Legon, Accra',
    note: 'Visits by appointment only.',
  },
  {
    icon: 'bi-clock-history',
    title: 'Consultation hours',
    body: 'Set individually by each clinician',
    note: 'Availability is shown when you book.',
  },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError('Please complete your name, email address and message.');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Could not send your message. Please try again.');
        return;
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject(SUBJECTS[0]);
      setMessage('');
    } catch (err) {
      setFormError(`Could not reach the server. Please try again. (${(err as Error).message})`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="lp">
      <header className="lp-pagehead">
        <div className="lp-pagehead-inner">
          <p className="lp-eyebrow">Contact us</p>
          <h1 className="lp-display lp-display-sm">We would like to hear from you</h1>
          <p>
            Questions about booking, joining as a clinician, or anything that is not working as it should — send us a
            message and a person will read it.
          </p>
        </div>
      </header>

      <section className="lp-section">
        <div className="lp-contact">
          {/* ── Form ─────────────────────────────────────────────────────── */}
          <div>
            <h2 className="lp-heading">Send a message</h2>

            <div className="lp-notice lp-notice-danger" role="note">
              <strong>This form is not for emergencies.</strong> If you are experiencing chest pain, difficulty
              breathing, stroke symptoms or any other medical emergency, call your local emergency number immediately.
            </div>

            {submitted && (
              <div className="lp-notice" role="status">
                <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                Thank you — your message has been delivered to our administrators and recorded. We will reply to the
                email address you gave us.
              </div>
            )}

            {formError && (
              <div className="lp-notice lp-notice-danger" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="lp-field">
                <label htmlFor="contactName">Your name</label>
                <input
                  id="contactName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Ama Serwaa Prempeh"
                />
              </div>

              <div className="lp-field">
                <label htmlFor="contactEmail">Email address</label>
                <input
                  id="contactEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <div className="lp-field">
                <label htmlFor="contactSubject">What is this about?</label>
                <select id="contactSubject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lp-field">
                <label htmlFor="contactMessage">Your message</label>
                <textarea
                  id="contactMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need. Please do not include clinical details you would not want recorded here."
                />
              </div>

              <button type="submit" className="lp-btn lp-btn-primary" disabled={isSending}>
                {isSending ? (
                  <>
                    <i className="bi bi-arrow-repeat spin" aria-hidden="true" /> Sending…
                  </>
                ) : (
                  <>
                    <i className="bi bi-send" aria-hidden="true" /> Send message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── Channels ─────────────────────────────────────────────────── */}
          <aside>
            <h2 className="lp-heading">Other ways to reach us</h2>

            {CHANNELS.map((channel) => (
              <div className="lp-contact-item" key={channel.title}>
                <h3>
                  <i className={`bi ${channel.icon}`} aria-hidden="true" />
                  {channel.title}
                </h3>
                <p>{channel.body}</p>
                <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                  {channel.note}
                </p>
              </div>
            ))}

            <div className="lp-contact-item">
              <h3>
                <i className="bi bi-question-circle" aria-hidden="true" />
                Looking for an answer now?
              </h3>
              <p>
                Many common questions about triage, booking and how AI is used are answered on the{' '}
                <Link href="/features" style={{ fontWeight: 700 }}>
                  platform page
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <p className="lp-eyebrow lp-eyebrow-inverse">Or start now</p>
          <h2 className="lp-display lp-display-sm">You can begin without waiting for us</h2>
          <p>Create an account and run a symptom assessment in about three minutes.</p>
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
