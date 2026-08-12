'use client';

import React, { Suspense } from 'react';
import { TriageWizard } from '@/components/triage/triage-wizard';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function TriagePage() {
  return (
    <AuthGuard>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-activity" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Clinical Intake</p>
            <h1 className="h3 mb-1">Symptom Urgency Auto-Triage</h1>
            <p className="text-muted mb-0">
              A four-step rule-engine assessment that classifies your urgency and recommends a specialty.
            </p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading triage wizard…</p>
            </div>
          </div>
        }
      >
        <TriageWizard />
      </Suspense>
    </AuthGuard>
  );
}
