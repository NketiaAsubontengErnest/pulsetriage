'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DoctorBookingModal } from '@/components/booking/doctor-booking-modal';
import { AuthGuard } from '@/components/auth/auth-guard';

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const specialty = searchParams.get('specialty') || 'All';
  const triageId = searchParams.get('triageId') || undefined;

  return (
    <DoctorBookingModal
      initialSpecialty={specialty}
      triageId={triageId}
      onClose={() => router.push('/patient')}
      onBookingSuccess={() => undefined}
    />
  );
}

export default function BookingPage() {
  return (
    <AuthGuard allowedRoles={['PATIENT']}>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-calendar2-plus" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Scheduling</p>
            <h1 className="h3 mb-1">Book a Consultation</h1>
            <p className="text-muted mb-0">
              Choose a verified specialist, lock a 30-minute slot and complete simulated checkout.
            </p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading booking workspace…</p>
            </div>
          </div>
        }
      >
        <BookingContent />
      </Suspense>
    </AuthGuard>
  );
}
