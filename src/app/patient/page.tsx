'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Appointment, TriageAssessment } from '@/lib/types';
import { DoctorBookingModal } from '@/components/booking/doctor-booking-modal';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getAppointments, getTriages, updateAppointment } from '@/lib/api';

const statusBadge = (status: string) =>
  status === 'CONFIRMED'
    ? 'text-bg-success'
    : status === 'CANCELLED'
      ? 'text-bg-danger'
      : status === 'COMPLETED'
        ? 'text-bg-info'
        : 'text-bg-warning';

export default function PatientDashboard() {
  return (
    <AuthGuard allowedRoles={['PATIENT']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading patient portal…</p>
            </div>
          </div>
        }
      >
        <PatientDashboardContent />
      </Suspense>
    </AuthGuard>
  );
}

function PatientDashboardContent() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [triageHistory, setTriageHistory] = useState<TriageAssessment[]>([]);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([getAppointments({ patient_id: user.id }), getTriages(user.id)])
      .then(([apps, triages]) => {
        setAppointments(apps);
        setTriageHistory(triages);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load your records'))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleBookingSuccess = (newOrUpdatedApp: Appointment) => {
    if (appointmentToReschedule) {
      setAppointments((list) =>
        list.map((a) => (a.id === newOrUpdatedApp.id ? newOrUpdatedApp : a))
      );
      setActionMessage(
        `Appointment with ${newOrUpdatedApp.doctor_name} successfully rescheduled to ${newOrUpdatedApp.appointment_date} at ${newOrUpdatedApp.start_time}.`
      );
    } else {
      setAppointments((list) => [newOrUpdatedApp, ...list]);
      setActionMessage(`Appointment booked with ${newOrUpdatedApp.doctor_name} for ${newOrUpdatedApp.appointment_date}.`);
    }
    setAppointmentToReschedule(null);
    setIsBookingModalOpen(false);
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleCancelAppointment = async (appId: string) => {
    const previous = appointments;
    setAppointments((list) => list.map((a) => (a.id === appId ? { ...a, status: 'CANCELLED' } : a)));
    try {
      await updateAppointment(appId, { status: 'CANCELLED', updated_by: user?.email || 'patient' });
      setActionMessage('Appointment cancelled. Simulated consultation fee refund recorded.');
    } catch {
      setAppointments(previous);
      setActionMessage('Could not cancel the appointment. Please try again.');
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRescheduleAppointment = (app: Appointment) => {
    setAppointmentToReschedule(app);
    setIsBookingModalOpen(true);
  };

  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const paidTotal = appointments.reduce(
    (sum, a) => sum + (a.payment_status === 'SIMULATED_SUCCESS' ? a.payment_amount : 0),
    0
  );

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-person-heart" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Patient Portal</p>
            <h1 className="h3 mb-1">Welcome, {user?.full_name || 'Patient'}</h1>
            <p className="text-muted mb-0">
              Run symptom triage, book specialist slots and review your consultation history.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <Link className="btn btn-primary btn-sm" href="/triage">
            <i className="bi bi-activity" aria-hidden="true" /> Start New Triage
          </Link>
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setIsBookingModalOpen(true)}>
            <i className="bi bi-calendar2-plus" aria-hidden="true" /> Book Appointment
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="alert alert-primary d-flex align-items-center gap-2" role="status">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <span className="small">{actionMessage}</span>
        </div>
      )}

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      <section className="row g-3" aria-label="Patient metrics">
        <div className="col-12 col-sm-6 col-xl-4">
          <article className="metric-card metric-primary">
            <div className="metric-top">
              <span className="metric-label">Triage Assessments</span>
              <span className="metric-icon">
                <i className="bi bi-activity" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">{triageHistory.length}</div>
            <div className="metric-meta">
              <span>Evaluated by the rule engine</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-4">
          <article className="metric-card metric-success">
            <div className="metric-top">
              <span className="metric-label">Upcoming Appointments</span>
              <span className="metric-icon">
                <i className="bi bi-calendar2-check" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">{confirmedCount}</div>
            <div className="metric-meta">
              <span>Confirmed telehealth slots</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-xl-4">
          <article className="metric-card metric-warning">
            <div className="metric-top">
              <span className="metric-label">Simulated Payments</span>
              <span className="metric-icon">
                <i className="bi bi-credit-card" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">GH₵ {paidTotal.toFixed(2)}</div>
            <div className="metric-meta">
              <span>Mobile Money / card simulation</span>
            </div>
          </article>
        </div>
      </section>

      <div className="row g-3 mt-1">
        {/* Triage history */}
        <div className="col-12 col-xl-6">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-activity" aria-hidden="true" />
                  <span>Auto-Triage History</span>
                </h2>
                <p className="text-muted mb-0">Every assessment the rule engine has recorded for you.</p>
              </div>
              <Link className="btn btn-light btn-sm" href="/triage">
                New Check
              </Link>
            </div>

            {isLoading ? (
              <p className="text-muted small mb-0">Loading your triage history…</p>
            ) : triageHistory.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-clipboard2-x" aria-hidden="true" />
                <p className="mb-0">No triage assessments yet. Start a symptom check to get a recommendation.</p>
              </div>
            ) : (
              <div className="activity-list">
                {triageHistory.map((triage) => (
                  <div className="activity-item" key={triage.id}>
                    <span
                      className={`activity-dot ${
                        triage.urgency_level === 'EMERGENCY'
                          ? 'bg-danger'
                          : triage.urgency_level === 'URGENT'
                            ? 'bg-warning'
                            : 'bg-success'
                      }`}
                    />
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <span className={`urgency-badge urgency-${triage.urgency_level.toLowerCase()}`}>
                          {triage.urgency_level.replace('_', ' ')} · {triage.severity_score}
                        </span>
                        <span className="text-muted small ms-auto">
                          {new Date(triage.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="fw-semibold mb-1">{triage.primary_symptom}</p>
                      <p className="text-muted small mb-1">
                        Recommended specialty: <strong>{triage.recommended_specialty}</strong>
                      </p>
                      <p className="text-muted small mb-0">{triage.action_recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Appointments */}
        <div className="col-12 col-xl-6">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-calendar2-week" aria-hidden="true" />
                  <span>Appointments &amp; Management</span>
                </h2>
                <p className="text-muted mb-0">Reschedule or cancel a confirmed consultation (FR-3.5).</p>
              </div>
              <button className="btn btn-light btn-sm" type="button" onClick={() => setIsBookingModalOpen(true)}>
                Book Slot
              </button>
            </div>

            {isLoading ? (
              <p className="text-muted small mb-0">Loading your appointments…</p>
            ) : appointments.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-calendar2-x" aria-hidden="true" />
                <p className="mb-0">No appointments scheduled.</p>
              </div>
            ) : (
              <div className="d-grid gap-3">
                {appointments.map((app) => (
                  <article className="mini-card" key={app.id}>
                    <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                      <div>
                        <strong>{app.doctor_name}</strong>
                        <span>{app.doctor_specialty}</span>
                      </div>
                      <span className={`badge ${statusBadge(app.status)}`}>{app.status}</span>
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mt-2">
                      <span>
                        <i className="bi bi-calendar3 me-1" aria-hidden="true" />
                        {app.appointment_date}
                      </span>
                      <span>
                        <i className="bi bi-clock me-1" aria-hidden="true" />
                        {app.start_time}
                      </span>
                      <span className="ms-auto fw-bold">GH₵ {app.payment_amount.toFixed(2)}</span>
                    </div>

                    {app.status === 'CONFIRMED' && (
                      <div className="d-flex flex-wrap justify-content-end gap-2 mt-2">
                        <button className="btn btn-light btn-sm" type="button" onClick={() => handleRescheduleAppointment(app)}>
                          <i className="bi bi-arrow-repeat" aria-hidden="true" /> Reschedule
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          type="button"
                          onClick={() => handleCancelAppointment(app.id)}
                        >
                          <i className="bi bi-x-circle" aria-hidden="true" /> Cancel
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {isBookingModalOpen && (
        <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-label="Book or reschedule an appointment">
          <div className="app-modal app-modal-lg">
            <DoctorBookingModal
              appointmentToReschedule={appointmentToReschedule}
              onClose={() => {
                setAppointmentToReschedule(null);
                setIsBookingModalOpen(false);
              }}
              onBookingSuccess={handleBookingSuccess}
            />
          </div>
        </div>
      )}
    </>
  );
}
