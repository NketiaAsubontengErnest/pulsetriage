'use client';

import React from 'react';

export interface AIProvenance {
  model: string;
  models_consulted: string[];
  agreement: number;
  method: 'consensus' | 'judge' | 'single' | 'fallback';
}

const METHOD_LABEL: Record<AIProvenance['method'], string> = {
  consensus: 'compared across models',
  judge: 'reviewed and selected',
  single: 'single model',
  fallback: 'rule engine',
};

/**
 * Shows the doctor which models produced an AI answer and how strongly the
 * panel agreed — so a low-consensus suggestion gets read more sceptically, and
 * a rule-engine fallback is never mistaken for a model's opinion.
 */
export const AIProvenanceBadge: React.FC<{ provenance?: AIProvenance | null; className?: string }> = ({
  provenance,
  className = '',
}) => {
  if (!provenance) return null;

  if (provenance.method === 'fallback') {
    return (
      <span
        className={`badge text-bg-secondary d-inline-flex align-items-center gap-1 ${className}`}
        title="No AI model was reachable. This is the deterministic clinical rule-engine output."
      >
        <i className="bi bi-cpu" aria-hidden="true" />
        Rule engine (AI offline)
      </span>
    );
  }

  const panelSize = provenance.models_consulted.length;
  // Free-text clinical notes legitimately diverge in wording, so a middling
  // score is informative ("read this one carefully") rather than an error.
  const tone = provenance.agreement >= 60 ? 'text-bg-success' : provenance.agreement >= 30 ? 'text-bg-warning text-dark' : 'text-bg-secondary';

  return (
    <span className={`d-inline-flex align-items-center gap-1 flex-wrap ${className}`}>
      <span
        className="badge text-bg-dark d-inline-flex align-items-center gap-1"
        title={`Models consulted: ${provenance.models_consulted.join(', ')} — ${METHOD_LABEL[provenance.method]}`}
      >
        <i className="bi bi-stars text-warning" aria-hidden="true" />
        {provenance.model}
      </span>
      {panelSize > 1 && (
        <span
          className={`badge ${tone}`}
          title={`${panelSize} models answered (${provenance.models_consulted.join(', ')}). The winning answer matched the rest of the panel ${provenance.agreement}% of the time — a low score means the models disagreed, so review this suggestion closely.`}
        >
          {panelSize}-model panel · {provenance.agreement}% agreement
        </span>
      )}
    </span>
  );
};
