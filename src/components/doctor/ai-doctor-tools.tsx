'use client';

import React, { useState } from 'react';
import { AIProvenanceBadge } from '@/components/ai/ai-provenance-badge';

export function AIDoctorTools() {
  const [activeTab, setActiveTab] = useState<'soap' | 'lab' | 'noshow'>('soap');

  // SOAP State
  const [transcript, setTranscript] = useState('');
  const [soapLoading, setSoapLoading] = useState(false);
  const [soapResult, setSoapResult] = useState<any>(null);

  // Lab State
  const [labText, setLabText] = useState('');
  const [labLoading, setLabLoading] = useState(false);
  const [labResult, setLabResult] = useState<any>(null);

  // No-Show State
  const [leadDays, setLeadDays] = useState(3);
  const [pastNoShows, setPastNoShows] = useState(1);
  const [noShowLoading, setNoShowLoading] = useState(false);
  const [noShowResult, setNoShowResult] = useState<any>(null);

  const handleGenerateSoap = async () => {
    if (!transcript.trim()) return;
    setSoapLoading(true);
    setSoapResult(null);

    try {
      const res = await fetch('/api/ai/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (data.success) setSoapResult(data.soapNote);
    } catch (e) {
      console.error(e);
    } finally {
      setSoapLoading(false);
    }
  };

  const handleAnalyzeLab = async () => {
    if (!labText.trim()) return;
    setLabLoading(true);
    setLabResult(null);

    try {
      const res = await fetch('/api/ai/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText: labText }),
      });
      const data = await res.json();
      if (data.success) setLabResult(data.analysis);
    } catch (e) {
      console.error(e);
    } finally {
      setLabLoading(false);
    }
  };

  const handlePredictNoShow = async () => {
    setNoShowLoading(true);
    setNoShowResult(null);

    try {
      const res = await fetch('/api/ai/no-show-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_time_days: leadDays, past_no_shows_count: pastNoShows }),
      });
      const data = await res.json();
      if (data.success) setNoShowResult(data.prediction);
    } catch (e) {
      console.error(e);
    } finally {
      setNoShowLoading(false);
    }
  };

  return (
    <section className="panel mb-4">
      <div className="panel-header flex-wrap gap-2">
        <div>
          <h2 className="h5 mb-1 section-title">
            <i className="bi bi-stars text-warning me-2" aria-hidden="true" />
            <span>Clinical AI Suite</span>
            <span className="badge text-bg-warning text-dark ms-2" style={{ fontSize: '10px' }}>
              Ollama Cloud
            </span>
          </h2>
          <p className="text-muted mb-0">
            Multi-model panel on Ollama Cloud • every request is answered by several models and the best-agreed answer
            is shown
          </p>
        </div>

        {/* Navigation Tabs (Bootstrap Nav Pills) */}
        <div className="nav nav-pills gap-1 bg-light p-1 rounded border">
          <button
            type="button"
            className={`nav-link btn-sm d-flex align-items-center gap-1.5 ${activeTab === 'soap' ? 'active' : ''}`}
            onClick={() => setActiveTab('soap')}
          >
            <i className="bi bi-file-earmark-text" aria-hidden="true" />
            <span>SOAP Generator</span>
          </button>

          <button
            type="button"
            className={`nav-link btn-sm d-flex align-items-center gap-1.5 ${activeTab === 'lab' ? 'active' : ''}`}
            onClick={() => setActiveTab('lab')}
          >
            <i className="bi bi-file-earmark-check" aria-hidden="true" />
            <span>Lab Result Analyzer</span>
          </button>

          <button
            type="button"
            className={`nav-link btn-sm d-flex align-items-center gap-1.5 ${activeTab === 'noshow' ? 'active' : ''}`}
            onClick={() => setActiveTab('noshow')}
          >
            <i className="bi bi-activity" aria-hidden="true" />
            <span>No-Show Predictor</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SOAP Generator */}
      {activeTab === 'soap' && (
        <div className="pt-2">
          <div className="mb-3">
            <label className="form-label fw-semibold" htmlFor="soapTranscript">
              Paste Visit Transcript or Unstructured Clinical Notes:
            </label>
            <textarea
              id="soapTranscript"
              className="form-control"
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Patient presents with 3-day history of sharp chest tightness on exertion, dry cough, mild dyspnea. BP 130/85, Pulse 82, Temp 37.1 C. Prescribed inhaler..."
            />
          </div>

          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={handleGenerateSoap}
            disabled={soapLoading || !transcript.trim()}
          >
            <i className={soapLoading ? 'bi bi-arrow-repeat spin' : 'bi bi-stars text-warning'} aria-hidden="true" />
            <span>{soapLoading ? 'Generating SOAP Notes...' : 'Generate Structured SOAP Note'}</span>
          </button>

          {soapResult && (
            <div className="card mt-3 border-primary-subtle bg-light">
              <div className="card-header bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="fw-bold text-primary d-flex align-items-center gap-2">
                  <i className="bi bi-check2-circle text-success" aria-hidden="true" />
                  Generated Clinical SOAP Note
                </span>
                <span className="d-flex align-items-center gap-2 flex-wrap">
                  <AIProvenanceBadge provenance={soapResult.ai_provenance} />
                  <span className="badge text-bg-info">ICD-10 Available</span>
                </span>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-white border rounded">
                      <strong className="text-primary d-block mb-1">Subjective (S)</strong>
                      <p className="mb-0 small text-dark" style={{ whiteSpace: 'pre-line' }}>
                        {soapResult.subjective}
                      </p>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-white border rounded">
                      <strong className="text-primary d-block mb-1">Objective (O)</strong>
                      <p className="mb-0 small text-dark" style={{ whiteSpace: 'pre-line' }}>
                        {soapResult.objective}
                      </p>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-white border rounded">
                      <strong className="text-primary d-block mb-1">Assessment (A)</strong>
                      <p className="mb-0 small text-dark" style={{ whiteSpace: 'pre-line' }}>
                        {soapResult.assessment}
                      </p>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-white border rounded">
                      <strong className="text-primary d-block mb-1">Plan (P)</strong>
                      <p className="mb-0 small text-dark" style={{ whiteSpace: 'pre-line' }}>
                        {soapResult.plan}
                      </p>
                    </div>
                  </div>
                </div>

                {soapResult.icd10_suggestions?.length > 0 && (
                  <div className="mt-3 pt-2 border-top d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-semibold text-muted small">Suggested ICD-10 Codes:</span>
                    {soapResult.icd10_suggestions.map((icd: string, idx: number) => (
                      <span key={idx} className="badge text-bg-secondary font-mono">
                        {icd}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Lab Analyzer */}
      {activeTab === 'lab' && (
        <div className="pt-2">
          <div className="mb-3">
            <label className="form-label fw-semibold" htmlFor="labText">
              Paste Raw Diagnostic / Lab Report Text:
            </label>
            <textarea
              id="labText"
              className="form-control"
              rows={4}
              value={labText}
              onChange={(e) => setLabText(e.target.value)}
              placeholder="e.g. COMPLETE BLOOD COUNT (CBC): Hemoglobin: 11.2 g/dL (Low), WBC: 12.8 x10^3/uL (High). FASTING GLUCOSE: 142 mg/dL..."
            />
          </div>

          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={handleAnalyzeLab}
            disabled={labLoading || !labText.trim()}
          >
            <i className={labLoading ? 'bi bi-arrow-repeat spin' : 'bi bi-stars text-warning'} aria-hidden="true" />
            <span>{labLoading ? 'Analyzing Report...' : 'Analyze Lab Report with AI'}</span>
          </button>

          {labResult && (
            <div className="card mt-3 border-primary-subtle bg-light">
              <div className="card-header bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="fw-bold text-dark">Lab Analysis Summary</span>
                <span className="d-flex align-items-center gap-2 flex-wrap">
                  <AIProvenanceBadge provenance={labResult.ai_provenance} />
                  <span
                    className={`badge ${
                      labResult.risk_level === 'CRITICAL'
                        ? 'text-bg-danger'
                        : labResult.risk_level === 'ACTION_REQUIRED'
                        ? 'text-bg-warning text-dark'
                        : 'text-bg-success'
                    }`}
                  >
                    Risk: {labResult.risk_level}
                  </span>
                </span>
              </div>
              <div className="card-body">
                <p className="fw-semibold text-secondary">{labResult.document_summary}</p>

                {labResult.key_findings?.length > 0 && (
                  <div className="table-responsive bg-white rounded border mb-3">
                    <table className="table align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>Parameter</th>
                          <th>Measured Value</th>
                          <th>Reference Range</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labResult.key_findings.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="fw-semibold">{item.parameter}</td>
                            <td>{item.value}</td>
                            <td className="text-muted">{item.reference_range}</td>
                            <td>
                              <span
                                className={`badge ${
                                  item.status === 'HIGH' || item.status === 'ABNORMAL'
                                    ? 'text-bg-danger'
                                    : item.status === 'LOW'
                                    ? 'text-bg-warning text-dark'
                                    : 'text-bg-success'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="alert alert-info mb-0">
                  <strong className="d-block mb-1">Patient Friendly Summary:</strong>
                  <span>{labResult.patient_summary}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: No-Show Predictor */}
      {activeTab === 'noshow' && (
        <div className="pt-2">
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="leadDays">
                Lead Time (Days before visit)
              </label>
              <input
                id="leadDays"
                type="number"
                min={0}
                max={60}
                className="form-control"
                value={leadDays}
                onChange={(e) => setLeadDays(Number(e.target.value))}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="pastNoShows">
                Past No-Show Count
              </label>
              <input
                id="pastNoShows"
                type="number"
                min={0}
                max={10}
                className="form-control"
                value={pastNoShows}
                onChange={(e) => setPastNoShows(Number(e.target.value))}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={handlePredictNoShow}
            disabled={noShowLoading}
          >
            <i className={noShowLoading ? 'bi bi-arrow-repeat spin' : 'bi bi-stars text-warning'} aria-hidden="true" />
            <span>Calculate No-Show Risk</span>
          </button>

          {noShowResult && (
            <div className="card mt-3 border-primary-subtle bg-light">
              <div className="card-header bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="fw-bold text-dark">No-Show Risk Assessment</span>
                <span className="d-flex align-items-center gap-2 flex-wrap">
                  <AIProvenanceBadge provenance={noShowResult.ai_provenance} />
                  <span
                    className={`badge ${
                      noShowResult.risk_tier === 'HIGH'
                        ? 'text-bg-danger'
                        : noShowResult.risk_tier === 'MEDIUM'
                        ? 'text-bg-warning text-dark'
                        : 'text-bg-success'
                    }`}
                  >
                    {noShowResult.no_show_probability}% Probability ({noShowResult.risk_tier} Risk)
                  </span>
                </span>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <strong className="text-secondary d-block mb-1">Risk Factors Identified:</strong>
                  <ul className="mb-0 small text-muted">
                    {noShowResult.risk_factors?.map((rf: string, i: number) => (
                      <li key={i}>{rf}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong className="text-primary d-block mb-1">Recommended Interventions:</strong>
                  <ul className="mb-0 small fw-semibold text-dark">
                    {noShowResult.recommended_interventions?.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
