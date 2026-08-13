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
  getDoctorSchedule,
} from '@/lib/api';
import type { DerivedSlot } from '@/lib/schedule';
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

  // Slots come from the doctor's saved consulting hours (doctor_schedules),
  // with the ones already taken marked. There is no hard-coded list any more:
  // what the doctor sets in the Schedule Slot Manager is exactly what appears
  // here.
  const [slots, setSlots] = useState<DerivedSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');

  useEffect(() => {
    if (!selectedDoctor?.id || !selectedDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setIsLoadingSlots(true);
    setSlotError('');

    getDoctorSchedule(selectedDoctor.id, selectedDate)
      .then((data) => {
        if (cancelled) return;
        const derived = data.slots || [];
        setSlots(derived);

        // Keep the rescheduled appointment's own slot selectable; otherwise
        // fall to the first open one so the form is never left on a slot the
        // doctor does not actually offer.
        const stillValid = derived.some(
          (s) => s.start_time === selectedTimeSlot && (s.available || s.appointment_id === appointmentToReschedule?.id)
        );
        if (!stillValid) {
          const firstOpen = derived.find((s) => s.available);
          setSelectedTimeSlot(firstOpen?.start_time || '');
        }
      })
      .catch((err) => {
        if (!cancelled) setSlotError(err instanceof Error ? err.message : 'Could not load this doctor’s availability');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctor?.id, selectedDate]);

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

  /** Uses the slot length the doctor configured; 30 minutes only as a fallback. */
  const endTimeFor = (slot: string) => {
    const match = slots.find((s) => s.start_time === slot);
    if (match) return match.end_time;
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
    if (!selectedTimeSlot) {
      setPaymentError('Pick an available time slot before continuing.');
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

        void scheduleAppointmentReminders(rescheduled);
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

      void scheduleAppointmentReminders(confirmed);
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
          <span className="form-label d-block">
            Select time slot
            {selectedDoctor && (
              <small className="text-muted ms-1">
                · {selectedDoctor.full_name}&apos;s consulting hours
              </small>
            )}
          </span>

          {slotError && (
            <div className="alert alert-warning py-1 px-2 small mb-2" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-1" />
              {slotError}
            </div>
          )}

          {isLoadingSlots ? (
            <p className="text-muted small mb-0">
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
              Checking availability…
            </p>
          ) : slots.length === 0 ? (
            <div className="alert alert-secondary py-2 px-2 small mb-0" role="status">
              <i className="bi bi-calendar2-x me-1" />
              {selectedDoctor
                ? `${selectedDoctor.full_name} does not consult on this day. Try another date.`
                : 'Choose a doctor to see their available slots.'}
            </div>
          ) : (
            <div className="row g-2">
              {slots.map((slot) => {
                // The slot the patient is currently rescheduling away from is
                // theirs to keep.
                const isOwnSlot = slot.appointment_id && slot.appointment_id === appointmentToReschedule?.id;
                const selectable = slot.available || isOwnSlot;
                return (
                  <div className="col-4 col-lg-3" key={slot.start_time}>
                    <button
                      type="button"
                      disabled={!selectable}
                      title={selectable ? `${slot.start_time} – ${slot.end_time}` : 'Already booked'}
                      className={`btn btn-sm w-100 ${
                        selectedTimeSlot === slot.start_time ? 'btn-primary' : selectable ? 'btn-light' : 'btn-outline-secondary'
                      }`}
                      onClick={() => setSelectedTimeSlot(slot.start_time)}
                    >
                      {slot.start_time}
                      {!selectable && <i className="bi bi-lock-fill ms-1" style={{ fontSize: '10px' }} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
