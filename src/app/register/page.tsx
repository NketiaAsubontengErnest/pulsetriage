'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/lib/ui-context';

export default function RegisterPage() {
  const { registerPatient } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password) {
      setErrorMsg('Please fill in all required patient registration fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    const result = await registerPatient(fullName, email, phone, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed. Please try again.');
      return;
    }

    router.push('/patient');
  };

  return (
    <>
      <ThemeToggle className="auth-theme-toggle" />

      <main className="auth-page">
        <section className="auth-card">
          <Link className="auth-brand" href="/">
            <span className="brand-icon">
              <i className="bi bi-activity" aria-hidden="true" />
            </span>
            <span>
              <strong>PulseTriage</strong>
              <small>Create your patient account.</small>
            </span>
          </Link>

          <form onSubmit={handleRegisterSubmit} noValidate>
            <div className="mb-4">
              <p className="eyebrow mb-1">Patient Onboarding</p>
              <h1 className="h3 mb-1">Register</h1>
              <p className="text-muted mb-0">Unlock symptom auto-triage, doctor discovery and slot booking.</p>
            </div>

            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                <span className="small">{errorMsg}</span>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label" htmlFor="fullName">
                Full name
              </label>
              <input
                className="form-control"
                id="fullName"
                type="text"
                placeholder="e.g. Ama Serwaa Prempeh"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="registerEmail">
                  Email address
                </label>
                <input
                  className="form-control"
                  id="registerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="patient@ug.edu.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="registerPhone">
                  Phone number
                </label>
                <input
                  className="form-control"
                  id="registerPhone"
                  type="tel"
                  placeholder="+233 24 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="registerPassword">
                  Create password
                </label>
                <input
                  className="form-control"
                  id="registerPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  className="form-control"
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button className="btn btn-primary w-100 mt-4" type="submit" disabled={isSubmitting}>
              <i className={isSubmitting ? 'bi bi-arrow-repeat' : 'bi bi-check2-circle'} aria-hidden="true" />
              {isSubmitting ? 'Creating account…' : 'Complete Registration'}
            </button>
          </form>

          <div className="auth-footer">
            Already registered? <Link href="/login">Sign in here</Link>
          </div>
        </section>
      </main>
    </>
  );
}
