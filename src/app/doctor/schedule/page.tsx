'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getAppointments, getDoctorSchedule, saveDoctorSchedule } from '@/lib/api';
import { Appointment } from '@/lib/types';
import { DAY_NAMES, DerivedSlot, WeeklyAvailability } from '@/lib/schedule';

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

const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/** One editable row per weekday, seeded from whatever is already in the database. */
function toWeekRows(availability: WeeklyAvailability[]): WeeklyAvailability[] {
  return DAY_NAMES.map((_, day) => {
    const existing = availability.find((a) => a.day_of_week === day);
    return (
      existing || {
        day_of_week: day,
        start_time: '09:00',
        end_time: '17:00',
        slot_duration_mins: 30,
        is_active: false,
      }
    );
  });
}

function ScheduleManagerContent() {
  const { user } = useAuth();

  const [week, setWeek] = useState<WeeklyAvailability[]>(toWeekRows([]));
  const [previewDate, setPreviewDate] = useState(todayIso());
  const [slots, setSlots] = useState<DerivedSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Appointment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  const loadSchedule = useCallback(
    async (date: string) => {
      if (!user) return;
      try {
        const data = await getDoctorSchedule(user.id, date);
        setWeek(toWeekRows(data.availability || []));
        setSlots(data.slots || []);
        setLoadError('');
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load your schedule');
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    Promise.all([
      loadSchedule(previewDate),
      getAppointments({ doctor_user_id: user.id })
        .then((apps) => setBookedSlots(apps.filter((a) => a.status !== 'CANCELLED')))
        .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load booked slots')),
    ]).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Re-derive the preview whenever the doctor looks at a different day.
  useEffect(() => {
    if (!user || isLoading) return;
    void loadSchedule(previewDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDate]);

  const updateDay = (day: number, patch: Partial<WeeklyAvailability>) =>
    setWeek((rows) => rows.map((row) => (row.day_of_week === day ? { ...row, ...patch } : row)));

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSuccessMsg(null);
    setLoadError('');
    try {
      // Inactive days are still sent so the doctor can re-enable them later
      // with the hours they last used.
      await saveDoctorSchedule(user.id, week);
      await loadSchedule(previewDate);
      setSuccessMsg('Availability saved. Patients booking with you now see exactly these slots.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to save your availability');
    } finally {
      setIsSaving(false);
    }
  };

  const activeDays = week.filter((d) => d.is_active).length;

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
              Set the hours you consult on each weekday. Patients booking with you only ever see slots generated from
              this.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary btn-sm" type="button" onClick={handleSave} disabled={isSaving || isLoading}>
            <i className={`bi ${isSaving ? 'bi-arrow-repeat spin' : 'bi-save'}`} aria-hidden="true" />{' '}
            {isSaving ? 'Saving…' : 'Save availability'}
          </button>
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
        {/* ── Weekly availability, persisted to doctor_schedules ─────────────── */}
        <div className="col-12 col-xl-7">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-calendar-week" aria-hidden="true" />
                  <span>Weekly Consulting Hours</span>
                </h2>
                <p className="text-muted mb-0">Stored in the database and used to generate every bookable slot.</p>
              </div>
              <span className="badge text-bg-secondary">{activeDays} active day(s)</span>
            </div>

            {isLoading ? (
              <p className="text-muted small mb-0">Loading your availability…</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '34%' }}>Day</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Slot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {week.map((row) => (
                      <tr key={row.day_of_week} className={row.is_active ? '' : 'opacity-50'}>
                        <td>
                          <div className="form-check mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`day-${row.day_of_week}`}
                              checked={row.is_active}
                              onChange={(e) => updateDay(row.day_of_week, { is_active: e.target.checked })}
                            />
                            <label className="form-check-label fw-semibold" htmlFor={`day-${row.day_of_week}`}>
                              {DAY_NAMES[row.day_of_week]}
                            </label>
                          </div>
                        </td>
                        <td>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={row.start_time}
                            disabled={!row.is_active}
                            onChange={(e) => updateDay(row.day_of_week, { start_time: e.target.value })}
                            aria-label={`${DAY_NAMES[row.day_of_week]} start time`}
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={row.end_time}
                            disabled={!row.is_active}
                            onChange={(e) => updateDay(row.day_of_week, { end_time: e.target.value })}
                            aria-label={`${DAY_NAMES[row.day_of_week]} end time`}
                          />
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={row.slot_duration_mins}
                            disabled={!row.is_active}
                            onChange={(e) => updateDay(row.day_of_week, { slot_duration_mins: Number(e.target.value) })}
                            aria-label={`${DAY_NAMES[row.day_of_week]} slot length`}
                          >
                            {[15, 20, 30, 45, 60].map((mins) => (
                              <option key={mins} value={mins}>
                                {mins} min
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* ── Generated slots for one date ───────────────────────────────────── */}
        <div className="col-12 col-xl-5">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-clock-history" aria-hidden="true" />
                  <span>Slots On A Given Day</span>
                </h2>
                <p className="text-muted mb-0">Exactly what the patient sees when booking.</p>
              </div>
              <input
                type="date"
                className="form-control form-control-sm"
                style={{ maxWidth: '170px' }}
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                aria-label="Preview date"
              />
            </div>

            {slots.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-calendar2-x" aria-hidden="true" />
                <p className="mb-0">
                  No consulting hours set for {DAY_NAMES[new Date(`${previewDate}T00:00:00`).getDay()]}. Tick that day on
                  the left and save.
                </p>
              </div>
            ) : (
              <div className="d-grid gap-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {slots.map((slot) => (
                  <div className="settings-row" key={slot.start_time}>
                    <span>
                      <strong>
                        {slot.start_time} – {slot.end_time}
                      </strong>
                      <small>{slot.available ? 'Open for booking' : `Booked · ${slot.booked_by}`}</small>
                    </span>
                    <span className={`badge ${slot.available ? 'text-bg-success' : 'text-bg-info'}`}>
                      {slot.available ? 'AVAILABLE' : slot.status || 'BOOKED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Every booking on the doctor's calendar ─────────────────────────── */}
        <div className="col-12">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-calendar2-check" aria-hidden="true" />
                  <span>Booked Consultation Slots</span>
                </h2>
                <p className="text-muted mb-0">Every confirmed and pending appointment, live from the database.</p>
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
              <div className="row g-2">
                {bookedSlots.map((app) => (
                  <div className="col-12 col-md-6 col-xl-4" key={app.id}>
                    <div className="settings-row">
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
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
