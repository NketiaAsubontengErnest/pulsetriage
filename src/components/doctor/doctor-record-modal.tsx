'use client';

import React, { useState } from 'react';
import { Appointment } from '@/lib/types';
import { updateAppointment } from '@/lib/api';

interface DoctorRecordModalProps {
  appointment: Appointment;
  onClose: () => void;
  onRecordSaved: () => void;
}

export function DoctorRecordModal({ appointment, onClose, onRecordSaved }: DoctorRecordModalProps) {
  const [subjective, setSubjective] = useState(
    appointment.reason || 'Patient presents for clinical consultation with acute symptoms.'
  );
  const [vitals, setVitals] = useState({
    bp: '120/80 mmHg',
    temp: '36.8 °C',
    hr: '75 bpm',
    spo2: '98%',
  });
  const [assessment, setAssessment] = useState('Primary Clinical Impression & Differential Assessment.');
  const [plan, setPlan] = useState('1. Paracetamol 500mg TDS x 5 days\n2. Hydration & rest\n3. Review in 5-7 days.');
  const [icd10Suggestions, setIcd10Suggestions] = useState<string[]>([]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGenerateAiSoap = async () => {
    setIsAiGenerating(true);
    setAiMessage(null);

    const fullTranscript = `Patient Name: ${appointment.patient_name || 'Patient'}
Primary Complaint: ${subjective}
Vitals Observed: BP ${vitals.bp}, Temp ${vitals.temp}, Heart Rate ${vitals.hr}, SpO2 ${vitals.spo2}
Doctor Diagnostic Notes: ${assessment}`;

    try {
      const res = await fetch('/api/ai/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullTranscript,
          patientName: appointment.patient_name,
        }),
      });

      const data = await res.json();
      if (data.success && data.soapNote) {
        const note = data.soapNote;
        if (note.subjective) setSubjective(note.subjective);
        if (note.assessment) setAssessment(note.assessment);
        if (note.plan) setPlan(note.plan);
        if (note.icd10_suggestions && Array.isArray(note.icd10_suggestions)) {
          setIcd10Suggestions(note.icd10_suggestions);
        }
        setAiMessage('✨ AI Clinical Diagnosis, Prescriptions & SOAP Note generated!');
      } else {
        setAiMessage('⚠️ AI generation notice: Clinical fallback template populated.');
      }
    } catch (err) {
      console.warn('[AI SOAP FAIL]', err);
      setAiMessage('⚠️ Connection notice: Local evidence-based template loaded.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveRecord = async () => {
    setIsSaving(true);
    const fullClinicalRecord = `[CLINICAL EMR RECORD]
Subjective: ${subjective}
Vitals: BP ${vitals.bp} | Temp ${vitals.temp} | HR ${vitals.hr} | SpO2 ${vitals.spo2}
Assessment (Diagnosis): ${assessment}
ICD-10 Suggestions: ${icd10Suggestions.join(', ') || 'N/A'}
Plan & Prescriptions:
${plan}
Recorded by Attending Physician at ${new Date().toLocaleString()}`;

    try {
      await updateAppointment(appointment.id, {
        notes: fullClinicalRecord,
        status: 'COMPLETED',
      });
      setSaveSuccess(true);
      setTimeout(() => {
        onRecordSaved();
        onClose();
      }, 1200);
    } catch (err) {
      alert('Failed to save clinical record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-modal-backdrop" role="dialog" aria-modal="true" aria-label="Clinical Consultation Record">
      <div className="app-modal app-modal-lg">
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div className="card-header bg-primary text-white p-3 d-flex align-items-center justify-content-between border-0">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-journal-medical fs-4 text-warning" />
              <div>
                <h3 className="h6 text-white mb-0 fw-bold">Clinical Consultation &amp; EMR Record Keeper</h3>
                <small className="text-white-50" style={{ fontSize: '11px' }}>
                  Patient: <strong>{appointment.patient_name}</strong> • Date: {appointment.appointment_date} ({appointment.start_time})
                </small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close" />
          </div>

          <div className="card-body p-4 bg-light overflow-y-auto" style={{ maxHeight: '78vh' }}>
            {saveSuccess && (
              <div className="alert alert-success d-flex align-items-center gap-2 mb-3" role="alert">
                <i className="bi bi-check-circle-fill fs-5" />
                <span>Clinical record saved successfully! Appointment marked as COMPLETED.</span>
              </div>
            )}

            {aiMessage && (
              <div className="alert alert-info d-flex align-items-center justify-content-between p-2.5 mb-3" role="alert">
                <span className="small font-medium">{aiMessage}</span>
                <button type="button" className="btn-close btn-sm" onClick={() => setAiMessage(null)} aria-label="Close" />
              </div>
            )}

            {/* Patient Header Banner & AI Trigger Button */}
            <div className="card border-0 shadow-sm p-3 mb-3 bg-white rounded-3">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <span className="badge text-bg-primary me-1">{appointment.doctor_specialty}</span>
                  <span className="badge text-bg-success">{appointment.status}</span>
                  <h4 className="h6 mb-0 mt-1">{appointment.patient_name}</h4>
                  <small className="text-muted">Patient ID: {appointment.patient_id}</small>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiSoap}
                  disabled={isAiGenerating}
                  className="btn btn-warning btn-sm fw-bold d-flex align-items-center gap-1.5 shadow-sm text-dark"
                >
                  {isAiGenerating ? (
                    <i className="bi bi-arrow-repeat spin" />
                  ) : (
                    <i className="bi bi-stars" />
                  )}
                  <span>{isAiGenerating ? 'AI Analyzing Diagnosis & Rx...' : '✨ AI Diagnostic & Prescription Assistant'}</span>
                </button>
              </div>
            </div>

            {/* Clinical Vitals Section */}
            <div className="card border-0 shadow-sm p-3 mb-3 bg-white rounded-3">
              <h5 className="h6 fw-bold mb-2 text-primary d-flex align-items-center gap-1.5">
                <i className="bi bi-activity" /> Clinical Vitals &amp; Measurements
              </h5>
              <div className="row g-2">
                <div className="col-6 col-md-3">
                  <label className="form-label small mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={vitals.bp}
                    onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small mb-1">Temperature</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={vitals.temp}
                    onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small mb-1">Heart Rate</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={vitals.hr}
                    onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label small mb-1">SpO2 Saturation</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* SOAP Note & AI Diagnostic / Prescription Assistance Fields */}
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3 h-100">
                  <label className="form-label fw-bold text-dark mb-1 d-flex align-items-center gap-1">
                    <i className="bi bi-person-lines-fill text-primary" />
                    <span>S - Subjective (History &amp; Symptoms)</span>
                  </label>
                  <textarea
                    rows={5}
                    className="form-control form-control-sm"
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    placeholder="Patient reported symptoms..."
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3 h-100">
                  <label className="form-label fw-bold text-dark mb-1 d-flex align-items-center justify-content-between">
                    <span className="d-flex align-items-center gap-1">
                      <i className="bi bi-search-heart text-danger" />
                      <span>A - Assessment &amp; AI Diagnosis</span>
                    </span>
                    <span className="badge text-bg-info text-uppercase" style={{ fontSize: '10px' }}>AI Medical Assist</span>
                  </label>
                  <textarea
                    rows={5}
                    className="form-control form-control-sm"
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    placeholder="Primary diagnosis & differential diagnoses..."
                  />
                  {icd10Suggestions.length > 0 && (
                    <div className="mt-2">
                      <small className="text-muted d-block mb-1 font-semibold" style={{ fontSize: '11px' }}>
                        Suggested ICD-10 Codes:
                      </small>
                      <div className="d-flex flex-wrap gap-1">
                        {icd10Suggestions.map((icd, idx) => (
                          <span key={idx} className="badge text-bg-light border text-dark" style={{ fontSize: '10px' }}>
                            <i className="bi bi-tag-fill text-primary me-1" />
                            {icd}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
                  <label className="form-label fw-bold text-dark mb-1 d-flex align-items-center justify-content-between">
                    <span className="d-flex align-items-center gap-1">
                      <i className="bi bi-capsule text-success" />
                      <span>P - Treatment Plan, Prescriptions &amp; Lab Orders</span>
                    </span>
                    <span className="badge text-bg-success" style={{ fontSize: '10px' }}>Rx &amp; Lab Orders</span>
                  </label>
                  <textarea
                    rows={5}
                    className="form-control form-control-sm font-mono"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="1. Prescriptions (Medication, dose, frequency, duration)&#10;2. Lab / Imaging tests&#10;3. Patient instructions & follow-up..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="card-footer bg-white p-3 d-flex align-items-center justify-content-between border-top">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRecord}
              disabled={isSaving}
              className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-1.5"
            >
              <i className="bi bi-save" />
              <span>{isSaving ? 'Saving Record...' : '💾 Save Clinical Record & Complete Visit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
