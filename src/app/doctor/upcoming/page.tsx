'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Appointment } from '@/lib/types';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getAppointments } from '@/lib/api';
import { TelehealthVideoRoom } from '@/components/video/telehealth-video-room';

export default function DoctorUpcomingWorksPage() {
  return (
    <AuthGuard allowedRoles={['DOCTOR']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading upcoming consultations…</p>
            </div>
          </div>
        }
      >
        <UpcomingWorksContent />
      </Suspense>
    </AuthGuard>
  );
}

function UpcomingWorksContent() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeVideoApp, setActiveVideoApp] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchAppointments = () => {
    if (!user) return;
    setIsLoading(true);
    getAppointments({ doctor_user_id: user.id, status: 'CONFIRMED' })
      .then(setAppointments)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load consultations'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-calendar-event" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Clinical Portal</p>
            <h1 className="h3 mb-1">Upcoming Scheduled Consultations</h1>
            <p className="text-muted mb-0">Confirmed patient appointment slots for today and the days ahead.</p>
          </div>
        </div>
        <div className="heading-actions">
          <span className="badge text-bg-success">{appointments.length} confirmed</span>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="panel blank-panel">
          <div className="blank-state">
            <i className="bi bi-hourglass-split" aria-hidden="true" />
            <p className="text-muted mb-0">Loading confirmed consultations…</p>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="panel blank-panel">
          <div className="blank-state">
            <i className="bi bi-calendar2-x" aria-hidden="true" />
            <p className="text-muted mb-0">No confirmed consultations scheduled.</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {appointments.map((app) => (
            <div className="col-12 col-xl-6" key={app.id}>
              <article className="panel panel-accent accent-success h-100">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                  <div>
                    <h2 className="h6 mb-1">{app.patient_name}</h2>
                    <p className="eyebrow mb-0">{app.doctor_specialty} consultation</p>
                  </div>
                  <span className="badge text-bg-success">{app.status}</span>
                </div>

                <div className="info-list mt-3">
                  <div>
                    <span>
                      <i className="bi bi-calendar3 me-1" aria-hidden="true" />
                      Date
                    </span>
                    <strong>{app.appointment_date}</strong>
                  </div>
                  <div>
                    <span>
                      <i className="bi bi-clock me-1" aria-hidden="true" />
                      Time slot
                    </span>
                    <strong>
                      {app.start_time} – {app.end_time}
                    </strong>
                  </div>
                  <div>
                    <span>
                      <i className="bi bi-credit-card me-1" aria-hidden="true" />
                      Fee
                    </span>
                    <strong>
                      GH₵ {app.payment_amount.toFixed(2)}{' '}
                      <span className="badge text-bg-secondary">{app.payment_status}</span>
                    </strong>
                  </div>
                </div>

                <button
                  className="btn btn-primary w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
                  type="button"
                  onClick={() => setActiveVideoApp(app)}
                >
                  <i className="bi bi-camera-video" aria-hidden="true" />
                  <span>Launch Telehealth Video Room</span>
                </button>
              </article>
            </div>
          ))}
        </div>
      )}

      {activeVideoApp && (
        <TelehealthVideoRoom
          appointment={activeVideoApp}
          isDoctor
          onClose={() => setActiveVideoApp(null)}
          onConsultationCompleted={() => {
            setActiveVideoApp(null);
            fetchAppointments();
          }}
        />
      )}
    </>
  );
}
