'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { TriageAssessment } from '@/lib/types';
import { AuthGuard } from '@/components/auth/auth-guard';
import { getTriages } from '@/lib/api';

export default function DoctorPendingWorksPage() {
  return (
    <AuthGuard allowedRoles={['DOCTOR']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading pending works…</p>
            </div>
          </div>
        }
      >
        <PendingWorksContent />
      </Suspense>
    </AuthGuard>
  );
}

function PendingWorksContent() {
  const [triageRecords, setTriageRecords] = useState<TriageAssessment[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TriageAssessment | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getTriages()
      .then(setTriageRecords)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load triage queue'))
      .finally(() => setIsLoading(false));
  }, []);

  const pendingRecords = triageRecords.filter(
    (t) => t.urgency_level === 'EMERGENCY' || t.urgency_level === 'URGENT'
  );

  const handleSaveNotes = () => {
    if (!selectedRecord) return;
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-hourglass-split" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Clinical Portal</p>
            <h1 className="h3 mb-1">Works Pending: Triage Queue</h1>
            <p className="text-muted mb-0">High-urgency patient cases awaiting clinical evaluation.</p>
          </div>
        </div>
        <div className="heading-actions">
          <span className="badge text-bg-warning">{pendingRecords.length} pending</span>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-list-check" aria-hidden="true" />
                  <span>Pending Patient Records</span>
                </h2>
                <p className="text-muted mb-0">EMERGENCY and URGENT assessments only.</p>
              </div>
            </div>

            {isLoading ? (
              <p className="text-muted small mb-0">Loading triage queue…</p>
            ) : pendingRecords.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-check2-all" aria-hidden="true" />
                <p className="mb-0">No urgent or emergency triage cases awaiting evaluation.</p>
              </div>
            ) : (
              <div className="d-grid gap-2">
                {pendingRecords.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    className={`choice-tile flex-column align-items-stretch${
                      selectedRecord?.id === rec.id ? ' selected' : ''
                    }`}
                    onClick={() => {
                      setSelectedRecord(rec);
                      setDoctorNotes(rec.triage_summary);
                    }}
                  >
                    <span className="d-flex align-items-center justify-content-between w-100 gap-2">
                      <span>{rec.primary_symptom}</span>
                      <span className={`urgency-badge urgency-${rec.urgency_level.toLowerCase()}`}>
                        {rec.urgency_level.replace('_', ' ')} · {rec.severity_score}
                      </span>
                    </span>
                    <span className="w-100">
                      <small>{rec.triage_summary}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="col-12 col-xl-6">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-file-earmark-medical" aria-hidden="true" />
                  <span>Clinical Evaluation Notes</span>
                </h2>
              </div>
            </div>

            {selectedRecord ? (
              <>
                <div className="info-list">
                  <div>
                    <span>Primary symptom</span>
                    <strong>{selectedRecord.primary_symptom}</strong>
                  </div>
                  <div>
                    <span>Severity score</span>
                    <strong>{selectedRecord.severity_score} / 100</strong>
                  </div>
                  <div>
                    <span>Recommended specialty</span>
                    <strong>{selectedRecord.recommended_specialty}</strong>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="form-label" htmlFor="evaluationNotes">
                    Assessment &amp; prescription guidance
                  </label>
                  <textarea
                    className="form-control"
                    id="evaluationNotes"
                    rows={7}
                    placeholder="Enter clinical assessment and prescription guidance…"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                  />
                </div>

                {isSaved && (
                  <div className="alert alert-success d-flex align-items-center gap-2 mt-3" role="status">
                    <i className="bi bi-check2-circle" aria-hidden="true" />
                    <span className="small">Clinical note saved.</span>
                  </div>
                )}

                <button className="btn btn-primary w-100 mt-3" type="button" onClick={handleSaveNotes}>
                  <i className="bi bi-save" aria-hidden="true" /> Save Clinical Evaluation
                </button>
              </>
            ) : (
              <div className="empty-state">
                <i className="bi bi-cursor" aria-hidden="true" />
                <p className="mb-0">Select a pending triage record to begin evaluation.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
