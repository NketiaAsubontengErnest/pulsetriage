'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  initialTab?: 'LOGIN' | 'REGISTER';
  onClose: () => void;
}

const DEMO_ACCOUNTS = [
  { role: 'PATIENT' as const, label: 'Patient', icon: 'bi-person-heart', email: 'patient@ug.edu.gh' },
  { role: 'DOCTOR' as const, label: 'Doctor', icon: 'bi-clipboard2-pulse', email: 'dr.mensah@ug.edu.gh' },
  { role: 'ADMIN' as const, label: 'Admin', icon: 'bi-shield-check', email: 'admin@ug.edu.gh' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ initialTab = 'LOGIN', onClose }) => {
  const { login, registerPatient } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>(initialTab);

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dashboardFor = (role: string) =>
    role === 'DOCTOR' ? '/doctor' : role === 'ADMIN' ? '/admin' : '/patient';

  const signIn = async (emailValue: string, passwordValue: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const result = await login(emailValue, passwordValue);
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid credentials');
        return;
      }

      // auth-context persists the session; read the role back for routing.
      const saved = localStorage.getItem('pulsetriage_session');
      const role = saved ? (JSON.parse(saved).role as string) : 'PATIENT';
      onClose();
      router.push(dashboardFor(role));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    signIn(email, password);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPhone) {
      setErrorMsg('Please fill in all required registration fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const result = await registerPatient(regFullName, regEmail, regPhone, regPassword || undefined);
      if (!result.success) {
        setErrorMsg(result.error || 'Registration failed');
        return;
      }
      onClose();
      router.push('/patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-label="Account access">
      <section className="panel app-modal">
        <div className="panel-header">
          <div>
            <p className="eyebrow mb-1">Account Access</p>
            <h2 className="h5 mb-0">{activeTab === 'LOGIN' ? 'Sign in to PulseTriage' : 'New patient registration'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        <ul className="nav nav-pills nav-fill mb-3">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link w-100 ${activeTab === 'LOGIN' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('LOGIN');
                setErrorMsg(null);
              }}
            >
              Sign In
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link w-100 ${activeTab === 'REGISTER' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('REGISTER');
                setErrorMsg(null);
              }}
            >
              Register
            </button>
          </li>
        </ul>

        {errorMsg && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
            <span className="small">{errorMsg}</span>
          </div>
        )}

        {activeTab === 'LOGIN' ? (
          <>
            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label" htmlFor="modalEmail">
                  Email address
                </label>
                <input
                  className="form-control"
                  id="modalEmail"
                  type="email"
                  placeholder="patient@ug.edu.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="modalPassword">
                  Password
                </label>
                <input
                  className="form-control"
                  id="modalPassword"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
                <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                {isSubmitting ? 'Signing in…' : 'Sign In to Account'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-top">
              <p className="eyebrow mb-2">Quick demo sign-in</p>
              <div className="row g-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <div className="col-4" key={account.role}>
                    <button
                      className="btn btn-light btn-sm w-100"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => signIn(account.email, 'password123')}
                    >
                      <i className={`bi ${account.icon}`} aria-hidden="true" />
                      <span>{account.label}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleRegisterSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="modalFullName">
                Full name
              </label>
              <input
                className="form-control"
                id="modalFullName"
                type="text"
                placeholder="e.g. Kwaku Mensah"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="modalRegEmail">
                Email address
              </label>
              <input
                className="form-control"
                id="modalRegEmail"
                type="email"
                placeholder="name@domain.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="modalRegPhone">
                Phone number
              </label>
              <input
                className="form-control"
                id="modalRegPhone"
                type="tel"
                placeholder="+233 24 000 0000"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="modalRegPassword">
                Password
              </label>
              <input
                className="form-control"
                id="modalRegPassword"
                type="password"
                placeholder="Create a strong password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
              <i className="bi bi-check2-circle" aria-hidden="true" />
              {isSubmitting ? 'Creating account…' : 'Create Patient Account'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
