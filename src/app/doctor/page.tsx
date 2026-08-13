'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Appointment } from '@/lib/types';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getAppointments, updateAppointment, getDoctorSchedule } from '@/lib/api';
import type { DerivedSlot } from '@/lib/schedule';

/** Local calendar date, so "today" matches the doctor's clock rather than UTC. */
const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const QUICK_LINKS = [
  { href: '/doctor/pending', icon: 'bi-hourglass-split', title: 'Works Pending', copy: 'Pending triage cases' },
  { href: '/doctor/upcoming', icon: 'bi-calendar-event', title: 'Upcoming Works', copy: 'Scheduled consultations' },
  { href: '/doctor/works-done', icon: 'bi-clipboard2-check', title: 'Work Done', copy: 'Summary & metrics' },
  { href: '/doctor/completed', icon: 'bi-check2-circle', title: 'Already Completed', copy: 'Signed medical archives' },
  { href: '/doctor/schedule', icon: 'bi-sliders', title: 'Schedule Manager', copy: 'Manage time slots' },
];

const urgencyClass = (urgency?: string | null) => `urgency-${(urgency || 'ROUTINE').toLowerCase()}`;

export default function DoctorDashboard() {
  return (
    <AuthGuard allowedRoles={['DOCTOR']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading doctor portal…</p>
            </div>
          </div>
        }
      >
        <DoctorDashboardContent />
      </Suspense>
    </AuthGuard>
  );
}

