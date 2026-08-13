'use client';

import React, { useRef, useState } from 'react';
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { name?: string; email?: string; message?: string };

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Please tell us your name so we know who we are replying to.';
    if (!email.trim()) next.email = 'We need an email address to reply to.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'That does not look like a valid email address.';
    if (!message.trim()) next.message = 'Please write your message before sending.';
    return next;
  };

  /** Validate on blur, not on every keystroke — errors appear once a field is finished. */
  const validateField = (field: keyof FieldErrors) => {
    const all = validate();
    setErrors((prev) => ({ ...prev, [field]: all[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Move focus to the first field that needs attention.
      if (found.name) nameRef.current?.focus();
      else if (found.email) emailRef.current?.focus();
      else messageRef.current?.focus();
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
      setErrors({});
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
          <p className="lp-eyebrow lp-rule-above">Contact us</p>
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
              <i className="bi bi-exclamation-octagon-fill" aria-hidden="true" />
              <p>
                <strong>This form is not for emergencies.</strong> If you are experiencing chest pain, difficulty
                breathing, stroke symptoms or any other medical emergency, call your local emergency number
                immediately.
              </p>
            </div>

            {/* Outcome is announced politely rather than stealing focus. */}
            <div role="status" aria-live="polite">
              {submitted && (
                <div className="lp-notice lp-notice-success">
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                  <p>
                    Thank you — your message has been delivered to our administrators and recorded. We will reply to
                    the email address you gave us.
                  </p>
                </div>
              )}
              {formError && (
                <div className="lp-notice lp-notice-danger">
                  <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                  <p>{formError}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className={`lp-field${errors.name ? ' lp-field-invalid' : ''}`}>
                <label htmlFor="contactName">
                  Your name<span className="lp-req" aria-hidden="true">*</span>
                </label>
                <input
                  id="contactName"
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => validateField('name')}
                  autoComplete="name"
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'contactName-error' : undefined}
                />
                {errors.name && (
                  <p className="lp-error" id="contactName-error">
                    <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className={`lp-field${errors.email ? ' lp-field-invalid' : ''}`}>
                <label htmlFor="contactEmail">
                  Email address<span className="lp-req" aria-hidden="true">*</span>
                </label>
                <input
                  id="contactEmail"
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => validateField('email')}
                  autoComplete="email"
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'contactEmail-error' : 'contactEmail-help'}
                />
                {errors.email ? (
                  <p className="lp-error" id="contactEmail-error">
                    <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                    {errors.email}
                  </p>
                ) : (
                  <p className="lp-help" id="contactEmail-help">
                    We only use this to reply to your message.
                  </p>
                )}
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

              <div className={`lp-field${errors.message ? ' lp-field-invalid' : ''}`}>
                <label htmlFor="contactMessage">
                  Your message<span className="lp-req" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="contactMessage"
                  ref={messageRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onBlur={() => validateField('message')}
                  required
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'contactMessage-error' : 'contactMessage-help'}
                />
                {errors.message ? (
                  <p className="lp-error" id="contactMessage-error">
                    <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                    {errors.message}
                  </p>
                ) : (
                  <p className="lp-help" id="contactMessage-help">
                    Please do not include clinical details you would not want recorded here.
                  </p>
                )}
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
                <p>{channel.note}</p>
              </div>
            ))}

            <div className="lp-contact-item">
              <h3>
                <i className="bi bi-question-circle" aria-hidden="true" />
                Looking for an answer now?
              </h3>
              <p>
                Many common questions about triage, booking and how AI is used are answered on the{' '}
                <Link href="/features">platform page</Link>.
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
