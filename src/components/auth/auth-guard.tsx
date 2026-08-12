'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from './auth-modal';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'PATIENT' | 'DOCTOR' | 'ADMIN'>;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalTab, setModalTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // While the session rehydrates from localStorage, show a neutral placeholder
  // so "Authentication Required" does not flash on every refresh.
  if (isLoading) {
    return (
      <div className="panel blank-panel">
        <div className="blank-state">
          <span className="page-icon mb-3">
            <i className="bi bi-activity" aria-hidden="true" />
          </span>
          <p className="text-muted mb-0">Restoring your secure session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <section className="panel app-modal text-center">
          <span className="page-icon mx-auto mb-3">
            <i className="bi bi-shield-lock" aria-hidden="true" />
          </span>
          <h1 className="h4 mb-2">Authentication Required</h1>
          <p className="text-muted">
            Please log in or register a patient account to access telehealth triage, doctor consultations and
            medical records.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setModalTab('LOGIN');
                setShowAuthModal(true);
              }}
            >
              <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Sign In
            </button>
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => {
                setModalTab('REGISTER');
                setShowAuthModal(true);
              }}
            >
              <i className="bi bi-person-plus" aria-hidden="true" /> Register New Patient
            </button>
          </div>
        </section>

        {showAuthModal && <AuthModal initialTab={modalTab} onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <section className="panel panel-accent accent-danger app-modal text-center">
        <span className="page-icon mx-auto mb-3">
          <i className="bi bi-exclamation-octagon" aria-hidden="true" />
        </span>
        <h1 className="h4 mb-2">Access Restricted</h1>
        <p className="text-muted mb-0">
          Your account role <span className="badge text-bg-secondary">{user.role}</span> is not authorised to view
          this clinical workspace section.
        </p>
      </section>
    );
  }

  return <>{children}</>;
};
