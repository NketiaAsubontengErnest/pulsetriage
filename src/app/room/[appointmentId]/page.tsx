'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Appointment } from '@/lib/types';
import { getAppointments } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { TelehealthVideoRoom } from '@/components/video/telehealth-video-room';

export default function DedicatedVideoRoomPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAppointments()
      .then((apps) => {
        const found = apps.find((a) => a.id === appointmentId);
        if (found) {
          setAppointment(found);
        } else {
          setError('Appointment consultation room not found.');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load video room'))
      .finally(() => setIsLoading(false));
  }, [appointmentId]);

  const isDoctor = user?.role === 'DOCTOR';

  const handleClose = () => {
    if (isDoctor) {
      router.push('/doctor/upcoming');
    } else {
      router.push('/patient/appointments');
    }
  };

  return (
    <AuthGuard>
      {isLoading ? (
        <div className="panel blank-panel vh-100 d-flex align-items-center justify-content-center">
          <div className="blank-state">
            <i className="bi bi-camera-video spin text-primary display-4 mb-3" />
            <h2 className="h5">Connecting to Telehealth Room...</h2>
            <p className="text-muted mb-0">Initializing HD encrypted WebRTC stream</p>
          </div>
        </div>
      ) : error || !appointment ? (
        <div className="container py-5 text-center">
          <div className="alert alert-danger d-inline-flex align-items-center gap-2 mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>{error || 'Consultation room unaccessible.'}</span>
          </div>
          <div>
            <button className="btn btn-primary" type="button" onClick={handleClose}>
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <TelehealthVideoRoom
          appointment={appointment}
          isDoctor={isDoctor}
          onClose={handleClose}
          onConsultationCompleted={handleClose}
        />
      )}
    </AuthGuard>
  );
}
