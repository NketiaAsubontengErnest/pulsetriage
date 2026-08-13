'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { getProfile, updateProfile, DoctorProfile } from '@/lib/api';

/** Keeps stored avatars small enough to live on the user row as a data URL. */
const AVATAR_MAX_PX = 320;
const AVATAR_MAX_SOURCE_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
  return (
    <AuthGuard allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading your profile…</p>
            </div>
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </AuthGuard>
  );
}

/**
 * Downscales and re-encodes the chosen file in the browser so a 4 MB phone
 * photo becomes a small square JPEG before it ever reaches the server.
 */
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.onload = () => {
        const scale = Math.min(1, AVATAR_MAX_PX / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Your browser could not process the image.'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function ProfileContent() {
  const { user, applyProfileUpdate } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then((data) => {
        setFullName(data.user.full_name || '');
        setPhone(data.user.phone || '');
        setAvatar(data.user.avatar_url || null);
        setDoctor(data.doctor);
        setSpecialization(data.doctor?.specialization || '');
        setBio(data.doctor?.bio || '');
      })
      .catch((err) => setDetailsMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to load profile' }))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDetailsMsg({ ok: false, text: 'Please choose an image file.' });
      return;
    }
    if (file.size > AVATAR_MAX_SOURCE_BYTES) {
      setDetailsMsg({ ok: false, text: 'That image is over 5 MB. Please choose a smaller one.' });
      return;
    }

    try {
      setAvatar(await resizeToDataUrl(file));
      setDetailsMsg({ ok: true, text: 'Image ready — click “Save changes” to apply it.' });
    } catch (err) {
      setDetailsMsg({ ok: false, text: (err as Error).message });
    }
  };

  const handleSaveDetails = async () => {
    if (!user) return;
    setSavingDetails(true);
    setDetailsMsg(null);
    try {
      const { user: updated } = await updateProfile({
        user_id: user.id,
        full_name: fullName,
        phone,
        avatar_url: avatar,
        ...(doctor ? { specialization, bio } : {}),
      });
      applyProfileUpdate(updated);
      setDetailsMsg({ ok: true, text: 'Profile updated.' });
    } catch (err) {
      setDetailsMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not save your profile.' });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'The two new passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await updateProfile({ user_id: user.id, current_password: currentPassword, new_password: newPassword });
      setPasswordMsg({ ok: true, text: 'Password changed. Use it the next time you sign in.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not change your password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (fullName || user?.email || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8;

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-person-gear" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Account</p>
            <h1 className="h3 mb-1">My Profile</h1>
            <p className="text-muted mb-0">Update your photo, contact details and password.</p>
          </div>
        </div>
        <div className="heading-actions">
          <span className="badge text-bg-secondary">{user?.role}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="panel blank-panel">
          <div className="blank-state">
            <i className="bi bi-hourglass-split" aria-hidden="true" />
            <p className="text-muted mb-0">Loading your profile…</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {/* ── Photo ──────────────────────────────────────────────────────── */}
          <div className="col-12 col-lg-4">
            <section className="panel h-100 text-center">
              <div className="panel-header justify-content-center">
                <h2 className="h5 mb-0 section-title">
                  <i className="bi bi-image" aria-hidden="true" />
                  <span>Profile Photo</span>
                </h2>
              </div>

              <div className="profile-photo mx-auto mb-3">
                {avatar ? (
                  // A data URL cannot go through next/image optimisation.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="Your profile" />
                ) : (
                  <span className="profile-photo-initials">{initials}</span>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="d-none"
                onChange={handlePickImage}
              />

              <div className="d-flex justify-content-center gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>
                  <i className="bi bi-upload me-1" aria-hidden="true" />
                  Choose photo
                </button>
                {avatar && (
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setAvatar(null)}>
                    <i className="bi bi-trash me-1" aria-hidden="true" />
                    Remove
                  </button>
                )}
              </div>

              <p className="text-muted small mb-0 mt-3">
                Square images work best. Your photo is resized in the browser before it is saved.
              </p>
            </section>
          </div>

          {/* ── Details ────────────────────────────────────────────────────── */}
          <div className="col-12 col-lg-8">
            <section className="panel h-100">
              <div className="panel-header">
                <div>
                  <h2 className="h5 mb-1 section-title">
                    <i className="bi bi-person-vcard" aria-hidden="true" />
                    <span>Your Details</span>
                  </h2>
                  <p className="text-muted mb-0">Shown to the people you consult with.</p>
                </div>
              </div>

              {detailsMsg && (
                <div className={`alert ${detailsMsg.ok ? 'alert-success' : 'alert-danger'} py-2 px-3 small`} role="status">
                  <i className={`bi ${detailsMsg.ok ? 'bi-check2-circle' : 'bi-exclamation-triangle-fill'} me-1`} />
                  {detailsMsg.text}
                </div>
              )}

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="profileName">
                    Full name
                  </label>
                  <input
                    id="profileName"
                    className="form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="profilePhone">
                    Phone
                  </label>
                  <input
                    id="profilePhone"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+233 …"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="profileEmail">
                    Email
                  </label>
                  <input id="profileEmail" className="form-control" value={user?.email || ''} disabled />
                  <p className="text-muted small mb-0 mt-1">
                    Your email is your sign-in name and cannot be changed here.
                  </p>
                </div>

                {doctor && (
                  <>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="profileSpecialty">
                        Specialty
                      </label>
                      <input
                        id="profileSpecialty"
                        className="form-control"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="profileLicence">
                        Licence number
                      </label>
                      <input id="profileLicence" className="form-control" value={doctor.license_number} disabled />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="profileBio">
                        Professional bio
                      </label>
                      <textarea
                        id="profileBio"
                        className="form-control"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="d-flex justify-content-end mt-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveDetails}
                  disabled={savingDetails || fullName.trim().length < 2}
                >
                  <i className={`bi ${savingDetails ? 'bi-arrow-repeat spin' : 'bi-check2'} me-1`} aria-hidden="true" />
                  {savingDetails ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </section>
          </div>

          {/* ── Password ───────────────────────────────────────────────────── */}
          <div className="col-12">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="h5 mb-1 section-title">
                    <i className="bi bi-shield-lock" aria-hidden="true" />
                    <span>Password</span>
                  </h2>
                  <p className="text-muted mb-0">You need your current password to set a new one.</p>
                </div>
              </div>

              {passwordMsg && (
                <div className={`alert ${passwordMsg.ok ? 'alert-success' : 'alert-danger'} py-2 px-3 small`} role="status">
                  <i className={`bi ${passwordMsg.ok ? 'bi-check2-circle' : 'bi-exclamation-triangle-fill'} me-1`} />
                  {passwordMsg.text}
                </div>
              )}

              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="currentPassword">
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="newPassword">
                    New password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`form-control ${passwordTooShort ? 'is-invalid' : ''}`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  {passwordTooShort && <div className="invalid-feedback">Use at least 8 characters.</div>}
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="confirmPassword">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`form-control ${
                      confirmPassword.length > 0 && confirmPassword !== newPassword ? 'is-invalid' : ''
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                    <div className="invalid-feedback">The passwords do not match.</div>
                  )}
                </div>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={handleChangePassword}
                  disabled={
                    savingPassword ||
                    !currentPassword ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                >
                  <i className={`bi ${savingPassword ? 'bi-arrow-repeat spin' : 'bi-key'} me-1`} aria-hidden="true" />
                  {savingPassword ? 'Updating…' : 'Change password'}
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
