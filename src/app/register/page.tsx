'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/lib/ui-context';

const MIN_PASSWORD = 8;

export default function RegisterPage() {
  const { registerPatient } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Errors surface once the user has left the field, not while they type.
  const passwordTooShort = touched.password && password.length > 0 && password.length < MIN_PASSWORD;
  const passwordsDiffer = touched.confirm && confirmPassword.length > 0 && confirmPassword !== password;
  const canSubmit =
    fullName.trim() && email.trim() && phone.trim() && password.length >= MIN_PASSWORD && confirmPassword === password;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !password) {
      setErrorMsg('Please complete every field to create your account.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setErrorMsg(`Please choose a password of at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('The two passwords do not match. Please re-enter them.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    const result = await registerPatient(fullName, email, phone, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'We could not create your account. Please try again.');
      return;
    }

    router.push('/patient');
  };

  return (
    <main className="auth-page">
      {/* ── Editorial panel (large screens only) ──────────────────────────── */}
      <aside className="auth-aside">
        <Link className="auth-brand" href="/">
          <i className="bi bi-activity" aria-hidden="true" />
          PulseTriage
        </Link>

        <div>
          <h2>
            Begin with an assessment,
            <br />
            not a queue.
          </h2>
          <p>
            Create a patient account to describe your symptoms, understand how urgent they are, and book the right
            specialist at a time they genuinely have free.
          </p>

          <ul className="auth-points">
            <li>
              <i className="bi bi-check-lg" aria-hidden="true" />
              A guided assessment in about three minutes
            </li>
            <li>
              <i className="bi bi-check-lg" aria-hidden="true" />
              Matched to the specialty that fits your symptoms
            </li>
            <li>
              <i className="bi bi-check-lg" aria-hidden="true" />
              Reschedule or cancel at no extra charge
            </li>
            <li>
              <i className="bi bi-check-lg" aria-hidden="true" />
              Signed clinical notes after every consultation
            </li>
          </ul>
        </div>

        <p className="auth-footnote">
          Not for medical emergencies. If symptoms are severe, call your local emergency number.
        </p>
      </aside>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <div className="auth-main">
        <div className="auth-form-wrap">
          <div className="auth-topbar">
            <ThemeToggle />
          </div>

          <Link className="auth-mobile-brand" href="/">
            <i className="bi bi-activity" aria-hidden="true" />
            PulseTriage
          </Link>

          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Patient registration takes less than a minute.</p>

          <div role="status" aria-live="polite">
            {errorMsg && (
              <div className="lp-notice lp-notice-danger">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                <p>{errorMsg}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleRegisterSubmit} noValidate>
            <div className="lp-field">
              <label htmlFor="regName">Full name</label>
              <input
                id="regName"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ama Serwaa Prempeh"
                required
              />
            </div>

            <div className="lp-field">
              <label htmlFor="regEmail">Email address</label>
              <input
                id="regEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                aria-describedby="regEmail-help"
              />
              <p className="lp-help" id="regEmail-help">
                This becomes your sign-in name.
              </p>
            </div>

            <div className="lp-field">
              <label htmlFor="regPhone">Phone number</label>
              <input
                id="regPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 24 000 0000"
                required
              />
            </div>

            <div className={`lp-field${passwordTooShort ? ' lp-field-invalid' : ''}`}>
              <label htmlFor="regPassword">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="regPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="At least 8 characters"
                  required
                  aria-invalid={!!passwordTooShort}
                  aria-describedby={passwordTooShort ? 'regPassword-error' : 'regPassword-help'}
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                </button>
              </div>
              {passwordTooShort ? (
                <p className="lp-error" id="regPassword-error">
                  <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                  Use at least {MIN_PASSWORD} characters.
                </p>
              ) : (
                <p className="lp-help" id="regPassword-help">
                  Minimum {MIN_PASSWORD} characters.
                </p>
              )}
            </div>

            <div className={`lp-field${passwordsDiffer ? ' lp-field-invalid' : ''}`}>
              <label htmlFor="regConfirm">Confirm password</label>
              <input
                id="regConfirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                placeholder="Re-enter your password"
                required
                aria-invalid={!!passwordsDiffer}
                aria-describedby={passwordsDiffer ? 'regConfirm-error' : undefined}
              />
              {passwordsDiffer && (
                <p className="lp-error" id="regConfirm-error">
                  <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                  The two passwords do not match.
                </p>
              )}
            </div>

            <button type="submit" className="lp-btn lp-btn-primary auth-submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? (
                <>
                  <i className="bi bi-arrow-repeat spin" aria-hidden="true" /> Creating your account…
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus" aria-hidden="true" /> Create account
                </>
              )}
            </button>
          </form>

          <p className="auth-foot">
            Already registered? <Link href="/login">Sign in instead</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
