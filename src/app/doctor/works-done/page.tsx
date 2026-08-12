'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getAppointments, getDoctors } from '@/lib/api';
import { Appointment } from '@/lib/types';

export default function DoctorWorksDonePage() {
  return (
    <AuthGuard allowedRoles={['DOCTOR']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading clinical metrics…</p>
            </div>
          </div>
        }
      >
        <WorksDoneContent />
      </Suspense>
    </AuthGuard>
  );
}

function WorksDoneContent() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([getAppointments({ doctor_user_id: user.id }), getDoctors()])
      .then(([apps, docs]) => {
        setAppointments(apps);
        setRating(docs.find((d) => d.profile_id === user.id)?.rating ?? null);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load clinical metrics'))
      .finally(() => setIsLoading(false));
  }, [user]);

  const completed = appointments.filter((a) => a.status === 'COMPLETED');
  const triaged = appointments.filter((a) => a.triage_urgency);
  const paid = appointments.filter((a) => a.payment_status === 'SIMULATED_SUCCESS');
  const revenue = paid.reduce((sum, a) => sum + a.payment_amount, 0);

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-clipboard2-check" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Performance Analytics</p>
            <h1 className="h3 mb-1">Work Done by Doctor</h1>
            <p className="text-muted mb-0">
              Triage evaluations, completed consultations and settled consultation revenue.
            </p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      <section className="row g-3" aria-label="Clinical metrics">
        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-primary">
            <div className="metric-top">
              <span className="metric-label">Triage-Linked Cases</span>
              <span className="metric-icon">
                <i className="bi bi-diagram-3" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">{triaged.length}</div>
            <div className="metric-meta">
              <span>Routed by the triage engine</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-success">
            <div className="metric-top">
              <span className="metric-label">Consultations</span>
              <span className="metric-icon">
                <i className="bi bi-check2-circle" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">{completed.length}</div>
            <div className="metric-meta">
              <span>Completed &amp; signed sessions</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-warning">
            <div className="metric-top">
              <span className="metric-label">Revenue</span>
              <span className="metric-icon">
                <i className="bi bi-cash-coin" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">GH₵ {revenue.toFixed(2)}</div>
            <div className="metric-meta">
              <span>
                From {paid.length} settled payment{paid.length === 1 ? '' : 's'}
              </span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-danger">
            <div className="metric-top">
              <span className="metric-label">Quality Score</span>
              <span className="metric-icon">
                <i className="bi bi-star" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">{rating !== null ? rating.toFixed(1) : '—'}</div>
            <div className="metric-meta">
              <span>Registry rating on your profile</span>
            </div>
          </article>
        </div>
      </section>

      <section className="panel mt-3">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-journal-medical" aria-hidden="true" />
              <span>Recent Completed Consultations</span>
            </h2>
            <p className="text-muted mb-0">Signed records from your workspace.</p>
          </div>
          <span className="badge text-bg-secondary">{completed.length} records</span>
        </div>

        {isLoading ? (
          <p className="text-muted small mb-0">Loading consultation records…</p>
        ) : completed.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-journal-x" aria-hidden="true" />
            <p className="mb-0">No completed consultations recorded yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Patient</th>
                  <th scope="col">Specialty</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Notes</th>
                  <th scope="col" className="text-end">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {completed.map((app) => (
                  <tr key={app.id}>
                    <td className="fw-semibold">{app.patient_name}</td>
                    <td>{app.doctor_specialty}</td>
                    <td>{app.reason || 'Consultation'}</td>
                    <td className="text-muted small">{app.notes || '—'}</td>
                    <td className="text-end">
                      <span className="badge text-bg-success">Completed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
