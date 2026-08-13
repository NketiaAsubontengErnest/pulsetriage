'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Appointment } from '@/lib/types';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getAppointments, updateAppointment } from '@/lib/api';
import { TelehealthVideoRoom } from '@/components/video/telehealth-video-room';
import { DoctorRecordModal } from '@/components/doctor/doctor-record-modal';

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
  const [recordApp, setRecordApp] = useState<Appointment | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'VIDEO' | 'IN_PERSON'>('ALL');
  const [checkedInIds, setCheckedInIds] = useState<Record<string, string>>({});
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

  // Presence is published by the room itself (see /api/room), so the patient
  // sees "doctor is waiting" even from another device.
  const handleLaunchVideoRoom = (app: Appointment) => setActiveVideoApp(app);

  const handleCheckInPatient = async (appId: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCheckedInIds((prev) => ({ ...prev, [appId]: timeStr }));
    try {
      await updateAppointment(appId, {
        notes: `Patient checked in at OPD Clinic Desk at ${timeStr}.`,
      });
    } catch {}
  };

  const isAppointmentVideo = (app: Appointment) => {
    const charCode = app.id.charCodeAt(app.id.length - 1);
    return charCode % 2 === 0;
  };

  const filteredAppointments = appointments.filter((app) => {
    const isVideo = isAppointmentVideo(app);
    if (filterType === 'VIDEO') return isVideo;
    if (filterType === 'IN_PERSON') return !isVideo;
    return true;
  });

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
            <p className="text-muted mb-0">Confirmed Telehealth &amp; In-Person Clinic appointment slots.</p>
          </div>
        </div>
        <div className="heading-actions d-flex align-items-center gap-2">
          <span className="badge text-bg-success">{appointments.length} confirmed</span>
        </div>
      </div>

      {/* Filter Tabs: ALL, TELEHEALTH VIDEO, IN-PERSON CLINIC */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="btn-group btn-group-sm" role="group" aria-label="Filter consultation type">
          <button
            type="button"
            className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('ALL')}
          >
            All Consultations ({appointments.length})
          </button>
          <button
            type="button"
            className={`btn ${filterType === 'VIDEO' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('VIDEO')}
          >
            <i className="bi bi-camera-video me-1" /> Telehealth Video
          </button>
          <button
            type="button"
            className={`btn ${filterType === 'IN_PERSON' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('IN_PERSON')}
          >
            <i className="bi bi-building me-1" /> In-Person Clinic
          </button>
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
      ) : filteredAppointments.length === 0 ? (
        <div className="panel blank-panel">
          <div className="blank-state">
            <i className="bi bi-calendar2-x" aria-hidden="true" />
            <p className="text-muted mb-0">No consultations matching this filter.</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filteredAppointments.map((app) => {
            const isVideo = isAppointmentVideo(app);

            return (
              <div className="col-12 col-xl-6" key={app.id}>
                <article className={`panel panel-accent ${isVideo ? 'accent-info' : 'accent-primary'} h-100`}>
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                    <div>
                      <h2 className="h6 mb-1">{app.patient_name}</h2>
                      <p className="eyebrow mb-0">{app.doctor_specialty} consultation</p>
                    </div>
                    <div className="d-flex align-items-center gap-1.5">
                      <span className={`badge ${isVideo ? 'text-bg-info' : 'text-bg-secondary'}`}>
                        <i className={`bi ${isVideo ? 'bi-camera-video' : 'bi-building'} me-1`} />
                        {isVideo ? 'Telehealth Video' : 'In-Person Clinic'}
                      </span>
                      <span className="badge text-bg-success">{app.status}</span>
                    </div>
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
                        <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                        Location
                      </span>
                      <strong>
                        {isVideo ? 'Virtual Telehealth Video Room' : 'OPD Pavilion — Suite 3B'}
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

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {isVideo ? (
                      <button
                        className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                        type="button"
                        onClick={() => handleLaunchVideoRoom(app)}
                      >
                        <i className="bi bi-camera-video" aria-hidden="true" />
                        <span>Launch Telehealth Video Room</span>
                      </button>
                    ) : (
                      <div className="flex-grow-1">
                        {checkedInIds[app.id] ? (
                          <div className="alert alert-success p-2 mb-0 d-flex align-items-center justify-content-between small">
                            <span>
                              <i className="bi bi-check-circle-fill me-1" />
                              Patient Present &amp; Checked-In at {checkedInIds[app.id]}
                            </span>
                            <span className="badge text-bg-success">In Clinic</span>
                          </div>
                        ) : (
                          <button
                            className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                            type="button"
                            onClick={() => handleCheckInPatient(app.id)}
                          >
                            <i className="bi bi-person-check" aria-hidden="true" />
                            <span>Check-In Patient at Clinic Desk</span>
                          </button>
                        )}
                      </div>
                    )}
                    <button
                      className="btn btn-warning text-dark font-semibold d-flex align-items-center gap-1.5"
                      type="button"
                      onClick={() => setRecordApp(app)}
                    >
                      <i className="bi bi-journal-medical" aria-hidden="true" />
                      <span>Clinical Record Notes</span>
                    </button>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}

      {activeVideoApp && (
        <TelehealthVideoRoom
          appointment={activeVideoApp}
          isDoctor
          onClose={() => {
            setActiveVideoApp(null);
            fetchAppointments();
          }}
          onConsultationCompleted={() => {
            setActiveVideoApp(null);
            fetchAppointments();
          }}
        />
      )}

      {recordApp && (
        <DoctorRecordModal
          appointment={recordApp}
          onClose={() => setRecordApp(null)}
          onRecordSaved={() => {
            setRecordApp(null);
            fetchAppointments();
          }}
        />
      )}
    </>
  );
}
