'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getAppointments } from '@/lib/api';
import { Appointment } from '@/lib/types';

export default function DoctorCompletedArchivesPage() {
  return (
    <AuthGuard allowedRoles={['DOCTOR']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading medical archives…</p>
            </div>
          </div>
        }
      >
        <CompletedArchivesContent />
      </Suspense>
    </AuthGuard>
  );
}

function CompletedArchivesContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [archives, setArchives] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) return;
    getAppointments({ doctor_user_id: user.id, status: 'COMPLETED' })
      .then(setArchives)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load archives'))
      .finally(() => setIsLoading(false));
  }, [user]);

  const term = searchTerm.toLowerCase();
  const filteredArchives = archives.filter(
    (a) =>
      (a.patient_name || '').toLowerCase().includes(term) ||
      (a.reason || '').toLowerCase().includes(term) ||
      (a.notes || '').toLowerCase().includes(term)
  );

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-check2-circle" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Clinical Medical Records</p>
            <h1 className="h3 mb-1">Completed Patient Archives</h1>
            <p className="text-muted mb-0">Signed consultation records, diagnostic summaries and EHR archives.</p>
          </div>
        </div>
        <div className="heading-actions">
          <span className="badge text-bg-secondary">{archives.length} archived</span>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-archive" aria-hidden="true" />
              <span>Signed Consultation Summaries</span>
            </h2>
            <p className="text-muted mb-0">Search by patient name, reason or clinical note.</p>
          </div>
          <input
            className="form-control form-control-sm table-search"
            type="search"
            placeholder="Search archives"
            aria-label="Search archives"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="text-muted small mb-0">Loading signed archives…</p>
        ) : filteredArchives.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-folder-x" aria-hidden="true" />
            <p className="mb-0">
              {archives.length === 0
                ? 'No completed consultations archived yet.'
                : 'No archives match your search.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Patient</th>
                  <th scope="col">EHR reference</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Urgency</th>
                  <th scope="col">Consulted</th>
                  <th scope="col" className="text-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredArchives.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <p className="fw-semibold mb-0">{app.patient_name}</p>
                      {app.notes && <p className="text-muted small mb-0">{app.notes}</p>}
                    </td>
                    <td className="fw-semibold">EHR-{app.id.slice(-8).toUpperCase()}</td>
                    <td>{app.reason || 'Not specified'}</td>
                    <td>
                      <span className={`urgency-badge urgency-${(app.triage_urgency || 'ROUTINE').toLowerCase()}`}>
                        {(app.triage_urgency || 'ROUTINE').replace('_', ' ')}
                      </span>
                    </td>
                    <td>{app.appointment_date}</td>
                    <td className="text-end">
                      <button className="btn btn-light btn-sm" type="button">
                        <i className="bi bi-download" aria-hidden="true" /> PDF
                      </button>
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
