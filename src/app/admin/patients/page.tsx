'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { getPatients, getTriages, PatientRow } from '@/lib/api';
import { TriageAssessment } from '@/lib/types';

export default function AdminPatientsPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading patient records…</p>
            </div>
          </div>
        }
      >
        <PatientRecordsContent />
      </Suspense>
    </AuthGuard>
  );
}

function PatientRecordsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [patientUsers, setPatientUsers] = useState<PatientRow[]>([]);
  const [triageRecords, setTriageRecords] = useState<TriageAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTriage, setIsLoadingTriage] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getPatients()
      .then(setPatientUsers)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load patients'))
      .finally(() => setIsLoading(false));
  }, []);

  // Pull the selected patient's triage history on demand.
  useEffect(() => {
    if (!selectedPatient) {
      setTriageRecords([]);
      return;
    }
    setIsLoadingTriage(true);
    getTriages(selectedPatient.id)
      .then(setTriageRecords)
      .catch(() => setTriageRecords([]))
      .finally(() => setIsLoadingTriage(false));
  }, [selectedPatient]);

  const term = searchTerm.toLowerCase();
  const filteredPatients = patientUsers.filter(
    (p) =>
      p.full_name.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
  );

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-people" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Operations Center</p>
            <h1 className="h3 mb-1">Patient Records &amp; Triage History</h1>
            <p className="text-muted mb-0">
              Search patient accounts, inspect symptom assessments and review consultation histories.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <span className="badge text-bg-secondary">{patientUsers.length} patients</span>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-xl-4">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-person-lines-fill" aria-hidden="true" />
                  <span>Registered Patients</span>
                </h2>
              </div>
            </div>

            <input
              className="form-control form-control-sm mb-3"
              type="search"
              placeholder="Search name, email or ID"
              aria-label="Search patients"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {isLoading ? (
              <p className="text-muted small mb-0">Loading patients…</p>
            ) : filteredPatients.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-person-x" aria-hidden="true" />
                <p className="mb-0">No patients found.</p>
              </div>
            ) : (
              <div className="d-grid gap-2" style={{ maxHeight: '30rem', overflowY: 'auto' }}>
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    className={`choice-tile${selectedPatient?.id === patient.id ? ' selected' : ''}`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <span className="d-inline-flex align-items-center gap-2">
                      {patient.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="avatar-img avatar-sm" src={patient.avatar_url} alt={patient.full_name} />
                      ) : (
                        <span className="avatar-initials avatar-sm">{patient.full_name.charAt(0)}</span>
                      )}
                      <span>
                        {patient.full_name}
                        <small>{patient.email}</small>
                      </span>
                    </span>
                    {patient.last_triage && (
                      <span className={`urgency-badge urgency-${patient.last_triage.urgency_level.toLowerCase()}`}>
                        {patient.last_triage.urgency_level.replace('_', ' ')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="col-12 col-xl-8">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-file-earmark-medical" aria-hidden="true" />
                  <span>Patient EHR &amp; Triage History</span>
                </h2>
              </div>
              {selectedPatient && (
                <span className="badge text-bg-success">
                  {selectedPatient.appointment_count} appointment
                  {selectedPatient.appointment_count === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {selectedPatient ? (
              <>
                <div className="info-list">
                  <div>
                    <span>Patient</span>
                    <strong>{selectedPatient.full_name}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{selectedPatient.email}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{selectedPatient.phone || '—'}</strong>
                  </div>
                  <div>
                    <span>Registered</span>
                    <strong>{new Date(selectedPatient.created_at).toLocaleDateString()}</strong>
                  </div>
                </div>

                <h3 className="h6 mt-4 mb-3">Auto-triage submissions &amp; severity logs</h3>

                {isLoadingTriage ? (
                  <p className="text-muted small mb-0">Loading triage history…</p>
                ) : triageRecords.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-clipboard2-x" aria-hidden="true" />
                    <p className="mb-0">No triage assessments submitted by this patient yet.</p>
                  </div>
                ) : (
                  <div className="d-grid gap-2">
                    {triageRecords.map((triage) => (
                      <article className="mini-card" key={triage.id}>
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                          <strong>{triage.primary_symptom}</strong>
                          <span className={`urgency-badge urgency-${triage.urgency_level.toLowerCase()}`}>
                            {triage.urgency_level.replace('_', ' ')} · {triage.severity_score}/100
                          </span>
                        </div>
                        <span>{triage.triage_summary}</span>
                        <span>
                          Recommended specialty: <strong>{triage.recommended_specialty}</strong> · evaluated{' '}
                          {new Date(triage.created_at).toLocaleDateString()}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <i className="bi bi-cursor" aria-hidden="true" />
                <p className="mb-0">Select a patient to view their EHR records and triage history.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
