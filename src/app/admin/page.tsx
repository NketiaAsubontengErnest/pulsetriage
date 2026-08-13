'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { INITIAL_TRIAGE_RULES, DynamicTriageRule, evaluateSymptomTriage } from '@/lib/triage-engine';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { Doctor } from '@/lib/types';
import {
  getDoctors,
  updateDoctor,
  getPatients,
  getTriages,
  getPayments,
  getAuditLogs,
  getAllNotifications,
  markNotificationRead,
  AuditRow,
  NotificationRow,
  PaymentRow,
} from '@/lib/api';

type AdminTab = 'METRICS' | 'RULES' | 'AUDIT' | 'NOTIFICATIONS' | 'DOCTORS';

const TABS: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: 'METRICS', label: 'Metrics & Overview', icon: 'bi-speedometer2' },
  { id: 'RULES', label: 'Triage Rule Editor', icon: 'bi-sliders' },
  { id: 'AUDIT', label: 'Audit Logs', icon: 'bi-file-earmark-text' },
  { id: 'NOTIFICATIONS', label: 'Notification Queue', icon: 'bi-bell' },
  { id: 'DOCTORS', label: 'Doctor Licenses', icon: 'bi-person-badge' },
];

const QUICK_LINKS = [
  { href: '/admin/doctors', icon: 'bi-person-badge', title: 'Doctor Operations', copy: 'Add & verify doctors' },
  { href: '/admin/patients', icon: 'bi-people', title: 'Patient Records', copy: 'EHR & triage history' },
  { href: '/admin/rules', icon: 'bi-sliders', title: 'Triage Rules', copy: 'Engine & simulator' },
  { href: '/admin/audit', icon: 'bi-file-earmark-text', title: 'Audit Trail', copy: 'Security & dispatch logs' },
];

const urgencyBadge = (urgency: string) => `urgency-badge urgency-${urgency.toLowerCase()}`;

