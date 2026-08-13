'use client';

import React, { useState, Suspense } from 'react';
import { INITIAL_TRIAGE_RULES, DynamicTriageRule, evaluateSymptomTriage } from '@/lib/triage-engine';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function AdminRulesPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <Suspense
        fallback={
          <div className="panel blank-panel">
            <div className="blank-state">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <p className="text-muted mb-0">Loading rule configurator…</p>
            </div>
          </div>
        }
      >
        <RuleConfiguratorContent />
      </Suspense>
    </AuthGuard>
  );
}

function RuleConfiguratorContent() {
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
  const [simDuration, setSimDuration] = useState(1);
  const [simRedFlags] = useState<string[]>(['Chest pain radiating to arm or jaw']);
  const [simResult, setSimResult] = useState<ReturnType<typeof evaluateSymptomTriage> | null>(null);

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

  const activeCount = rules.filter((r) => r.active).length;

  return (
    <>
      <div className="page-heading">
        <div className="page-heading-copy">
          <span className="page-icon">
            <i className="bi bi-sliders" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow mb-1">Operations Center</p>
            <h1 className="h3 mb-1">Dynamic Triage Rules Configurator</h1>
            <p className="text-muted mb-0">
              Configure rules-as-data severity thresholds and evaluate simulations in real time.
            </p>
          </div>
        </div>
        <div className="heading-actions">
          <span className="badge text-bg-success">{activeCount} active</span>
          <span className="badge text-bg-secondary">{rules.length} total</span>
        </div>
      </div>

      <div className="alert alert-primary d-flex align-items-start gap-2" role="note">
        <i className="bi bi-info-circle mt-1" aria-hidden="true" />
        <span className="small">
          Rules edited here live in the browser session only — Technical Debt #3 keeps the engine configuration in
          code until the rules table is introduced in v2.0.
        </span>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <section className="panel h-100">
            <div className="panel-header">
              <div>
                <h2 className="h5 mb-1 section-title">
                  <i className="bi bi-list-columns-reverse" aria-hidden="true" />
                  <span>Configured Rules Matrix</span>
                </h2>
                <p className="text-muted mb-0">Triage rules stored as editable data.</p>
              </div>
            </div>

            <div className="d-grid gap-2" style={{ maxHeight: '26rem', overflowY: 'auto' }}>
              {rules.map((rule) => (
                <div className="mini-card" key={rule.id}>
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <span className="d-inline-flex align-items-center gap-2">
                      <span className="eyebrow mb-0">{rule.id}</span>
                      <span className={`urgency-badge urgency-${rule.urgency_output.toLowerCase()}`}>
                        {rule.urgency_output.replace('_', ' ')}
                      </span>
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
                    Category: {rule.category} · Severity threshold: {rule.severity_threshold}/10 · Weight:{' '}
                    {rule.priority_weight}
                  </span>
                  <span>{rule.action_recommendation}</span>
                </div>
              ))}
            </div>

            <form className="pt-3 mt-3 border-top" onSubmit={handleAddRule}>
              <h3 className="h6 mb-3">
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Add custom dynamic triage rule
              </h3>

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
                    placeholder="e.g. Acute abdominal pain"
                    value={newSymptom}
                    onChange={(e) => setNewSymptom(e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="ruleAction">
                    Clinical action directive
                  </label>
                  <input
                    className="form-control"
                    id="ruleAction"
                    type="text"
                    placeholder="e.g. Seek emergency medical attention immediately."
                    value={newRec}
                    onChange={(e) => setNewRec(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn btn-primary w-100 mt-3" type="submit">
                <i className="bi bi-save" aria-hidden="true" /> Save Dynamic Rule
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
                  <span>Pre-Publish Rule Simulator</span>
                </h2>
                <p className="text-muted mb-0">Evaluate a case against the active rule set.</p>
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

            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="simSeverity">
                  Severity: {simSeverity}/10
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

              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="simDuration">
                  Duration (days)
                </label>
                <input
                  className="form-control"
                  id="simDuration"
                  type="number"
                  min={0}
                  value={simDuration}
                  onChange={(e) => setSimDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <button className="btn btn-primary w-100" type="button" onClick={handleRunSimulator}>
              <i className="bi bi-play-fill" aria-hidden="true" /> Run Rule Simulator Test
            </button>

            {simResult && (
              <div className="panel panel-accent mt-3">
                <p className="eyebrow mb-2">Evaluation output</p>
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <div className="score-dial">
                    {simResult.severity_score}
                    <small>/ 100</small>
                  </div>
                  <div>
                    <span className={`urgency-badge urgency-${simResult.urgency_level.toLowerCase()}`}>
                      {simResult.urgency_level.replace('_', ' ')}
                    </span>
                    <p className="fw-semibold mb-0 mt-2">{simResult.recommended_specialty}</p>
                    <p className="text-muted small mb-0">{simResult.action_recommendation}</p>
                  </div>
                </div>

                {simResult.matched_rules.length > 0 && (
                  <p className="text-muted small mb-0 mt-3">
                    Matched rules: <strong>{simResult.matched_rules.join(', ')}</strong>
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
