'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Appointment } from '@/lib/types';
import { DoctorBookingModal } from '@/components/booking/doctor-booking-modal';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getActiveRooms, getAppointments, updateAppointment } from '@/lib/api';
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
  const [doctorsInRoom, setDoctorsInRoom] = useState<string[]>([]);
  const [openNotesId, setOpenNotesId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchAppointments = (showSpinner = true) => {
    if (!user) return;
    if (showSpinner) setIsLoading(true);
    getAppointments({ patient_id: user.id })
      .then(setAppointments)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load appointments'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  // Keep the list fresh so a consultation the doctor just signed off shows as
  // COMPLETED without the patient reloading the page.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => fetchAppointments(false), 15000);
    const onFocus = () => fetchAppointments(false);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  // Server-side room presence: works even when the doctor is on another device.
  useEffect(() => {
    const joinableIds = appointments
      .filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING_PAYMENT')
      .map((a) => a.id);
    if (joinableIds.length === 0) {
      setDoctorsInRoom([]);
      return;
    }

    let cancelled = false;
    const poll = () => {
      getActiveRooms(joinableIds)
        .then((rooms) => {
          if (cancelled) return;
          setDoctorsInRoom(rooms.filter((r) => r.doctor_present).map((r) => r.appointment_id));
        })
        .catch(() => undefined);
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [appointments]);

  const handleBookingSuccess = (newOrUpdatedApp: Appointment) => {
    void scheduleAppointmentReminders(newOrUpdatedApp);
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
    if (!confirm('Are you sure you want to cancel this appointment? Full refund will be credited.')) return;
    try {
      await updateAppointment(appId, { status: 'CANCELLED', payment_status: 'FAILED' });
      setAppointments((list) =>
        list.map((a) => (a.id === appId ? { ...a, status: 'CANCELLED', payment_status: 'FAILED' } : a))
      );
      setActionMessage('Appointment cancelled and refund processed.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel appointment');
    }
  };

  const handleReschedule = (app: Appointment) => {
    setAppointmentToReschedule(app);
    setIsBookingModalOpen(true);
  };

  const confirmedApps = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING_PAYMENT');
  const pastApps = appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'CANCELLED');

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-calendar-check" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Patient Portal</p>
            <h1 className="h3 mb-1">My Scheduled Appointments</h1>
            <p className="text-muted mb-0">Manage confirmed consultations, join video calls, or reschedule.</p>
          </div>
        </div>
        <div className="heading-actions">
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            type="button"
            onClick={() => {
              setAppointmentToReschedule(null);
              setIsBookingModalOpen(true);
            }}
          >
            <i className="bi bi-plus-lg" aria-hidden="true" /> Book New Specialist
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="alert alert-success d-flex align-items-center justify-content-between p-3 mb-3" role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill" aria-hidden="true" />
            <span>{actionMessage}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setActionMessage(null)} aria-label="Close" />
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
              <i className="bi bi-clock-history" aria-hidden="true" />
              <span>Upcoming &amp; Confirmed Sessions</span>
            </h2>
          </div>
          <span className="badge text-bg-success">{confirmedApps.length} upcoming</span>
        </div>

        {isLoading ? (
          <div className="blank-state py-4">
            <i className="bi bi-hourglass-split" aria-hidden="true" />
            <p className="text-muted mb-0">Loading appointments…</p>
          </div>
        ) : confirmedApps.length === 0 ? (
          <div className="blank-state py-4">
            <i className="bi bi-calendar-x" aria-hidden="true" />
            <p className="text-muted mb-2">No upcoming appointments scheduled.</p>
            <button
              className="btn btn-outline-primary btn-sm"
              type="button"
              onClick={() => {
                setAppointmentToReschedule(null);
                setIsBookingModalOpen(true);
              }}
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="row g-3">
            {confirmedApps.map((app) => {
              const isVideo = app.id.charCodeAt(app.id.length - 1) % 2 === 0;
              const isDoctorInRoom = doctorsInRoom.includes(app.id);

              return (
                <div className="col-12 col-xl-6" key={app.id}>
                  <article className={`panel panel-accent ${isVideo ? 'accent-info' : 'accent-primary'} h-100`}>
                    <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                      <div>
                        <h3 className="h6 mb-1">{app.doctor_name}</h3>
                        <p className="eyebrow mb-0">{app.doctor_specialty}</p>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        <span className={`badge ${isVideo ? 'text-bg-info' : 'text-bg-secondary'}`}>
                          <i className={`bi ${isVideo ? 'bi-camera-video' : 'bi-building'} me-1`} />
                          {isVideo ? 'Telehealth Video' : 'In-Person Clinic'}
                        </span>
                        <span className="badge text-bg-success">{app.status}</span>
                      </div>
                    </div>

                    {isDoctorInRoom && (
                      <div className="alert text-bg-success p-2.5 rounded-3 mt-3 mb-2 border-0 d-flex flex-wrap align-items-center justify-content-between gap-2 shadow-sm">
                        <div className="d-flex align-items-center gap-2">
                          <span className="spinner-grow spinner-grow-sm text-light" role="status" aria-hidden="true" />
                          <div>
                            <strong className="d-block text-white" style={{ fontSize: '13px' }}>
                              🟢 Doctor is in the Live Video Room!
                            </strong>
                            <small className="text-white-50" style={{ fontSize: '11px' }}>
                              Dr. {app.doctor_name} has launched your video consultation.
                            </small>
                          </div>
                        </div>
                        <button
                          className="btn btn-light btn-sm fw-bold text-success"
                          type="button"
                          onClick={() => setActiveVideoApp(app)}
                        >
                          <i className="bi bi-camera-video me-1" /> Join Call Now
                        </button>
                      </div>
                    )}

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
                      {isVideo && (
                        <button
                          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                          type="button"
                          onClick={() => setActiveVideoApp(app)}
                        >
                          <i className="bi bi-camera-video" aria-hidden="true" /> Join Live Video Room
                        </button>
                      )}
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
              );
            })}
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
                  <React.Fragment key={app.id}>
                    <tr>
                      <td className="fw-semibold">{app.doctor_name}</td>
                      <td>{app.doctor_specialty}</td>
                      <td>{app.appointment_date}</td>
                      <td>{app.start_time}</td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          {app.status === 'COMPLETED' && app.notes && (
                            <button
                              className="btn btn-link btn-sm p-0 text-decoration-none"
                              type="button"
                              onClick={() => setOpenNotesId(openNotesId === app.id ? null : app.id)}
                              aria-expanded={openNotesId === app.id}
                            >
                              <i className={`bi ${openNotesId === app.id ? 'bi-chevron-up' : 'bi-journal-text'} me-1`} />
                              {openNotesId === app.id ? 'Hide notes' : 'Consultation notes'}
                            </button>
                          )}
                          <span className={`badge ${app.status === 'COMPLETED' ? 'text-bg-info' : 'text-bg-danger'}`}>
                            {app.status === 'COMPLETED' ? 'COMPLETED ✓' : app.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {openNotesId === app.id && app.notes && (
                      <tr>
                        <td colSpan={5} className="bg-light">
                          <div className="p-2">
                            <strong className="small d-block mb-1">
                              <i className="bi bi-clipboard2-pulse me-1" />
                              Clinical notes from {app.doctor_name}
                            </strong>
                            <pre className="small mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                              {app.notes}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
          onClose={() => {
            setActiveVideoApp(null);
            fetchAppointments(false);
          }}
          onConsultationCompleted={() => {
            setActiveVideoApp(null);
            fetchAppointments(false);
            setActionMessage('Your consultation is complete. The doctor’s clinical notes are in your appointment history below.');
            setTimeout(() => setActionMessage(null), 8000);
          }}
        />
      )}
    </>
  );
}