export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <AdminDashboardContent />
    </AuthGuard>
  );
}

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>('METRICS');

  // Triage Rules Management State
  const [rules, setRules] = useState<DynamicTriageRule[]>(INITIAL_TRIAGE_RULES);
  const [newSymptom, setNewSymptom] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL');
  const [newSeverity, setNewSeverity] = useState(5);
  const [newUrgency, setNewUrgency] = useState<'EMERGENCY' | 'URGENT' | 'SEMI_URGENT' | 'ROUTINE'>('URGENT');
  const [newRec, setNewRec] = useState('');

  // Rule Simulator State
  const [simCategory, setSimCategory] = useState('CARDIOVASCULAR');
  const [simSymptom, setSimSymptom] = useState('Chest Pain / Pressure');
  const [simSeverity, setSimSeverity] = useState(8);
  const [simDuration] = useState(1);
  const [simRedFlags] = useState<string[]>(['Chest pain radiating to arm or jaw']);
  const [simResult, setSimResult] = useState<ReturnType<typeof evaluateSymptomTriage> | null>(null);

  // Live data pulled from the SQLite-backed API routes
  const { user } = useAuth();
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [notificationsList, setNotificationsList] = useState<NotificationRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentRow[]>([]);
  const [metrics, setMetrics] = useState({
    total_patients: 0,
    active_doctors: 0,
    emergency_triages: 0,
    simulated_revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [docs, patients, triages, payments, logs, notifs] = await Promise.all([
        getDoctors(),
        getPatients(),
        getTriages(),
        getPayments(),
        getAuditLogs(50),
        getAllNotifications(),
      ]);

      setDoctorsList(docs);
      setPaymentLogs(payments);
      setAuditLogs(logs);
      setNotificationsList(notifs);
      setMetrics({
        total_patients: patients.length,
        active_doctors: docs.filter((d) => d.is_verified).length,
        emergency_triages: triages.filter((t) => t.urgency_level === 'EMERGENCY').length,
        simulated_revenue: payments.filter((p) => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0),
      });
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleRuleActive = (ruleId: string) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r)));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymptom || !newRec) return;

    const createdRule: DynamicTriageRule = {
      id: `RULE-00${rules.length + 1}`,
      category: newCategory,
      symptom: newSymptom,
      severity_threshold: newSeverity,
      urgency_output: newUrgency,
      action_recommendation: newRec,
      recommended_specialty: newCategory === 'CARDIOVASCULAR' ? 'Cardiology' : 'General Practice',
      active: true,
      priority_weight: newSeverity * 10,
    };

    setRules([...rules, createdRule]);
    setNewSymptom('');
    setNewRec('');
  };

  const handleRunSimulator = () => {
    setSimResult(
      evaluateSymptomTriage(
        {
          primary_symptom: simSymptom,
          category: simCategory,
          severity: simSeverity,
          duration_days: simDuration,
          red_flags: simRedFlags,
        },
        rules
      )
    );
  };

  const toggleDoctorStatus = async (docId: string) => {
    const target = doctorsList.find((d) => d.id === docId);
    if (!target) return;

    const next = !target.is_verified;
    setDoctorsList((list) => list.map((d) => (d.id === docId ? { ...d, is_verified: next } : d)));
    setMetrics((m) => ({ ...m, active_doctors: m.active_doctors + (next ? 1 : -1) }));
    try {
      await updateDoctor(docId, { is_verified: next, updated_by: user?.email || 'admin' });
      const logs = await getAuditLogs(50);
      setAuditLogs(logs);
    } catch {
      setDoctorsList((list) => list.map((d) => (d.id === docId ? { ...d, is_verified: !next } : d)));
      setMetrics((m) => ({ ...m, active_doctors: m.active_doctors + (next ? -1 : 1) }));
    }
  };

  const handleRetryNotification = async (notifId: string) => {
    setNotificationsList((list) => list.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(notifId);
    } catch {
      setNotificationsList((list) => list.map((n) => (n.id === notifId ? { ...n, is_read: false } : n)));
    }
  };

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-shield-check" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">System Administration</p>
            <h1 className="h3 mb-1">Executive Control &amp; Rule Engine Center</h1>
            <p className="text-muted mb-0">
              Configure triage rules, simulate evaluations, audit transactions and govern technical debt.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={loadData}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span className="small">{loadError}</span>
        </div>
      )}

      <section className="row g-3" aria-label="Admin shortcuts">
        {QUICK_LINKS.map((link) => (
          <div className="col-6 col-xl-3" key={link.href}>
            <Link className="panel h-100 d-block" href={link.href}>
              <div className="d-flex align-items-center justify-content-between">
                <span className="section-title mb-0">
                  <i className={`bi ${link.icon}`} aria-hidden="true" />
                </span>
                <i className="bi bi-arrow-right text-muted" aria-hidden="true" />
              </div>
              <p className="fw-semibold mb-0 mt-3">{link.title}</p>
              <p className="text-muted small mb-0">{link.copy}</p>
            </Link>
          </div>
        ))}
      </section>

      <ul className="nav nav-pills gap-2 mt-3" role="tablist">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab.id} role="presentation">
            <button
              type="button"
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <i className={`bi ${tab.icon} me-1`} aria-hidden="true" />
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* TAB 1 — Metrics */}
      {activeTab === 'METRICS' && (
        <>
          <section className="row g-3 mt-1" aria-label="System metrics">
            <div className="col-12 col-sm-6 col-xl-3">
              <article className="metric-card metric-primary">
                <div className="metric-top">
                  <span className="metric-label">Registered Patients</span>
                  <span className="metric-icon">
                    <i className="bi bi-people" aria-hidden="true" />
                  </span>
                </div>
                <div className="metric-value">{metrics.total_patients}</div>
                <div className="metric-meta">
                  <span>Active profiles</span>
                </div>
              </article>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <article className="metric-card metric-success">
                <div className="metric-top">
                  <span className="metric-label">Verified Doctors</span>
                  <span className="metric-icon">
                    <i className="bi bi-patch-check" aria-hidden="true" />
                  </span>
                </div>
                <div className="metric-value">{metrics.active_doctors}</div>
                <div className="metric-meta">
                  <span>of {doctorsList.length} registered physicians</span>
                </div>
              </article>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <article className="metric-card metric-danger">
                <div className="metric-top">
                  <span className="metric-label">Emergency Triages</span>
                  <span className="metric-icon">
                    <i className="bi bi-exclamation-octagon" aria-hidden="true" />
                  </span>
                </div>
                <div className="metric-value">{metrics.emergency_triages}</div>
                <div className="metric-meta">
                  <span>Red-flag redirected</span>
                </div>
              </article>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <article className="metric-card metric-warning">
                <div className="metric-top">
                  <span className="metric-label">Simulated Revenue</span>
                  <span className="metric-icon">
                    <i className="bi bi-cash-coin" aria-hidden="true" />
                  </span>
                </div>
                <div className="metric-value">GH₵ {metrics.simulated_revenue.toFixed(2)}</div>
                <div className="metric-meta">
                  <span>Mobile Money / card simulation</span>
                </div>
              </article>
            </div>
          </section>

          <section className="panel mt-3">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-credit-card" aria-hidden="true" />
                  <span>Simulated Payment Gateway Logs</span>
                </h2>
                <p className="text-muted mb-0">Technical Debt #1 — transaction ledger.</p>
              </div>
              <span className="badge text-bg-secondary">{paymentLogs.length} transactions</span>
            </div>

            {isLoading ? (
              <p className="text-muted small mb-0">Loading payment logs…</p>
            ) : paymentLogs.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-receipt" aria-hidden="true" />
                <p className="mb-0">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Reference</th>
                      <th scope="col">Provider</th>
                      <th scope="col">Patient</th>
                      <th scope="col">Date</th>
                      <th scope="col">Amount</th>
                      <th scope="col" className="text-end">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="fw-semibold">{log.transaction_ref}</td>
                        <td>{log.provider}</td>
                        <td>{log.patient?.full_name || 'Unknown patient'}</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td className="fw-semibold">GH₵ {log.amount.toFixed(2)}</td>
                        <td className="text-end">
                          <span className="badge text-bg-success">{log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* TAB 2 — Rule editor */}
      {activeTab === 'RULES' && (
        <div className="row g-3 mt-1">
          <div className="col-12 col-xl-6">
            <section className="panel h-100">
              <div className="panel-header">
                <div>
                  <h2 className="h5 mb-1 section-title">
                    <i className="bi bi-sliders" aria-hidden="true" />
                    <span>Configurable Triage Rules</span>
                  </h2>
                  <p className="text-muted mb-0">Triage rules stored as editable data.</p>
                </div>
                <span className="badge text-bg-secondary">{rules.length} rules</span>
              </div>

              <div className="d-grid gap-2" style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                {rules.map((rule) => (
                  <div className="mini-card" key={rule.id}>
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <span className="d-inline-flex align-items-center gap-2">
                        <span className="eyebrow mb-0">{rule.id}</span>
                        <span className={urgencyBadge(rule.urgency_output)}>{rule.urgency_output.replace('_', ' ')}</span>
                      </span>
                      <button
                        className={`btn btn-sm ${rule.active ? 'btn-primary' : 'btn-light'}`}
                        type="button"
                        onClick={() => toggleRuleActive(rule.id)}
                      >
                        {rule.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>
                    <strong>{rule.symptom}</strong>
                    <span>
                      Category: {rule.category} · Severity threshold: {rule.severity_threshold}/10
                    </span>
                    <span>{rule.action_recommendation}</span>
                  </div>
                ))}
              </div>

              <form className="pt-3 mt-3 border-top" onSubmit={handleAddRule}>
                <h3 className="h6 mb-3">Add custom triage rule</h3>

                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <label className="form-label" htmlFor="ruleCategory">
                      Category
                    </label>
                    <select
                      className="form-select"
                      id="ruleCategory"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="CARDIOVASCULAR">CARDIOVASCULAR</option>
                      <option value="RESPIRATORY">RESPIRATORY</option>
                      <option value="NEUROLOGICAL">NEUROLOGICAL</option>
                      <option value="GENERAL">GENERAL</option>
                    </select>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="form-label" htmlFor="ruleUrgency">
                      Urgency output
                    </label>
                    <select
                      className="form-select"
                      id="ruleUrgency"
                      value={newUrgency}
                      onChange={(e) => setNewUrgency(e.target.value as typeof newUrgency)}
                    >
                      <option value="EMERGENCY">EMERGENCY</option>
                      <option value="URGENT">URGENT</option>
                      <option value="SEMI_URGENT">SEMI_URGENT</option>
                      <option value="ROUTINE">ROUTINE</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label" htmlFor="ruleSeverity">
                      Severity threshold: {newSeverity}/10
                    </label>
                    <input
                      className="form-range"
                      id="ruleSeverity"
                      type="range"
                      min={1}
                      max={10}
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(parseInt(e.target.value, 10))}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label" htmlFor="ruleSymptom">
                      Symptom title
                    </label>
                    <input
                      className="form-control"
                      id="ruleSymptom"
                      type="text"
                      placeholder="e.g. Severe migraine with visual aura"
                      value={newSymptom}
                      onChange={(e) => setNewSymptom(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label" htmlFor="ruleRecommendation">
                      Clinical action recommendation
                    </label>
                    <input
                      className="form-control"
                      id="ruleRecommendation"
                      type="text"
                      placeholder="e.g. Neurological evaluation within 24 hours."
                      value={newRec}
                      onChange={(e) => setNewRec(e.target.value)}
                    />
                  </div>
                </div>

                <button className="btn btn-primary w-100 mt-3" type="submit">
                  <i className="bi bi-plus-lg" aria-hidden="true" /> Save Dynamic Triage Rule
                </button>
              </form>
            </section>
          </div>

          <div className="col-12 col-xl-6">
            <section className="panel h-100">
              <div className="panel-header">
                <div>
                  <h2 className="h5 mb-1 section-title">
                    <i className="bi bi-play-circle" aria-hidden="true" />
                    <span>Interactive Rule Simulator</span>
                  </h2>
                  <p className="text-muted mb-0">Try a case before publishing changes.</p>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="simCategory">
                  Simulated category
                </label>
                <select
                  className="form-select"
                  id="simCategory"
                  value={simCategory}
                  onChange={(e) => setSimCategory(e.target.value)}
                >
                  <option value="CARDIOVASCULAR">CARDIOVASCULAR</option>
                  <option value="RESPIRATORY">RESPIRATORY</option>
                  <option value="NEUROLOGICAL">NEUROLOGICAL</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="simSymptom">
                  Simulated primary symptom
                </label>
                <input
                  className="form-control"
                  id="simSymptom"
                  type="text"
                  value={simSymptom}
                  onChange={(e) => setSimSymptom(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="simSeverity">
                  Simulated severity: {simSeverity}/10
                </label>
                <input
                  className="form-range"
                  id="simSeverity"
                  type="range"
                  min={1}
                  max={10}
                  value={simSeverity}
                  onChange={(e) => setSimSeverity(parseInt(e.target.value, 10))}
                />
              </div>

              <button className="btn btn-primary w-100" type="button" onClick={handleRunSimulator}>
                <i className="bi bi-play-fill" aria-hidden="true" /> Evaluate Against Active Rules
              </button>

              {simResult && (
                <div className="panel panel-accent mt-3">
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <div className="score-dial">
                      {simResult.severity_score}
                      <small>/ 100</small>
                    </div>
                    <div>
                      <span className={urgencyBadge(simResult.urgency_level)}>
                        {simResult.urgency_level.replace('_', ' ')}
                      </span>
                      <p className="fw-semibold mb-0 mt-2">{simResult.recommended_specialty}</p>
                      <p className="text-muted small mb-0">{simResult.action_recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 3 — Audit */}
      {activeTab === 'AUDIT' && (
        <section className="panel mt-3">
          <div className="panel-header">
            <div>
              <h2 className="h5 mb-1 section-title">
                <i className="bi bi-file-earmark-text" aria-hidden="true" />
                <span>System Audit Log Stream</span>
              </h2>
              <p className="text-muted mb-0">Append-only activity trail.</p>
            </div>
            <span className="badge text-bg-secondary">{auditLogs.length} events</span>
          </div>

          {isLoading ? (
            <p className="text-muted small mb-0">Loading audit trail…</p>
          ) : auditLogs.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-journal-x" aria-hidden="true" />
              <p className="mb-0">No audit events recorded yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Entity</th>
                    <th scope="col">Action</th>
                    <th scope="col">Actor</th>
                    <th scope="col">Details</th>
                    <th scope="col" className="text-end">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="fw-semibold">{log.entity}</td>
                      <td>
                        <span className="badge text-bg-primary">{log.action}</span>
                      </td>
                      <td>{log.actor}</td>
                      <td className="text-muted small">{log.details}</td>
                      <td className="text-end text-muted small">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 4 — Notification queue */}
      {activeTab === 'NOTIFICATIONS' && (
        <section className="panel mt-3">
          <div className="panel-header">
            <div>
              <h2 className="h5 mb-1 section-title">
                <i className="bi bi-bell" aria-hidden="true" />
                <span>Notification Queue Dispatcher</span>
              </h2>
              <p className="text-muted mb-0">In-app notification queue.</p>
            </div>
            <span className="badge text-bg-secondary">{notificationsList.length} messages</span>
          </div>

          {notificationsList.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-bell-slash" aria-hidden="true" />
              <p className="mb-0">The dispatch queue is empty.</p>
            </div>
          ) : (
            <div className="d-grid gap-2">
              {notificationsList.map((notif) => (
                <div className="settings-row" key={notif.id}>
                  <span>
                    <strong>
                      {notif.title}{' '}
                      <span className={`badge ${notif.is_read ? 'text-bg-success' : 'text-bg-warning'}`}>
                        {notif.is_read ? 'SENT' : 'QUEUED'}
                      </span>
                    </strong>
                    <small>{notif.message}</small>
                  </span>
                  <button
                    className="btn btn-light btn-sm"
                    type="button"
                    onClick={() => handleRetryNotification(notif.id)}
                  >
                    <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Retry
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 5 — Doctor licences */}
      {activeTab === 'DOCTORS' && (
        <section className="panel mt-3">
          <div className="panel-header">
            <div>
              <h2 className="h5 mb-1 section-title">
                <i className="bi bi-person-badge" aria-hidden="true" />
                <span>Doctor License Verification</span>
              </h2>
              <p className="text-muted mb-0">Account governance and access control.</p>
            </div>
            <Link className="btn btn-outline-secondary btn-sm" href="/admin/doctors">
              Full Registry
            </Link>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Doctor</th>
                  <th scope="col">Specialty</th>
                  <th scope="col">License</th>
                  <th scope="col">Fee</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {doctorsList.map((doc) => (
                  <tr key={doc.id}>
                    <td className="fw-semibold">{doc.full_name}</td>
                    <td>{doc.specialization}</td>
                    <td>{doc.license_number}</td>
                    <td>GH₵ {doc.consultation_fee.toFixed(2)}</td>
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
        </section>
      )}
    </>
  );
}
