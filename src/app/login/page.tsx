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
      setErrorMsg(result.error || 'Invalid credentials. Please try again.');
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
      setErrorMsg(result.error || 'Demo login failed.');
    } else {
      redirectByRole(role);
    }
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
              <small>Sign in to your telehealth workspace.</small>
            </span>
          </Link>

          <form onSubmit={handleLoginSubmit} noValidate>
            <div className="mb-4">
              <p className="eyebrow mb-1">Secure Access</p>
              <h1 className="h3 mb-1">Login</h1>
              <p className="text-muted mb-0">Patient, doctor and administrator portals.</p>
            </div>

            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                <span className="small">{errorMsg}</span>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label" htmlFor="loginEmail">
                Email address
              </label>
              <input
                className="form-control"
                id="loginEmail"
                type="email"
                autoComplete="email"
                placeholder="patient@ug.edu.gh"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="loginPassword">
                Password
              </label>
              <input
                className="form-control"
                id="loginPassword"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
              <i className={isSubmitting ? 'bi bi-arrow-repeat' : 'bi bi-box-arrow-in-right'} aria-hidden="true" />
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-3 border-top">
            <p className="eyebrow mb-2">Quick demo login — password123</p>
            <div className="d-grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  className="btn btn-light btn-sm justify-content-between"
                  type="button"
                  disabled={!!demoLoading}
                  onClick={() => handleDemoLogin(account.role, account.email)}
                >
                  <span className="d-inline-flex align-items-center gap-2">
                    <i
                      className={demoLoading === account.role ? 'bi bi-arrow-repeat' : `bi ${account.icon}`}
                      aria-hidden="true"
                    />
                    <span>
                      {account.role.charAt(0) + account.role.slice(1).toLowerCase()} — {account.name}
                    </span>
                  </span>
                  <span className="text-muted small d-none d-sm-inline">{account.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="auth-footer">
            New patient? <Link href="/register">Create an account</Link>
          </div>
        </section>
      </main>
    </>
  );
}
