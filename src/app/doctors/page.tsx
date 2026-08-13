'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Doctor } from '@/lib/types';
import { getDoctors } from '@/lib/api';

const STEPS = [
  { step: '01', title: 'Create an account', copy: 'Register with your name, email and phone number.' },
  { step: '02', title: 'Describe your symptoms', copy: 'A guided assessment scores urgency and screens for warning signs.' },
  { step: '03', title: 'Match a specialty', copy: 'The engine recommends the specialty that fits your presentation.' },
  { step: '04', title: 'Choose a free slot', copy: 'Book from the hours that clinician actually publishes.' },
];

const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** Reserves the real card height while loading so the grid never jumps. */
function DirectorySkeleton() {
  return (
    <div className="lp-directory" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div className="lp-skeleton" key={i}>
          <div className="lp-skeleton-bar" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
          <div className="lp-skeleton-bar" style={{ width: '60%', height: '20px', marginTop: '1.5rem' }} />
          <div className="lp-skeleton-bar" style={{ width: '35%' }} />
          <div className="lp-skeleton-bar" style={{ width: '100%', marginTop: '1.5rem' }} />
          <div className="lp-skeleton-bar" style={{ width: '92%' }} />
          <div className="lp-skeleton-bar" style={{ width: '70%' }} />
        </div>
      ))}
    </div>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getDoctors()
      .then((docs) => setDoctors(docs.filter((d) => d.is_verified)))
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load the clinician directory'))
      .finally(() => setIsLoading(false));
  }, []);

  // Filters are derived from whoever is actually on the registry, so an empty
  // specialty never appears as a dead chip.
  const specialties = useMemo(
    () => ['All', ...Array.from(new Set(doctors.map((d) => d.specialization))).sort()],
    [doctors]
  );

  const term = searchTerm.trim().toLowerCase();
  const filtered = doctors.filter(
    (d) =>
      (activeSpecialty === 'All' || d.specialization === activeSpecialty) &&
      (d.full_name.toLowerCase().includes(term) ||
        d.specialization.toLowerCase().includes(term) ||
        d.bio.toLowerCase().includes(term))
  );

  return (
    <div className="lp">
      <header className="lp-pagehead">
        <div className="lp-pagehead-inner">
          <p className="lp-eyebrow lp-rule-above">Clinician directory</p>
          <h1 className="lp-display lp-display-sm">Our verified specialists</h1>
          <p>
            Every clinician listed here has had their medical licence verified before being allowed to accept
            bookings. Consultation fees and consulting hours are their own.
          </p>
        </div>
      </header>

      {/* ── Directory ────────────────────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-toolbar">
          <div className="lp-search">
            <i className="bi bi-search" aria-hidden="true" />
            <label className="visually-hidden" htmlFor="doctorSearch">
              Search clinicians
            </label>
            <input
              id="doctorSearch"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, specialty or interest"
            />
          </div>

          <div className="lp-chips" role="group" aria-label="Filter by specialty">
            {specialties.map((specialty) => (
              <button
                key={specialty}
                type="button"
                className="lp-chip"
                onClick={() => setActiveSpecialty(specialty)}
                aria-pressed={activeSpecialty === specialty}
              >
                {specialty}
              </button>
            ))}
          </div>
        </div>

        {loadError && (
          <div className="lp-notice lp-notice-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
            <p>{loadError}</p>
          </div>
        )}

        {/* Result count is announced so screen readers hear filtering take effect. */}
        <p className="visually-hidden" role="status" aria-live="polite">
          {isLoading ? 'Loading clinicians' : `${filtered.length} clinicians match your filters`}
        </p>

        {isLoading ? (
          <DirectorySkeleton />
        ) : filtered.length === 0 ? (
          <div className="lp-empty">
            <i className="bi bi-person-x" aria-hidden="true" />
            <p>
              {doctors.length === 0
                ? 'No clinicians have been verified on the registry yet.'
                : 'No clinician matches that search.'}
            </p>
            {doctors.length > 0 && (
              <button
                type="button"
                className="lp-btn lp-btn-ghost"
                onClick={() => {
                  setSearchTerm('');
                  setActiveSpecialty('All');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="lp-directory">
            {filtered.map((doctor) => (
              <article className="lp-card lp-doctor" key={doctor.id}>
                <div className="lp-doctor-head">
                  <div className="lp-portrait">
                    {doctor.avatar_url ? (
                      // Remote/data URLs bypass next/image optimisation here.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={doctor.avatar_url} alt="" width={64} height={64} loading="lazy" />
                    ) : (
                      <span aria-hidden="true">{initials(doctor.full_name)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3>{doctor.full_name}</h3>
                    <span className="lp-doctor-specialty">{doctor.specialization}</span>
                  </div>
                </div>

                <p className="lp-doctor-bio">{doctor.bio}</p>

                <div className="lp-doctor-meta">
                  <div>
                    <span>Consultation</span>
                    <strong>GHS {doctor.consultation_fee.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>Rating</span>
                    <strong>{doctor.rating ? doctor.rating.toFixed(2) : '—'}</strong>
                  </div>
                  <div>
                    <span>Registry</span>
                    <span className="lp-verified">
                      <i className="bi bi-patch-check-fill" aria-hidden="true" />
                      Verified
                    </span>
                  </div>
                </div>

                <Link
                  className="lp-link"
                  href={`/booking?specialty=${encodeURIComponent(doctor.specialization)}`}
                >
                  Book with {doctor.full_name.replace(/^Dr\.?\s+/i, 'Dr. ')}
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── How booking works ────────────────────────────────────────────── */}
      <section className="lp-section lp-section-tinted">
        <header className="lp-section-head">
          <p className="lp-eyebrow">Booking</p>
          <h2 className="lp-heading">Four steps to a consultation</h2>
          <p className="lp-section-lead">
            Assessment comes before booking, so you are matched to the right specialty rather than guessing at one.
          </p>
        </header>

        <ol className="lp-journey">
          {STEPS.map((stage) => (
            <li key={stage.step}>
              <span className="lp-step" aria-hidden="true">
                {stage.step}
              </span>
              <h3>{stage.title}</h3>
              <p>{stage.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <p className="lp-eyebrow lp-eyebrow-inverse">Next step</p>
          <h2 className="lp-display lp-display-sm">Find the right specialist for you</h2>
          <p>Begin with a symptom assessment and let the recommendation guide the booking.</p>
          <div className="lp-actions">
            <Link className="lp-btn lp-btn-light" href="/register">
              Create an account
            </Link>
            <Link className="lp-btn lp-btn-outline-light" href="/contact">
              Talk to us first
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
