'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface AiHealth {
  ok: boolean;
  reason?: string;
  live_checked?: boolean;
  latency_ms?: number;
  answered_by?: string;
  models_consulted?: string[];
  agreement?: number;
  host?: string;
  default_model?: string;
  usable?: string[];
  disabled?: Record<string, string>;
}

/**
 * Live connection state for the Ollama model panel.
 *
 * The whole point is that an outage is visible *before* a doctor generates a
 * note, rather than being discovered afterwards when the output looks
 * suspiciously generic.
 */
export function AiStatusBanner() {
  const [health, setHealth] = useState<AiHealth | null>(null);
  const [checking, setChecking] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const check = useCallback(async (live: boolean) => {
    setChecking(true);
    try {
      const res = await fetch(`/api/ai/health${live ? '?live=1' : ''}`, { cache: 'no-store' });
      setHealth(await res.json());
    } catch (err) {
      setHealth({ ok: false, reason: (err as Error).message });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Configuration only on mount — a live round-trip costs real inference.
    void check(false);
  }, [check]);

  const tone = checking ? 'secondary' : health?.ok ? 'success' : 'danger';
  const usable = health?.usable || [];

  return (
    <div className={`alert alert-${tone} d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 px-3`} role="status">
      <span className="d-flex align-items-center gap-2 small">
        {checking ? (
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
        ) : (
          <i className={`bi ${health?.ok ? 'bi-plugin' : 'bi-exclamation-octagon-fill'}`} aria-hidden="true" />
        )}
        <span>
          {checking
            ? 'Checking the Ollama connection…'
            : health?.ok
              ? `Connected to ${health.host} — ${usable.length} model(s) available${
                  health.live_checked ? ` · live reply from ${health.answered_by} in ${health.latency_ms}ms` : ''
                }`
              : `Ollama is NOT reachable — ${health?.reason || 'unknown error'}. AI features will report failure instead of generating notes.`}
        </span>
      </span>

      <span className="d-flex align-items-center gap-2">
        <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide' : 'Details'}
        </button>
        <button type="button" className="btn btn-sm btn-dark" onClick={() => check(true)} disabled={checking}>
          <i className="bi bi-lightning-charge-fill me-1" aria-hidden="true" />
          Test live
        </button>
      </span>

      {expanded && health && (
        <div className="w-100 small border-top pt-2 mt-1">
          <p className="mb-1">
            <strong>Host:</strong> {health.host || '—'} · <strong>Default model:</strong> {health.default_model || '—'}
          </p>
          <p className="mb-1">
            <strong>Available:</strong> {usable.length ? usable.join(', ') : 'none'}
          </p>
          {health.disabled && Object.keys(health.disabled).length > 0 && (
            <div className="mb-1">
              <strong>Unavailable on this account:</strong>
              <ul className="mb-0 ps-3">
                {Object.entries(health.disabled).map(([model, why]) => (
                  <li key={model}>
                    <code>{model}</code> — {why}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {health.live_checked && (
            <p className="mb-0">
              <strong>Last live test:</strong> {health.models_consulted?.join(', ')} · winner {health.answered_by} ·{' '}
              {health.agreement}% agreement · {health.latency_ms}ms
            </p>
          )}
        </div>
      )}
    </div>
  );
}