function DoctorDashboardContent() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) return;
    getAppointments({ doctor_user_id: user.id })
      .then((apps) => {
        setAppointments(apps);
        setSelectedApp(apps[0] || null);
        setClinicalNotes(apps[0]?.notes || '');
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load queue'))
      .finally(() => setIsLoading(false));
  }, [user]);

  // Today's slots, generated from the consulting hours the doctor saved in the
  // Schedule Slot Manager. This panel used to show six invented rows whose
  // Block/Add buttons only moved React state around.
  const [slots, setSlots] = useState<DerivedSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const today = todayIso();

  useEffect(() => {
    if (!user) return;
    getDoctorSchedule(user.id, today)
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [user, today]);

  // Urgency Tier Sorting (EMERGENCY red flag at top)
  const sortedQueue = [...appointments].sort((a, b) => {
    const scoreMap: Record<string, number> = { EMERGENCY: 4, URGENT: 3, SEMI_URGENT: 2, ROUTINE: 1 };
    return (scoreMap[b.triage_urgency || 'ROUTINE'] || 1) - (scoreMap[a.triage_urgency || 'ROUTINE'] || 1);
  });

  const handleSaveNotes = async () => {
    if (!selectedApp) return;

    setIsSaving(true);
    setSaveError('');
    try {
      await updateAppointment(selectedApp.id, {
        status: 'COMPLETED',
        notes: clinicalNotes,
        updated_by: user?.email || 'doctor',
      });

      setAppointments((list) =>
        list.map((a) => (a.id === selectedApp.id ? { ...a, status: 'COMPLETED', notes: clinicalNotes } : a))
      );
      setSelectedApp((current) => (current ? { ...current, status: 'COMPLETED', notes: clinicalNotes } : current));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save clinical notes');
    } finally {
      setIsSaving(false);
    }
  };

  const emergencyCount = sortedQueue.filter((a) => a.triage_urgency === 'EMERGENCY').length;

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-clipboard2-pulse" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Clinical Portal</p>
            <h1 className="h3 mb-1">{user?.full_name || 'Doctor'} Workspace</h1>
            <p className="text-muted mb-0">
              Outpatient queue sorted by auto-triage severity. Record clinical notes and manage slot availability.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <div className="stat-inline">
            <div>
              <span>Total queue</span>
              <strong>{sortedQueue.length}</strong>
            </div>
            <div>
              <span>Emergency flagged</span>
              <strong className="text-danger">{emergencyCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      <section className="row g-3" aria-label="Workspace shortcuts">
        {QUICK_LINKS.map((link) => (
          <div className="col-6 col-lg-4 col-xl" key={link.href}>
            <Link className="panel h-100 d-block" href={link.href}>
              <div className="d-flex align-items-center justify-content-between">
                <span className="section-title mb-0">
                  <i className={`bi ${link.icon}`} aria-hidden="true" />
                </span>
                <i className="bi bi-arrow-right text-muted" aria-hidden="true" />
              </div>
              <p className="fw-semibold mb-0 mt-3">{link.title}</p>
              <p className="text-muted small mb-0">{link.copy}</p>
            </Link>
          </div>
        ))}
      </section>

      {/* The AI suite lives on its own page now — the dashboard links to it
          instead of embedding it, so the workspace stays about the day's
          patients. */}
      <div className="mt-4">
        <Link href="/doctor/ai" className="panel d-flex flex-wrap align-items-center justify-content-between gap-3 text-decoration-none">
          <div className="d-flex align-items-center gap-3">
            <span className="page-icon">
              <i className="bi bi-stars text-warning" aria-hidden="true" />
            </span>
            <div>
              <h2 className="h5 mb-1 section-title">
                <span>Clinical AI Suite</span>
              </h2>
              <p className="text-muted mb-0">
                SOAP generator, lab report analyser, no-show predictor and a clinical assistant — answered live by the
                Ollama model panel.
              </p>
            </div>
          </div>
          <span className="btn btn-primary btn-sm">
            Open AI Suite <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
          </span>
        </Link>
      </div>

      <div className="row g-3 mt-1">
        {/* Queue */}
        <div className="col-12 col-xl-4">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-list-ol" aria-hidden="true" />
                  <span>Urgency Triage Queue</span>
                </h2>
                <p className="text-muted mb-0">Sorted by triage urgency score.</p>
              </div>
            </div>

            {isLoading ? (
              <p className="text-muted small mb-0">Loading your patient queue…</p>
            ) : sortedQueue.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-inbox" aria-hidden="true" />
                <p className="mb-0">No appointments booked with you yet.</p>
              </div>
            ) : (
              <div className="d-grid gap-2">
                {sortedQueue.map((app) => {
                  const isSelected = selectedApp?.id === app.id;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      className={`choice-tile flex-column align-items-stretch${isSelected ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedApp(app);
                        setClinicalNotes(app.notes || '');
                      }}
                    >
                      <span className="d-flex align-items-center justify-content-between w-100">
                        <span className={`urgency-badge ${urgencyClass(app.triage_urgency)}`}>
                          {(app.triage_urgency || 'ROUTINE').replace('_', ' ')}
                        </span>
                        <span className="text-muted small">
                          <i className="bi bi-clock me-1" aria-hidden="true" />
                          {app.start_time}
                        </span>
                      </span>
                      <span className="mt-2 w-100">
                        {app.patient_name}
                        <small>{app.reason}</small>
                        <small className="mt-1">Status: {app.status}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Consultation notes */}
        <div className="col-12 col-xl-4">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-person-vcard" aria-hidden="true" />
                  <span>Consultation Summary</span>
                </h2>
              </div>
              {selectedApp && <span className="badge text-bg-secondary">{selectedApp.status}</span>}
            </div>

            {selectedApp ? (
              <>
                <div className="mini-card">
                  <strong>{selectedApp.patient_name}</strong>
                  <span>
                    {selectedApp.appointment_date} · {selectedApp.start_time}
                  </span>
                  <span>Reason: {selectedApp.reason}</span>
                </div>

                <div className="mt-3">
                  <label className="form-label" htmlFor="clinicalNotes">
                    Clinical notes &amp; consultation findings
                  </label>
                  <textarea
                    className="form-control"
                    id="clinicalNotes"
                    rows={7}
                    placeholder="Enter medical findings, recommended diagnostic tests and advice…"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                  />
                </div>

                {saveSuccess && (
                  <div className="alert alert-success d-flex align-items-center gap-2 mt-3" role="status">
                    <i className="bi bi-check2-circle" aria-hidden="true" />
                    <span className="small">Clinical notes saved and consultation completed.</span>
                  </div>
                )}

                {saveError && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 mt-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                    <span className="small">{saveError}</span>
                  </div>
                )}

                <button className="btn btn-primary w-100 mt-3" type="button" onClick={handleSaveNotes} disabled={isSaving}>
                  <i className={isSaving ? 'bi bi-arrow-repeat' : 'bi bi-save'} aria-hidden="true" />
                  {isSaving ? 'Saving…' : 'Save Notes & Complete Consultation'}
                </button>
              </>
            ) : (
              <div className="empty-state">
                <i className="bi bi-cursor" aria-hidden="true" />
                <p className="mb-0">Select a patient from the queue to view consultation details.</p>
              </div>
            )}
          </section>
        </div>

        {/* Slot manager */}
        <div className="col-12 col-xl-4">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-calendar2-range" aria-hidden="true" />
                  <span>Today&apos;s Slots</span>
                </h2>
                <p className="text-muted mb-0">Generated from your saved consulting hours.</p>
              </div>
              <Link className="btn btn-sm btn-outline-primary" href="/doctor/schedule">
                Manage hours
              </Link>
            </div>

            {slotsLoading ? (
              <p className="text-muted small mb-0">Loading today&apos;s slots…</p>
            ) : slots.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-calendar2-x" aria-hidden="true" />
                <p className="mb-2">You have no consulting hours set for today.</p>
                <Link className="btn btn-sm btn-primary" href="/doctor/schedule">
                  Set your availability
                </Link>
              </div>
            ) : (
              <div className="d-grid gap-2" style={{ maxHeight: '360px', overflowY: 'auto' }}>
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
      </div>
    </>
  );
}
