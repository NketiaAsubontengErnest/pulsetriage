'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Doctor } from '@/lib/types';
import { getDoctors } from '@/lib/api';

const BOOKING_STEPS = [
  { title: 'Sign in', copy: 'Register or log in to your patient account.' },
  { title: 'Run triage', copy: 'Complete the four-step symptom questionnaire.' },
  { title: 'Match a specialty', copy: 'The engine recommends the specialty that fits your symptoms.' },
  { title: 'Lock a slot', copy: 'Choose a 30-minute window and confirm at checkout.' },
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getDoctors()
      .then((docs) => setDoctors(docs.filter((d) => d.is_verified)))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load doctor directory'))
      .finally(() => setIsLoading(false));
  }, []);

  // Specialty chips are derived from whoever is actually on the registry.
  const specialties = useMemo(
    () => ['All', ...Array.from(new Set(doctors.map((d) => d.specialization))).sort()],
    [doctors]
  );

  const term = searchTerm.toLowerCase();
  const filteredDoctors = doctors.filter(
    (d) =>
      (activeSpecialty === 'All' || d.specialization === activeSpecialty) &&
      (d.full_name.toLowerCase().includes(term) ||
        d.specialization.toLowerCase().includes(term) ||
        d.bio.toLowerCase().includes(term))
  );

  const averageFee = doctors.length
    ? doctors.reduce((sum, d) => sum + d.consultation_fee, 0) / doctors.length
    : 0;
  const averageRating = doctors.length
    ? doctors.reduce((sum, d) => sum + d.rating, 0) / doctors.length
    : 0;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="public-hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow mb-2">
              <i className="bi bi-clipboard2-pulse me-1" aria-hidden="true" />
              Specialist directory
            </p>
            <h1 className="hero-title">
              Verified specialists, <span className="accent">matched to your symptoms</span>
            </h1>
            <p className="hero-lead">
              Every clinician here has had their licence verified by system administration. Complete a triage
              assessment first and the platform will point you at the specialty that fits your presentation.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link className="btn btn-primary" href="/register">
                <i className="bi bi-activity" aria-hidden="true" /> Start with Triage
              </Link>
              <Link className="btn btn-outline-secondary" href="/login">
                <i className="bi bi-calendar2-plus" aria-hidden="true" /> Sign In to Book
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Registry stats ───────────────────────────────────────────────── */}
      <section className="stat-band public-section" aria-label="Registry figures">
        <div>
          <strong>{doctors.length}</strong>
          <span>Verified specialists</span>
        </div>
        <div>
          <strong>{specialties.length - 1}</strong>
          <span>Specialties covered</span>
        </div>
        <div>
          <strong>{averageRating ? averageRating.toFixed(2) : '—'}</strong>
          <span>Average rating</span>
        </div>
        <div>
          <strong>GH₵ {averageFee.toFixed(0)}</strong>
          <span>Average fee</span>
        </div>
      </section>

      {/* ── Directory ────────────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head">
          <p className="eyebrow mb-1">The registry</p>
          <h2 className="h3">Browse available clinicians</h2>
          <p>Filter by specialty, or search by name and clinical background.</p>
        </div>

        {loadError && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
            <span className="small">{loadError}</span>
          </div>
        )}

        <div className="panel mb-3">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-8">
              <div className="filter-chips">
                {specialties.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    className={`filter-chip${activeSpecialty === spec ? ' active' : ''}`}
                    onClick={() => setActiveSpecialty(spec)}
                    aria-pressed={activeSpecialty === spec}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <input
                className="form-control form-control-sm"
                type="search"
                placeholder="Search name or expertise"
                aria-label="Search specialists"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading verified specialists…</p>
            </div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-person-x" aria-hidden="true" />
              <p className="text-muted mb-0">
                {doctors.length === 0
                  ? 'No verified specialists are listed yet.'
                  : 'No specialists match this filter.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {filteredDoctors.map((doc) => (
              <div className="col-12 col-md-6 col-xl-4" key={doc.id}>
                <article className="feature-tile d-flex flex-column">
                  <div className="d-flex align-items-center gap-3">
                    {doc.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="avatar-img avatar-md" src={doc.avatar_url} alt={doc.full_name} />
                    ) : (
                      <span className="avatar-initials avatar-md">
                        {doc.full_name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="mt-0 mb-1">{doc.full_name}</h3>
                      <p className="eyebrow mb-0">{doc.specialization}</p>
                    </div>
                  </div>

                  <p className="mt-3 flex-grow-1">{doc.bio}</p>

                  <div className="info-list">
                    <div>
                      <span>
                        <i className="bi bi-star-fill text-warning me-1" aria-hidden="true" />
                        Rating
                      </span>
                      <strong>{doc.rating.toFixed(2)} / 5.00</strong>
                    </div>
                    <div>
                      <span>
                        <i className="bi bi-cash-coin me-1" aria-hidden="true" />
                        Consultation fee
                      </span>
                      <strong>GH₵ {doc.consultation_fee.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>
                        <i className="bi bi-patch-check me-1" aria-hidden="true" />
                        Licence
                      </span>
                      <strong>{doc.license_number}</strong>
                    </div>
                  </div>

                  <Link className="btn btn-light btn-sm mt-3" href="/login">
                    <i className="bi bi-calendar2-plus" aria-hidden="true" /> Sign in to book
                  </Link>
                </article>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Booking explainer ────────────────────────────────────────────── */}
      <section className="public-section">
        <div className="section-head center">
          <p className="eyebrow mb-1">Before you book</p>
          <h2 className="h3">How slot booking works</h2>
          <p>Triage comes first — it decides which specialty you are offered and how urgently.</p>
        </div>

        <div className="step-flow">
          {BOOKING_STEPS.map((step, index) => (
            <article className="step-item" key={step.title}>
              <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="cta-band public-section">
        <h2 className="h3">Find the right specialist</h2>
        <p>Run a three-minute symptom assessment and the platform will recommend who to see, and how soon.</p>
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <Link className="btn btn-light" href="/register">
            <i className="bi bi-person-plus" aria-hidden="true" /> Register as a Patient
          </Link>
          <Link className="btn btn-outline-light" href="/contact">
            <i className="bi bi-chat-dots" aria-hidden="true" /> Contact Administration
          </Link>
        </div>
      </section>
    </>
  );
}
