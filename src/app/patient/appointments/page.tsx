'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Appointment } from '@/lib/types';
import { DoctorBookingModal } from '@/components/booking/doctor-booking-modal';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getAppointments, updateAppointment } from '@/lib/api';
import { scheduleAppointmentReminders } from '@/lib/notifications';
import { TelehealthVideoRoom } from '@/components/video/telehealth-video-room';

export default function PatientAppointmentsPage() {
  return (
    <AuthGuard allowedRoles={['PATIENT']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading appointments…</p>
            </div>
          </div>
        }
      >
        <PatientAppointmentsContent />
      </Suspense>
    </AuthGuard>
  );
}

function PatientAppointmentsContent() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [activeVideoApp, setActiveVideoApp] = useState<Appointment | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchAppointments = () => {
    if (!user) return;
    setIsLoading(true);
    getAppointments({ patient_id: user.id })
      .then(setAppointments)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load appointments'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleBookingSuccess = (newOrUpdatedApp: Appointment) => {
    scheduleAppointmentReminders(newOrUpdatedApp);
    if (appointmentToReschedule) {
      setAppointments((list) => list.map((a) => (a.id === newOrUpdatedApp.id ? newOrUpdatedApp : a)));
      setActionMessage('Appointment rescheduled successfully. Reminders updated for your new date & time.');
    } else {
      setAppointments((list) => [newOrUpdatedApp, ...list]);
      setActionMessage('Appointment confirmed. 24-hour and 30-minute email reminders scheduled.');
    }
    setAppointmentToReschedule(null);
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleCancelAppointment = async (appId: string) => {
    const previous = appointments;
    setAppointments((list) => list.map((a) => (a.id === appId ? { ...a, status: 'CANCELLED' } : a)));
    try {
      await updateAppointment(appId, { status: 'CANCELLED', updated_by: user?.email || 'patient' });
      setActionMessage('Appointment cancelled. Simulated refund logged in the payment system.');
    } catch {
      setAppointments(previous);
      setActionMessage('Could not cancel the appointment. Please try again.');
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleReschedule = (app: Appointment) => {
    setAppointmentToReschedule(app);
    setIsBookingModalOpen(true);
  };

  const handleOpenNewBooking = () => {
    setAppointmentToReschedule(null);
    setIsBookingModalOpen(true);
  };

  const confirmedApps = appointments.filter((a) => a.status === 'CONFIRMED');
  const pastApps = appointments.filter((a) => a.status !== 'CONFIRMED');

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-calendar2-week" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Consultation Schedule</p>
            <h1 className="h3 mb-1">My Booked Appointments</h1>
            <p className="text-muted mb-0">
              Upcoming telehealth consultations, slot management and reminder dispatch status.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary btn-sm" type="button" onClick={handleOpenNewBooking}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> Book New Slot
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="alert alert-success d-flex align-items-center gap-2" role="status">
          <i className="bi bi-check2-circle" aria-hidden="true" />
          <span className="small">{actionMessage}</span>
        </div>
      )}

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
              <i className="bi bi-calendar2-check" aria-hidden="true" />
              <span>Incoming Confirmed Appointments</span>
            </h2>
            <p className="text-muted mb-0">Consultations that are paid for and locked in.</p>
          </div>
          <span className="badge text-bg-success">{confirmedApps.length} confirmed</span>
        </div>

        {isLoading ? (
          <p className="text-muted small mb-0">Loading your appointments…</p>
        ) : confirmedApps.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-calendar2-x" aria-hidden="true" />
            <p className="mb-2">You have no active upcoming appointments.</p>
            <button className="btn btn-light btn-sm" type="button" onClick={handleOpenNewBooking}>
              <i className="bi bi-plus-lg" aria-hidden="true" /> Book Appointment Slot
            </button>
          </div>
        ) : (
          <div className="row g-3">
            {confirmedApps.map((app) => (
              <div className="col-12 col-xl-6" key={app.id}>
                <article className="panel panel-accent accent-success h-100">
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                    <div>
                      <h3 className="h6 mb-1">{app.doctor_name}</h3>
                      <p className="eyebrow mb-0">{app.doctor_specialty}</p>
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
                        Consultation fee
                      </span>
                      <strong>
                        GH₵ {app.payment_amount.toFixed(2)}{' '}
                        <span className="badge text-bg-secondary">{app.payment_status}</span>
                      </strong>
                    </div>
                  </div>

                  <div className="mini-card mt-3">
                    <span>
                      <i className="bi bi-envelope-paper me-1" aria-hidden="true" />
                      Automated email reminders
                    </span>
                    <ul className="list-unstyled mb-0 small">
                      <li className="d-flex align-items-center gap-2">
                        <i className="bi bi-check2-circle text-success" aria-hidden="true" />
                        24-hour prior email — scheduled one day before the consultation
                      </li>
                      <li className="d-flex align-items-center gap-2">
                        <i className="bi bi-check2-circle text-success" aria-hidden="true" />
                        30-minute prior email — scheduled before the room opens
                      </li>
                    </ul>
                  </div>

                  <div className="d-flex flex-wrap justify-content-end gap-2 mt-3">
                    <button
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                      type="button"
                      onClick={() => setActiveVideoApp(app)}
                    >
                      <i className="bi bi-camera-video" aria-hidden="true" /> Join Live Video Room
                    </button>
                    <button className="btn btn-light btn-sm" type="button" onClick={() => handleReschedule(app)}>
                      <i className="bi bi-arrow-repeat" aria-hidden="true" /> Reschedule
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      type="button"
                      onClick={() => handleCancelAppointment(app.id)}
                    >
                      <i className="bi bi-x-circle" aria-hidden="true" /> Cancel &amp; Refund
                    </button>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </section>

      {pastApps.length > 0 && (
        <section className="panel mt-3">
          <div className="panel-header">
            <div>
              <h2 className="h5 mb-1 section-title">
                <i className="bi bi-clock-history" aria-hidden="true" />
                <span>Past &amp; Cancelled Appointments</span>
              </h2>
            </div>
            <span className="badge text-bg-secondary">{pastApps.length} records</span>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Doctor</th>
                  <th scope="col">Specialty</th>
                  <th scope="col">Date</th>
                  <th scope="col">Time</th>
                  <th scope="col" className="text-end">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pastApps.map((app) => (
                  <tr key={app.id}>
                    <td className="fw-semibold">{app.doctor_name}</td>
                    <td>{app.doctor_specialty}</td>
                    <td>{app.appointment_date}</td>
                    <td>{app.start_time}</td>
                    <td className="text-end">
                      <span className={`badge ${app.status === 'COMPLETED' ? 'text-bg-info' : 'text-bg-danger'}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isBookingModalOpen && (
        <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-label="Book an appointment">
          <div className="app-modal app-modal-lg">
            <DoctorBookingModal
              appointmentToReschedule={appointmentToReschedule}
              onClose={() => {
                setIsBookingModalOpen(false);
                setAppointmentToReschedule(null);
              }}
              onBookingSuccess={handleBookingSuccess}
            />
          </div>
        </div>
      )}

      {activeVideoApp && (
        <TelehealthVideoRoom
          appointment={activeVideoApp}
          isDoctor={false}
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
