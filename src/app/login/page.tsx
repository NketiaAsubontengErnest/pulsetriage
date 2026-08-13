'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/lib/ui-context';

const DEMO_ACCOUNTS = [
  { role: 'PATIENT' as const, icon: 'bi-person-heart', name: 'Ama Serwaa Prempeh', email: 'patient@ug.edu.gh' },
  { role: 'DOCTOR' as const, icon: 'bi-clipboard2-pulse', name: 'Dr. Kwame Mensah', email: 'dr.mensah@ug.edu.gh' },
  { role: 'ADMIN' as const, icon: 'bi-shield-check', name: 'Prof. Solomon Mensah', email: 'admin@ug.edu.gh' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const redirectByRole = (role: string) => {
    if (role === 'DOCTOR') router.push('/doctor');
    else if (role === 'ADMIN') router.push('/admin');
    else router.push('/patient');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'That email and password did not match an account. Please check and try again.');
    } else {
      // Role is embedded in the session — read from localStorage
      const session = JSON.parse(localStorage.getItem('pulsetriage_session') || '{}');
      redirectByRole(session.role || 'PATIENT');
    }
  };

  const handleDemoLogin = async (role: 'PATIENT' | 'DOCTOR' | 'ADMIN', demoEmail: string) => {
    setDemoLoading(role);
    setErrorMsg(null);
    const result = await login(demoEmail, 'password123');
    setDemoLoading(null);

    if (!result.success) {
      setErrorMsg(result.error || 'Demo sign-in failed.');
    } else {
      redirectByRole(role);
    }
  };

  const busy = isSubmitting || demoLoading !== null;

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
            The most urgent patient
            <br />
            should be seen first.
          </h2>
          <p>
            Sign in to your workspace — whether you are managing your own care, working a clinical queue ordered by
            urgency, or governing the registry.
          </p>

          <ul className="auth-points">
            <li>
              <i className="bi bi-check-lg" aria-hidden="true" />
              Symptom assessment before booking
            </li>
            <li>
              <i className="bi bi-check-lg" aria-hidden="true" />
              Secure video consultations
            </li>
            <li>
              <i className="bi bi-check-lg" aria-hidden="true" />
              Your complete clinical record
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

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to continue to your workspace.</p>

          <div role="status" aria-live="polite">
            {errorMsg && (
              <div className="lp-notice lp-notice-danger">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                <p>{errorMsg}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleLoginSubmit} noValidate>
            <div className="lp-field">
              <label htmlFor="loginEmail">Email address</label>
              <input
                id="loginEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="lp-field">
              <label htmlFor="loginPassword">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
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
            </div>

            <button type="submit" className="lp-btn lp-btn-primary auth-submit" disabled={busy}>
              {isSubmitting ? (
                <>
                  <i className="bi bi-arrow-repeat spin" aria-hidden="true" /> Signing in…
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Sign in
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">Or try a demonstration account</div>

          <div className="auth-demo">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => handleDemoLogin(account.role, account.email)}
                disabled={busy}
              >
                <i className={`bi ${account.icon}`} aria-hidden="true" />
                <span className="flex-grow-1">
                  <span className="auth-demo-name">{account.name}</span>
                  <span className="auth-demo-role">{account.role}</span>
                </span>
                <i
                  className={`bi ${demoLoading === account.role ? 'bi-arrow-repeat spin' : 'bi-arrow-right'}`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          <p className="auth-foot">
            New to PulseTriage? <Link href="/register">Create a patient account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
