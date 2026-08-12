'use client';

import React, { useState, useEffect } from 'react';
import { Doctor, Appointment } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import {
  getDoctors,
  getSpecializations,
  createAppointment,
  createPayment,
  updateAppointment,
} from '@/lib/api';
import { processSimulatedPayment } from '@/lib/simulated-payment';
import { scheduleAppointmentReminders } from '@/lib/notifications';

interface BookingModalProps {
  initialSpecialty?: string;
  triageId?: string;
  appointmentToReschedule?: Appointment | null;
  onClose: () => void;
  onBookingSuccess: (appointment: Appointment) => void;
}

export const DoctorBookingModal: React.FC<BookingModalProps> = ({
  initialSpecialty,
  triageId,
  appointmentToReschedule,
  onClose,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialSpecialty || 'All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    appointmentToReschedule?.appointment_date || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(
    appointmentToReschedule?.start_time || '10:00'
  );

  // Checkout & Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CREDIT_CARD'>('MOBILE_MONEY');
  const [paymentProvider, setPaymentProvider] = useState<string>('MTN Mobile Money');
  const [accountNumber, setAccountNumber] = useState<string>('0241234567');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'];

  // Load verified doctors and specializations
  useEffect(() => {
    Promise.all([getDoctors(), getSpecializations()])
      .then(([docs, specs]) => {
        const verified = docs.filter((d) => d.is_verified);
        setDoctors(verified);
        setSpecialties(specs.map((s) => s.name));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load doctors'))
      .finally(() => setIsLoadingDoctors(false));
  }, []);

  const filteredDoctors =
    selectedSpecialty === 'All'
      ? doctors
      : doctors.filter(
          (d) =>
            d.specialization.toLowerCase() === selectedSpecialty.toLowerCase() ||
            d.specialization === 'General Practice'
        );

  // Preselect existing doctor if rescheduling, or top available doctor
  useEffect(() => {
    const eligible =
      selectedSpecialty === 'All'
        ? doctors
        : doctors.filter(
            (d) =>
              d.specialization.toLowerCase() === selectedSpecialty.toLowerCase() ||
              d.specialization === 'General Practice'
          );

    if (appointmentToReschedule && doctors.length > 0) {
      const match = doctors.find(
        (d) => d.id === appointmentToReschedule.doctor_id || d.full_name === appointmentToReschedule.doctor_name
      );
      if (match) {
        setSelectedDoctor(match);
        return;
      }
    }

    setSelectedDoctor((current) =>
      current && eligible.some((d) => d.id === current.id) ? current : eligible[0] || null
    );
  }, [doctors, selectedSpecialty, appointmentToReschedule]);

  const endTimeFor = (slot: string) => {
    const [h, m] = slot.split(':').map(Number);
    const total = h * 60 + m + 30;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  const handleConfirmAndPay = async () => {
    if (!selectedDoctor) return;
    if (!user) {
      setPaymentError('You must be signed in to book an appointment.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    // ── Reschedule Flow (No repayment required) ───────────────────
    if (appointmentToReschedule) {
      try {
        const { appointment } = await updateAppointment(appointmentToReschedule.id, {
          appointment_date: selectedDate,
          start_time: selectedTimeSlot,
          end_time: endTimeFor(selectedTimeSlot),
          doctor_id: selectedDoctor.id,
          status: 'CONFIRMED',
          updated_by: user.email,
        });

        const rescheduled: Appointment = {
          ...appointmentToReschedule,
          ...appointment,
          appointment_date: selectedDate,
          start_time: selectedTimeSlot,
          end_time: endTimeFor(selectedTimeSlot),
          doctor_id: selectedDoctor.id,
          doctor_name: selectedDoctor.full_name,
          doctor_specialty: selectedDoctor.specialization,
          status: 'CONFIRMED',
        };

        scheduleAppointmentReminders(rescheduled);
        setConfirmedAppointment(rescheduled);
        onBookingSuccess(rescheduled);
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : 'Failed to reschedule appointment. Please try again.');
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    // ── New Booking & Payment Flow ────────────────────────────────
    let createdId: string | null = null;
    try {
      // 1. Persist the appointment
      const { appointment } = await createAppointment({
        patient_id: user.id,
        doctor_id: selectedDoctor.id,
        triage_id: triageId,
        appointment_date: selectedDate,
        start_time: selectedTimeSlot,
        end_time: endTimeFor(selectedTimeSlot),
        payment_amount: selectedDoctor.consultation_fee,
        reason: `Consultation with ${selectedDoctor.full_name} (${selectedDoctor.specialization})`,
      });
      createdId = appointment.id;

      // 2. Execute Simulated Payment Processor
      const paymentResult = await processSimulatedPayment({
        appointment_id: appointment.id,
        patient_id: user.id,
        amount: selectedDoctor.consultation_fee,
        payment_method: paymentMethod,
        provider: paymentProvider,
        account_number: accountNumber,
      });

      if (!paymentResult.success) {
        await updateAppointment(appointment.id, {
          status: 'CANCELLED',
          payment_status: 'FAILED',
          updated_by: user.email,
        }).catch(() => undefined);
        setPaymentError(paymentResult.message);
        return;
      }

      // 3. Log payment & confirm
      await createPayment({
        appointment_id: appointment.id,
        patient_id: user.id,
        amount: selectedDoctor.consultation_fee,
        payment_method: paymentMethod,
        provider: paymentProvider,
        transaction_ref: paymentResult.transaction_ref,
      });

      const confirmed: Appointment = {
        ...appointment,
        patient_name: user.full_name,
        doctor_name: selectedDoctor.full_name,
        doctor_specialty: selectedDoctor.specialization,
        status: 'CONFIRMED',
        payment_status: 'SIMULATED_SUCCESS',
      };

      scheduleAppointmentReminders(confirmed);
      setConfirmedAppointment(confirmed);
      onBookingSuccess(confirmed);
    } catch (err) {
      if (createdId) {
        await updateAppointment(createdId, { status: 'CANCELLED', payment_status: 'FAILED' }).catch(() => undefined);
      }
      setPaymentError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (confirmedAppointment) {
    return (
      <section className="panel app-modal text-center mx-auto">
        <span className="page-icon mx-auto mb-3">
          <i className="bi bi-check2-circle" aria-hidden="true" />
        </span>
        <h2 className="h4 mb-2">
          {appointmentToReschedule ? 'Appointment Rescheduled Successfully' : 'Appointment & Payment Confirmed'}
        </h2>
        <p className="text-muted">
          {appointmentToReschedule
            ? 'Your consultation date and time have been updated. Automated email reminders have been updated for your new slot.'
            : 'Your telehealth consultation slot is reserved. A summary notification has been sent to your dashboard.'}
        </p>

        <div className="info-list text-start mt-4">
          <div>
            <span>Doctor</span>
            <strong>{confirmedAppointment.doctor_name}</strong>
          </div>
          <div>
            <span>Specialty</span>
            <strong>{confirmedAppointment.doctor_specialty}</strong>
          </div>
          <div>
            <span>New Date &amp; time</span>
            <strong>
              {confirmedAppointment.appointment_date} at {confirmedAppointment.start_time}
            </strong>
          </div>
          <div>
            <span>Status</span>
            <strong className="text-success">{confirmedAppointment.status}</strong>
          </div>
        </div>

        <button className="btn btn-primary w-100 mt-4" type="button" onClick={onClose}>
          Done &amp; Return to Schedule
        </button>
      </section>
    );
  }

  return (
    <section className="panel app-modal">
      <div className="panel-header">
        <div>
          <h2 className="h5 mb-1 section-title">
            <i className={appointmentToReschedule ? 'bi bi-arrow-repeat' : 'bi bi-calendar2-plus'} aria-hidden="true" />
            <span>{appointmentToReschedule ? 'Reschedule Telehealth Consultation' : 'Book & Pay Consultation Slot'}</span>
          </h2>
          <p className="text-muted mb-0">
            {appointmentToReschedule
              ? 'Select a new date, time, or specialist for your existing appointment.'
              : 'Choose a verified doctor, pick a date/time slot, and complete simulated checkout.'}
          </p>
        </div>
        <button className="btn-close" type="button" onClick={onClose} aria-label="Close modal" />
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      {/* Reschedule Banner */}
      {appointmentToReschedule && (
        <div className="alert alert-info d-flex align-items-center gap-3 mb-3" role="status">
          <i className="bi bi-arrow-repeat text-info fs-4" aria-hidden="true" />
          <div>
            <strong className="d-block">Rescheduling Existing Appointment</strong>
            <span className="small">
              Previously set for <strong>{appointmentToReschedule.appointment_date} at {appointmentToReschedule.start_time}</strong>.
              <br />
              Consultation Fee of <strong>GH₵ {appointmentToReschedule.payment_amount.toFixed(2)}</strong> is already paid and transferred. No extra fee required.
            </span>
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label" htmlFor="specialtyFilter">
          Filter by specialty
        </label>
        <select
          className="form-select"
          id="specialtyFilter"
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
        >
          <option value="All">All specialties</option>
          {specialties.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </select>
      </div>

      <p className="eyebrow mb-2">Available doctors</p>

      {isLoadingDoctors ? (
        <p className="text-muted small">Loading verified doctors…</p>
      ) : filteredDoctors.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-person-x" aria-hidden="true" />
          <p className="mb-0">No verified doctors available for this specialty.</p>
        </div>
      ) : (
        <div className="row g-2">
          {filteredDoctors.map((doc) => (
            <div className="col-12 col-md-6" key={doc.id}>
              <button
                type="button"
                className={`choice-tile h-100${selectedDoctor?.id === doc.id ? ' selected' : ''}`}
                onClick={() => setSelectedDoctor(doc)}
                aria-pressed={selectedDoctor?.id === doc.id}
              >
                <span className="d-inline-flex align-items-center gap-2">
                  {doc.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="avatar-img avatar-sm" src={doc.avatar_url} alt={doc.full_name} />
                  ) : (
                    <span className="avatar-initials avatar-sm">
                      {doc.full_name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>
                    {doc.full_name}
                    <small>
                      {doc.specialization} · GH₵ {doc.consultation_fee.toFixed(2)}
                    </small>
                  </span>
                </span>
                {selectedDoctor?.id === doc.id && <i className="bi bi-check-circle-fill" aria-hidden="true" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="row g-3 mt-1">
        <div className="col-12 col-md-5">
          <label className="form-label" htmlFor="bookingDate">
            Select new date
          </label>
          <input
            className="form-control"
            id="bookingDate"
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="col-12 col-md-7">
          <span className="form-label d-block">Select new time slot</span>
          <div className="row g-2">
            {timeSlots.map((slot) => (
              <div className="col-3" key={slot}>
                <button
                  type="button"
                  className={`btn btn-sm w-100 ${selectedTimeSlot === slot ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => setSelectedTimeSlot(slot)}
                >
                  {slot}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment section shown only for NEW bookings */}
      {!appointmentToReschedule && (
        <div className="panel panel-accent accent-warning mt-3">
          <div className="panel-header">
            <div>
              <h3 className="h6 mb-1 section-title">
                <i className="bi bi-credit-card" aria-hidden="true" />
                <span>Simulated Checkout</span>
              </h3>
            </div>
            <span className="badge text-bg-primary">
              Total: GH₵ {selectedDoctor?.consultation_fee.toFixed(2) ?? '0.00'}
            </span>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <button
                type="button"
                className={`btn w-100 ${paymentMethod === 'MOBILE_MONEY' ? 'btn-primary' : 'btn-light'}`}
                onClick={() => {
                  setPaymentMethod('MOBILE_MONEY');
                  setPaymentProvider('MTN Mobile Money');
                }}
              >
                <i className="bi bi-phone" aria-hidden="true" /> Mobile Money
              </button>
            </div>
            <div className="col-6">
              <button
                type="button"
                className={`btn w-100 ${paymentMethod === 'CREDIT_CARD' ? 'btn-primary' : 'btn-light'}`}
                onClick={() => {
                  setPaymentMethod('CREDIT_CARD');
                  setPaymentProvider('Visa / Mastercard');
                }}
              >
                <i className="bi bi-credit-card-2-front" aria-hidden="true" /> Card / Visa
              </button>
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label" htmlFor="accountNumber">
              Mobile money or card account number
            </label>
            <input
              className="form-control"
              id="accountNumber"
              type="text"
              placeholder="Enter phone number or card…"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>
        </div>
      )}

      {paymentError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mt-3 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{paymentError}</span>
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-end gap-2 pt-4 mt-4 border-top">
        <button className="btn btn-light" type="button" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={handleConfirmAndPay}
          disabled={isProcessingPayment || !selectedDoctor}
        >
          <i className={isProcessingPayment ? 'bi bi-arrow-repeat' : 'bi bi-shield-check'} aria-hidden="true" />
          {isProcessingPayment
            ? appointmentToReschedule ? 'Rescheduling…' : 'Processing payment…'
            : appointmentToReschedule
            ? 'Confirm Reschedule (No Additional Charge)'
            : `Pay GH₵ ${selectedDoctor?.consultation_fee.toFixed(2) ?? '0.00'} & Confirm Slot`}
        </button>
      </div>
    </section>
  );
};
