'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getAppointments } from '@/lib/api';
import { Appointment } from '@/lib/types';

export default function DoctorScheduleManagerPage() {
  return (
    <AuthGuard allowedRoles={['DOCTOR']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading schedule manager…</p>
            </div>
          </div>
        }
      >
        <ScheduleManagerContent />
      </Suspense>
    </AuthGuard>
  );
}

function ScheduleManagerContent() {
  const [slots, setSlots] = useState([
    { id: '1', date: '2026-08-13', start_time: '09:00', end_time: '09:30', is_blocked: false },
    { id: '2', date: '2026-08-13', start_time: '09:30', end_time: '10:00', is_blocked: false },
    { id: '3', date: '2026-08-13', start_time: '10:00', end_time: '10:30', is_blocked: true },
    { id: '4', date: '2026-08-13', start_time: '11:00', end_time: '11:30', is_blocked: false },
  ]);

  const [newTime, setNewTime] = useState('14:00');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Slots booked by real patients, read from the database.
  const { user } = useAuth();
  const [bookedSlots, setBookedSlots] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) return;
    getAppointments({ doctor_user_id: user.id })
      .then((apps) => setBookedSlots(apps.filter((a) => a.status !== 'CANCELLED')))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load booked slots'))
      .finally(() => setIsLoading(false));
  }, [user]);

  const toggleBlockSlot = (id: string) => {
    setSlots(slots.map((s) => (s.id === id ? { ...s, is_blocked: !s.is_blocked } : s)));
    setSuccessMsg('Slot availability updated.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddSlot = () => {
    const newSlot = {
      id: `slot-${Date.now()}`,
      date: '2026-08-13',
      start_time: newTime,
      end_time: `${parseInt(newTime.split(':')[0])}:${parseInt(newTime.split(':')[1]) + 30}`,
      is_blocked: false,
    };
    setSlots([...slots, newSlot]);
    setSuccessMsg('New 30-minute consultation slot added.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-sliders" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Availability Manager</p>
            <h1 className="h3 mb-1">Schedule Slot Manager</h1>
            <p className="text-muted mb-0">
              Configure 30-minute consultation slots and block time for emergency leave.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <div className="d-flex gap-2">
            <input
              className="form-control form-control-sm"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              aria-label="New slot start time"
            />
            <button className="btn btn-primary btn-sm" type="button" onClick={handleAddSlot}>
              <i className="bi bi-plus-lg" aria-hidden="true" /> Add Slot
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2" role="status">
          <i className="bi bi-check2-circle" aria-hidden="true" />
          <span className="small">{successMsg}</span>
        </div>
      )}

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
                  <i className="bi bi-calendar2-check" aria-hidden="true" />
                  <span>Booked Consultation Slots</span>
                </h2>
                <p className="text-muted mb-0">Live from the database.</p>
              </div>
              <span className="badge text-bg-info">{bookedSlots.length} booked</span>
            </div>

            {isLoading ? (
              <p className="text-muted small mb-0">Loading booked slots…</p>
            ) : bookedSlots.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-calendar2-x" aria-hidden="true" />
                <p className="mb-0">No patients have booked a slot with you yet.</p>
              </div>
            ) : (
              <div className="d-grid gap-2">
                {bookedSlots.map((app) => (
                  <div className="settings-row" key={app.id}>
                    <span>
                      <strong>
                        {app.start_time} – {app.end_time}
                      </strong>
                      <small>
                        {app.appointment_date} · {app.patient_name}
                      </small>
                    </span>
                    <span className="badge text-bg-info">{app.status}</span>
                  </div>
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
                  <i className="bi bi-clock-history" aria-hidden="true" />
                  <span>Configured Time Slots</span>
                </h2>
                <p className="text-muted mb-0">Block a window to take it out of circulation.</p>
              </div>
              <span className="badge text-bg-secondary">{slots.length} slots</span>
            </div>

            <div className="d-grid gap-2">
              {slots.map((s) => (
                <div className="settings-row" key={s.id}>
                  <span>
                    <strong>
                      {s.start_time} – {s.end_time}
                    </strong>
                    <small>Date: {s.date}</small>
                  </span>

                  <span className="d-inline-flex align-items-center gap-2">
                    <span className={`badge ${s.is_blocked ? 'text-bg-danger' : 'text-bg-success'}`}>
                      {s.is_blocked ? 'BLOCKED' : 'AVAILABLE'}
                    </span>
                    <button
                      className={`btn btn-sm ${s.is_blocked ? 'btn-light' : 'btn-outline-danger'}`}
                      type="button"
                      onClick={() => toggleBlockSlot(s.id)}
                    >
                      <i className={s.is_blocked ? 'bi bi-unlock' : 'bi bi-lock'} aria-hidden="true" />
                      {s.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
