'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Doctor } from '@/lib/types';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  getSpecializations,
  createSpecialization,
} from '@/lib/api';

export default function AdminDoctorsPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading doctor operations…</p>
            </div>
          </div>
        }
      >
        <DoctorOperationsContent />
      </Suspense>
    </AuthGuard>
  );
}

function DoctorOperationsContent() {
  const { user } = useAuth();
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);

  // Form State for Adding Specialization
  const [newSpecName, setNewSpecName] = useState('');
  const [specSuccess, setSpecSuccess] = useState(false);
  const [specError, setSpecError] = useState('');

  // Form State for Adding Doctor
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [fee, setFee] = useState(200);
  const [bio, setBio] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [docs, specs] = await Promise.all([getDoctors(), getSpecializations()]);
      setDoctorsList(docs);
      setSpecializations(specs.map((s) => s.name));
      setSpecialization((current) => current || specs[0]?.name || '');
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load doctor registry');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleDoctorStatus = async (docId: string) => {
    const target = doctorsList.find((d) => d.id === docId);
    if (!target) return;

    // Optimistic flip, reverted if the API rejects it.
    const next = !target.is_verified;
    setDoctorsList((list) => list.map((d) => (d.id === docId ? { ...d, is_verified: next } : d)));
    try {
      await updateDoctor(docId, { is_verified: next, updated_by: user?.email || 'admin' });
    } catch {
      setDoctorsList((list) => list.map((d) => (d.id === docId ? { ...d, is_verified: !next } : d)));
    }
  };

  const handleAddSpecialization = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = newSpecName.trim();
    if (!formattedName) return;

    setIsSubmitting(true);
    setSpecError('');
    try {
      await createSpecialization(formattedName, user?.email || 'admin');
      setSpecializations((list) => [...list, formattedName].sort());
      setSpecialization(formattedName);
      setSpecSuccess(true);
      setTimeout(() => {
        setSpecSuccess(false);
        setShowSpecModal(false);
        setNewSpecName('');
      }, 1200);
    } catch (err) {
      setSpecError(err instanceof Error ? err.message : 'Failed to add specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !licenseNumber) return;

    setIsSubmitting(true);
    setAddError('');
    try {
      await createDoctor({
        full_name: fullName,
        email,
        specialization,
        license_number: licenseNumber,
        consultation_fee: Number(fee),
        bio: bio || `${specialization} specialist providing expert telehealth consultations and triage care.`,
        is_verified: true,
        avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
        added_by: user?.email || 'admin',
      });

      await loadData();
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setShowAddModal(false);
        setFullName('');
        setEmail('');
        setLicenseNumber('');
        setBio('');
      }, 1500);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to register doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const term = searchTerm.toLowerCase();
  const filteredDoctors = doctorsList.filter(
    (d) =>
      d.full_name.toLowerCase().includes(term) ||
      d.specialization.toLowerCase().includes(term) ||
      d.license_number.toLowerCase().includes(term)
  );

  const verifiedCount = doctorsList.filter((d) => d.is_verified).length;
  const averageFee = doctorsList.length
    ? doctorsList.reduce((sum, d) => sum + d.consultation_fee, 0) / doctorsList.length
    : 0;

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-person-badge" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Operations Center</p>
            <h1 className="h3 mb-1">Doctor Operations &amp; Specializations</h1>
            <p className="text-muted mb-0">
              Register physicians, configure medical specializations and manage licence status.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setShowSpecModal(true)}>
            <i className="bi bi-tags" aria-hidden="true" /> Add Specialization
          </button>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-person-plus" aria-hidden="true" /> Register Doctor
          </button>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      <section className="row g-3" aria-label="Registry metrics">
        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-primary">
            <div className="metric-top">
              <span className="metric-label">Registered</span>
              <span className="metric-icon">
                <i className="bi bi-people" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">{doctorsList.length}</div>
            <div className="metric-meta">
              <span>Physicians on the registry</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-success">
            <div className="metric-top">
              <span className="metric-label">Verified</span>
              <span className="metric-icon">
                <i className="bi bi-patch-check" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">{verifiedCount}</div>
            <div className="metric-meta">
              <span>Licences approved</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-warning">
            <div className="metric-top">
              <span className="metric-label">Specializations</span>
              <span className="metric-icon">
                <i className="bi bi-tags" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">{specializations.length}</div>
            <div className="metric-meta">
              <span>Configured clinical areas</span>
            </div>
          </article>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <article className="metric-card metric-danger">
            <div className="metric-top">
              <span className="metric-label">Average Fee</span>
              <span className="metric-icon">
                <i className="bi bi-cash-coin" aria-hidden="true" />
              </span>
            </div>
            <div className="metric-value">GH₵ {averageFee.toFixed(0)}</div>
            <div className="metric-meta">
              <span>Per consultation</span>
            </div>
          </article>
        </div>
      </section>

      <section className="panel mt-3">
        <div className="panel-header">
          <div>
            <h2 className="h5 mb-1 section-title">
              <i className="bi bi-list-columns" aria-hidden="true" />
              <span>Physician Registry</span>
            </h2>
            <p className="text-muted mb-0">Search by name, specialty or licence number.</p>
          </div>
          <input
            className="form-control form-control-sm table-search"
            type="search"
            placeholder="Search doctors"
            aria-label="Search doctors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="text-muted small mb-0">Loading doctor registry…</p>
        ) : filteredDoctors.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-person-x" aria-hidden="true" />
            <p className="mb-0">
              {doctorsList.length === 0 ? 'No doctors registered yet.' : 'No doctors match your search.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Doctor</th>
                  <th scope="col">Specialty</th>
                  <th scope="col">Licence</th>
                  <th scope="col">Fee</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="table-media">
                        {doc.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="avatar-img avatar-sm" src={doc.avatar_url} alt={doc.full_name} />
                        ) : (
                          <span className="avatar-initials avatar-sm">{doc.full_name.charAt(0)}</span>
                        )}
                        <div>
                          <p className="fw-semibold mb-0">{doc.full_name}</p>
                          <p className="text-muted small mb-0">{doc.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{doc.specialization}</td>
                    <td>{doc.license_number}</td>
                    <td>GH₵ {doc.consultation_fee.toFixed(2)}</td>
                    <td>
                      <i className="bi bi-star-fill text-warning me-1" aria-hidden="true" />
                      {doc.rating.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${doc.is_verified ? 'text-bg-success' : 'text-bg-danger'}`}>
                        {doc.is_verified ? 'VERIFIED' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-light btn-sm" type="button" onClick={() => toggleDoctorStatus(doc.id)}>
                        {doc.is_verified ? 'Suspend' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Register doctor dialog */}
      {showAddModal && (
        <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-label="Register doctor">
          <section className="panel app-modal">
            <div className="panel-header">
              <div>
                <p className="eyebrow mb-1">Registry</p>
                <h2 className="h5 mb-0">Register New Doctor</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowAddModal(false)} aria-label="Close">
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            {addSuccess && (
              <div className="alert alert-success d-flex align-items-center gap-2" role="status">
                <i className="bi bi-check2-circle" aria-hidden="true" />
                <span className="small">Doctor registered and added to the registry.</span>
              </div>
            )}

            {addError && (
              <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                <span className="small">{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddDoctor} noValidate>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label" htmlFor="docName">
                    Full name
                  </label>
                  <input
                    className="form-control"
                    id="docName"
                    type="text"
                    placeholder="e.g. Dr. Yaa Boateng"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="docEmail">
                    Email address
                  </label>
                  <input
                    className="form-control"
                    id="docEmail"
                    type="email"
                    placeholder="dr.name@ug.edu.gh"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="docLicense">
                    Licence number
                  </label>
                  <input
                    className="form-control"
                    id="docLicense"
                    type="text"
                    placeholder="GMC-2026-0000"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="docSpecialty">
                    Specialization
                  </label>
                  <select
                    className="form-select"
                    id="docSpecialty"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="docFee">
                    Consultation fee (GH₵)
                  </label>
                  <input
                    className="form-control"
                    id="docFee"
                    type="number"
                    min={0}
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="docBio">
                    Professional bio
                  </label>
                  <textarea
                    className="form-control"
                    id="docBio"
                    rows={3}
                    placeholder="Clinical background and areas of expertise…"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button className="btn btn-light" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                  <i className={isSubmitting ? 'bi bi-arrow-repeat' : 'bi bi-person-plus'} aria-hidden="true" />
                  {isSubmitting ? 'Saving…' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Add specialization dialog */}
      {showSpecModal && (
        <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-label="Add specialization">
          <section className="panel app-modal">
            <div className="panel-header">
              <div>
                <p className="eyebrow mb-1">Configuration</p>
                <h2 className="h5 mb-0">Add Medical Specialization</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowSpecModal(false)} aria-label="Close">
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            {specSuccess && (
              <div className="alert alert-success d-flex align-items-center gap-2" role="status">
                <i className="bi bi-check2-circle" aria-hidden="true" />
                <span className="small">Specialization added.</span>
              </div>
            )}

            {specError && (
              <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                <span className="small">{specError}</span>
              </div>
            )}

            <form onSubmit={handleAddSpecialization} noValidate>
              <label className="form-label" htmlFor="specName">
                Specialization name
              </label>
              <input
                className="form-control"
                id="specName"
                type="text"
                placeholder="e.g. Rheumatology"
                value={newSpecName}
                onChange={(e) => setNewSpecName(e.target.value)}
              />

              <p className="text-muted small mt-3 mb-0">
                Currently configured: {specializations.join(', ') || 'none'}
              </p>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button className="btn btn-light" type="button" onClick={() => setShowSpecModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                  <i className={isSubmitting ? 'bi bi-arrow-repeat' : 'bi bi-plus-lg'} aria-hidden="true" />
                  {isSubmitting ? 'Saving…' : 'Add Specialization'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
