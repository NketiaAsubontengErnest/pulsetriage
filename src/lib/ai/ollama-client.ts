import { Ollama } from 'ollama';

/**
 * Ollama Cloud inference client for PulseTriage.
 *
 * Credentials are read from the environment ONLY (technical debt item TD-02 /
 * defect D-02: a literal API key used to sit in this file as a `||` fallback and
 * is therefore in repository history). Set OLLAMA_API_KEY in `.env.local`.
 *
 * When OLLAMA_API_KEY is absent the AI layer does not silently authenticate as
 * somebody else and it does not crash the application. `queryOllama` raises a
 * clear configuration error, which `queryOllamaJson` converts into the
 * deterministic fallback each caller supplies (FR-9.3). The deterministic
 * triage engine is entirely unaffected — it never calls this module.
 *
 * ── Multi-model ensemble ────────────────────────────────────────────────────
 * Ollama Cloud hosts several frontier models. Rather than trusting one of them,
 * the clinical helpers fan the same prompt out to several models in parallel and
 * pick the best answer (see `queryOllamaEnsemble` / `queryOllamaJsonEnsemble`).
 * Models the account is not entitled to are detected on first use and skipped
 * from then on, so an unsubscribed roster entry costs one request per process,
 * not one per consultation.
 */
const DEFAULT_OLLAMA_HOST = 'https://ollama.com';

/**
 * Preference-ordered roster. The premium models are listed first: on an account
 * that is entitled to them they win, and on an account that is not they are
 * disabled after a single 403 and the open-weight models below carry the load.
 * Override with OLLAMA_MODELS="a,b,c".
 */
const DEFAULT_MODEL_ROSTER = [
  'kimi-k3',
  'deepseek-v4-pro',
  'deepseek-v4-flash:preview',
  'qwen3.5:397b',
  'gemma4:31b',
  'gpt-oss:120b',
  'minimax-m3',
  'nemotron-3-nano:30b',
  'gpt-oss:20b',
];

/** Single-model calls use this. Fast, entitlement-free on the base plan, no chain-of-thought preamble. */
const DEFAULT_MODEL = 'gemma4:31b';

/** How many roster models an ensemble call fans out to. */
const DEFAULT_ENSEMBLE_SIZE = 3;

/** Per-model request budget. Cloud models take 1-7s; the old 6s cap was cutting off good answers. */
const REQUEST_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 25000;

/**
 * Once enough of the panel has answered, a straggler only gets this much longer
 * before the comparison runs without it. Without this the whole request is
 * paced by the single slowest model, which pushed SOAP generation past the
 * serverless function limit.
 */
const STRAGGLER_GRACE_MS = Number(process.env.OLLAMA_STRAGGLER_MS) || 4000;

/**
 * Hard ceiling on how long the panel waits after the *first* answer lands. A
 * long SOAP note can take one model four times as long as another, and a
 * comparison that never arrives is worth less than a good answer that does.
 */
const FIRST_ANSWER_GRACE_MS = Number(process.env.OLLAMA_FIRST_ANSWER_MS) || 9000;

/** The comparison needs at least this many answers before stragglers are dropped. */
const MIN_PANEL = 2;

/** Reads the API key at call time so a redeployed environment takes effect without a rebuild. */
function readApiKey(): string | undefined {
  const key = process.env.OLLAMA_API_KEY?.trim().replace(/^["']|["']$/g, '');
  return key ? key : undefined;
}

function readHost(): string {
  return process.env.OLLAMA_HOST?.trim().replace(/^["']|["']$/g, '') || DEFAULT_OLLAMA_HOST;
}

function readRoster(): string[] {
  const configured = process.env.OLLAMA_MODELS?.trim();
  if (configured) {
    const list = configured
      .split(',')
      .map((m) => m.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
    if (list.length) return list;
  }
  return DEFAULT_MODEL_ROSTER;
}

/** True when the AI layer is configured. Callers may use this to hide AI affordances. */
export function isAiConfigured(): boolean {
  return readApiKey() !== undefined;
}

const initialApiKey = readApiKey();
const initialHost = process.env.OLLAMA_HOST?.trim() || undefined;

if (!initialApiKey && process.env.NODE_ENV !== 'test') {
  console.warn(
    '[AI CONFIG] OLLAMA_API_KEY is not set. AI-assisted features will return their ' +
      'deterministic fallbacks. The rule-based triage engine is unaffected.'
  );
}

export const ollamaClient = new Ollama({
  ...(initialHost ? { host: initialHost } : {}),
  ...(initialApiKey
    ? { headers: { Authorization: `Bearer ${initialApiKey}`, 'X-API-Key': initialApiKey } }
    : {}),
});

export const DEFAULT_AI_MODEL =
  process.env.OLLAMA_MODEL?.trim().replace(/^["']|["']$/g, '') || DEFAULT_MODEL;

export const FALLBACK_MODELS = DEFAULT_MODEL_ROSTER;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Models this account may not use (wrong plan, retired tag, …). Populated at
 * runtime from the provider's own error text so the roster self-heals instead of
 * needing a code change when an entitlement is added or removed.
 */
const disabledModels = new Map<string, string>();

function isEntitlementError(message: string, statusCode?: number): boolean {
  const text = message.toLowerCase();
  return (
    statusCode === 403 ||
    statusCode === 404 ||
    text.includes('requires a subscription') ||
    text.includes('requires both a pro') ||
    text.includes('upgrade for access') ||
    text.includes('extra usage') ||
    text.includes('not found') ||
    text.includes('does not exist')
  );
}

/** Roster entries this account can actually reach, best-first. */
function usableModels(preferred?: string): string[] {
  const roster = readRoster();
  const ordered = preferred ? [preferred, ...roster] : roster;
  return Array.from(new Set(ordered)).filter((m) => !disabledModels.has(m));
}

/** Diagnostics for the /api/ai/health endpoint and server logs. */
export function getAiRosterStatus() {
  return {
    configured: isAiConfigured(),
    host: readHost(),
    default_model: DEFAULT_AI_MODEL,
    roster: readRoster(),
    usable: usableModels(),
    disabled: Object.fromEntries(disabledModels),
  };
}

/** Strips reasoning scaffolding some models emit inside the visible content. */
function stripReasoning(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\|channel\|>[\s\S]*?<\|message\|>/gi, '')
    .trim();
}

/** One HTTP round-trip to a single model. Throws on any non-success. */
async function callModel(
  model: string,
  messages: ChatMessage[],
  options?: { jsonFormat?: boolean; temperature?: number; timeoutMs?: number }
): Promise<string> {
  const apiKey = readApiKey();
  if (!apiKey) {
    throw new Error('AI service is not configured: OLLAMA_API_KEY is missing from the environment.');
  }

  const host = readHost();
  const endpoint = host.endsWith('/') ? `${host}api/chat` : `${host}/api/chat`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options?.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        ...(options?.jsonFormat ? { format: 'json' } : {}),
        options: {
          ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
        },
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    const raw = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      /* non-JSON error body — handled below */
    }

    if (!res.ok || data?.error) {
      const message = String(data?.error || raw || `HTTP ${res.status}`);
      if (isEntitlementError(message, res.status)) {
        disabledModels.set(model, message.slice(0, 160));
        console.warn(`[AI ROSTER] '${model}' is not available on this account — removed from the roster.`);
      }
      throw new Error(`${model}: ${message}`);
    }

    const content = stripReasoning(String(data?.message?.content ?? ''));
    if (!content) throw new Error(`${model}: empty response`);
    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Query a single model, walking down the roster when one is unavailable.
 * Kept for backwards compatibility and for latency-sensitive callers.
 */
export async function queryOllama(
  messages: ChatMessage[],
  options?: {
    model?: string;
    jsonFormat?: boolean;
    temperature?: number;
    timeoutMs?: number;
  }
): Promise<string> {
  if (!readApiKey()) {
    // Fail fast and explicitly rather than issuing an unauthenticated request.
    // queryOllamaJson catches this and returns the caller's deterministic
    // fallback, so an unconfigured environment degrades the AI feature instead
    // of failing the user's request.
    throw new Error('AI service is not configured: OLLAMA_API_KEY is missing from the environment.');
  }

  const candidates = usableModels(options?.model || DEFAULT_AI_MODEL);
  let lastError: unknown = null;

  for (const model of candidates) {
    try {
      return await callModel(model, messages, options);
    } catch (error: any) {
      lastError = error;
      console.warn(`[AI RETRY] '${model}' failed (${error?.message || error}). Trying next model…`);
    }
  }

  // Everything on the roster is unusable — fall back to the SDK, which also
  // covers a locally running `ollama serve` on OLLAMA_HOST.
  try {
    const response = await ollamaClient.chat({
      model: options?.model || DEFAULT_AI_MODEL,
      messages,
      ...(options?.jsonFormat ? { format: 'json' } : {}),
      options: {
        ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
      },
    });
    const content = stripReasoning(response.message.content || '');
    if (content) return content;
  } catch (error) {
    lastError = error;
  }

  console.error(`[AI EXHAUSTED] No usable model among: ${candidates.join(', ') || '(none)'}.`);
  throw lastError || new Error('Ollama service unavailable');
}

// ──────────────────────────────────────────────────────────────────────────────
// JSON extraction
// ──────────────────────────────────────────────────────────────────────────────

/** Pulls the first balanced JSON object/array out of a model reply. */
export function extractJson(text: string): string | null {
  const cleaned = stripReasoning(text)
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.search(/[{[]/);
  if (start === -1) return null;

  const opener = cleaned[start];
  const closer = opener === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"') {
      inString = !inString;
    } else if (!inString) {
      if (char === opener) depth += 1;
      else if (char === closer) {
        depth -= 1;
        if (depth === 0) return cleaned.slice(start, i + 1);
      }
    }
  }
  return null;
}

function parseJsonReply<T>(text: string): T | null {
  const candidate = extractJson(text);
  if (!candidate) return null;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

/**
 * Safely query expecting a JSON response object.
 * Extracts and parses JSON even if wrapped in markdown code blocks.
 * Returns the caller's structured fallback if the cloud models are unreachable.
 */
export async function queryOllamaJson<T>(
  messages: ChatMessage[],
  fallback: T,
  options?: { model?: string; temperature?: number; timeoutMs?: number }
): Promise<T> {
  try {
    const rawText = await queryOllama(messages, { ...options, jsonFormat: true });
    const parsed = parseJsonReply<T>(rawText);
    if (parsed !== null) return parsed;
    throw new Error('model returned no parsable JSON');
  } catch (err) {
    console.info(`[AI SYSTEM NOTICE] Operating in rule-engine fallback mode. (${(err as Error)?.message})`);
    return fallback;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Multi-model ensemble — ask several models, compare, return the best
// ──────────────────────────────────────────────────────────────────────────────

export interface EnsembleCandidate {
  model: string;
  content: string;
  latency_ms: number;
}

export interface EnsembleResult<T> {
  /** The winning answer. */
  value: T;
  /** Which model produced it. */
  model: string;
  /** Every model that answered, best-first. */
  models_consulted: string[];
  /** 0-100: how strongly the panel agreed with the winner. */
  agreement: number;
  /** How the winner was chosen. */
  method: 'consensus' | 'judge' | 'single' | 'fallback';
}

interface EnsembleOptions {
  /** How many models to fan out to. */
  size?: number;
  /** Force this model to be one of them. */
  model?: string;
  temperature?: number;
  timeoutMs?: number;
  /** Text mode only: ask a model to pick the winner instead of scoring heuristically. */
  useJudge?: boolean;
}

/** Fans one prompt out to the top N usable models, in parallel. */
async function fanOut(
  messages: ChatMessage[],
  options: EnsembleOptions & { jsonFormat?: boolean }
): Promise<EnsembleCandidate[]> {
  if (!readApiKey()) {
    throw new Error('AI service is not configured: OLLAMA_API_KEY is missing from the environment.');
  }

  const size = Math.max(1, options.size ?? DEFAULT_ENSEMBLE_SIZE);
  // One spare, so a single entitlement failure does not shrink the panel below
  // the two answers the comparison needs.
  const pool = usableModels(options.model).slice(0, size + 2);
  if (!pool.length) throw new Error('No usable AI models are configured.');

  const answers: EnsembleCandidate[] = [];
  const failures: unknown[] = [];

  // Resolve as soon as the panel is quorate rather than waiting on the slowest
  // model in the pool.
  let finish: () => void = () => {};
  const quorumReached = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let graceTimer: ReturnType<typeof setTimeout> | null = null;
  let settledCount = 0;
  // Absolute, monotonically shrinking deadline: a later event may bring the
  // cut-off forward but never push it back.
  let deadlineAt = Number.POSITIVE_INFINITY;

  const bringDeadlineForward = (at: number) => {
    if (at >= deadlineAt) return;
    deadlineAt = at;
    if (graceTimer) clearTimeout(graceTimer);
    graceTimer = setTimeout(finish, Math.max(0, at - Date.now()));
  };

  const quorum = Math.min(MIN_PANEL, size);

  const onSettled = () => {
    settledCount += 1;
    if (settledCount === pool.length) {
      finish();
    } else if (answers.length >= quorum) {
      bringDeadlineForward(Date.now() + STRAGGLER_GRACE_MS);
    } else if (answers.length >= 1) {
      bringDeadlineForward(Date.now() + FIRST_ANSWER_GRACE_MS);
    }
  };

  const all = Promise.allSettled(
    pool.map(async (model) => {
      const startedAt = Date.now();
      try {
        const content = await callModel(model, messages, {
          jsonFormat: options.jsonFormat,
          temperature: options.temperature,
          timeoutMs: options.timeoutMs,
        });
        answers.push({ model, content, latency_ms: Date.now() - startedAt });
      } catch (err) {
        failures.push(err);
      } finally {
        onSettled();
      }
    })
  );

  await Promise.race([quorumReached, all]);
  if (graceTimer) clearTimeout(graceTimer);

  if (!answers.length) {
    throw failures[0] ?? new Error('Every model in the ensemble failed.');
  }

  // Preserve roster preference order so a tie falls to the better model.
  return answers.slice().sort((a, b) => pool.indexOf(a.model) - pool.indexOf(b.model)).slice(0, size);
}

// ── Answer comparison ────────────────────────────────────────────────────────

function normaliseScalar(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(normaliseScalar).sort().join('|');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).trim().toLowerCase();
}

/** Word-overlap similarity, 0-1. Cheap and good enough to rank prose answers. */
function textSimilarity(a: string, b: string): number {
  const tokenise = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
  const setA = tokenise(a);
  const setB = tokenise(b);
  if (!setA.size || !setB.size) return 0;
  let shared = 0;
  setA.forEach((w) => {
    if (setB.has(w)) shared += 1;
  });
  return shared / Math.min(setA.size, setB.size);
}

/** How closely two parsed objects agree, field by field. 0-1. */
function objectAgreement(a: any, b: any): number {
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return normaliseScalar(a) === normaliseScalar(b) ? 1 : 0;
  }
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  if (!keys.length) return 1;

  let total = 0;
  for (const key of keys) {
    const left = a[key];
    const right = b[key];
    if (typeof left === 'string' && typeof right === 'string' && left.length > 40) {
      total += textSimilarity(left, right);
    } else if (typeof left === 'number' && typeof right === 'number') {
      const spread = Math.max(Math.abs(left), Math.abs(right), 1);
      total += Math.max(0, 1 - Math.abs(left - right) / spread);
    } else {
      total += normaliseScalar(left) === normaliseScalar(right) ? 1 : 0;
    }
  }
  return total / keys.length;
}

/** Rewards answers that filled in every field rather than returning stubs. */
function completeness(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'string') return Math.min(value.trim().length / 160, 1);
  if (Array.isArray(value)) return value.length ? Math.min(value.length / 3, 1) : 0;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return 0;
    return keys.reduce((sum, k) => sum + completeness(value[k]), 0) / keys.length;
  }
  return 1;
}

/**
 * Ask several models the same question and return the answer the panel agrees
 * with most — the "compare and give the best answer" behaviour the clinical
 * tools rely on. Falls back to the caller's deterministic value if every model
 * is unreachable.
 */
export async function queryOllamaJsonEnsemble<T>(
  messages: ChatMessage[],
  fallback: T,
  options: EnsembleOptions = {}
): Promise<EnsembleResult<T>> {
  try {
    const candidates = await fanOut(messages, { ...options, jsonFormat: true });

    const parsed = candidates
      .map((c) => ({ ...c, value: parseJsonReply<T>(c.content) }))
      .filter((c): c is EnsembleCandidate & { value: T } => c.value !== null);

    if (!parsed.length) throw new Error('No model returned parsable JSON.');

    if (parsed.length === 1) {
      return {
        value: parsed[0].value,
        model: parsed[0].model,
        models_consulted: parsed.map((p) => p.model),
        agreement: 100,
        method: 'single',
      };
    }

    // Score every answer by how much the rest of the panel agrees with it,
    // breaking ties on completeness so a fuller clinical note wins.
    const scored = parsed.map((candidate) => {
      const peers = parsed.filter((p) => p !== candidate);
      const consensus = peers.reduce((sum, p) => sum + objectAgreement(candidate.value, p.value), 0) / peers.length;
      return { ...candidate, consensus, score: consensus * 0.75 + completeness(candidate.value) * 0.25 };
    });

    scored.sort((a, b) => b.score - a.score);
    const winner = scored[0];

    console.info(
      `[AI ENSEMBLE] ${scored.length} models compared — winner '${winner.model}' ` +
        `(agreement ${Math.round(winner.consensus * 100)}%): ` +
        scored.map((s) => `${s.model}=${s.score.toFixed(2)}@${s.latency_ms}ms`).join(', ')
    );

    return {
      value: winner.value,
      model: winner.model,
      models_consulted: scored.map((s) => s.model),
      agreement: Math.round(winner.consensus * 100),
      method: 'consensus',
    };
  } catch (err) {
    console.info(`[AI SYSTEM NOTICE] Ensemble unavailable, using deterministic fallback. (${(err as Error)?.message})`);
    return { value: fallback, model: 'rule-engine', models_consulted: [], agreement: 0, method: 'fallback' };
  }
}

/** Judge prompt used to pick the best free-text answer. */
async function judgeAnswers(
  question: string,
  candidates: EnsembleCandidate[],
  timeoutMs?: number
): Promise<number | null> {
  const roster = usableModels();
  const judgeModel = roster.find((m) => m === 'gemma4:31b') || roster[0];
  if (!judgeModel) return null;

  const numbered = candidates.map((c, i) => `### Answer ${i + 1}\n${c.content}`).join('\n\n');

  try {
    const verdict = await callModel(
      judgeModel,
      [
        {
          role: 'system',
          content:
            'You are a senior clinical reviewer choosing between candidate answers from different AI models. ' +
            'Judge on medical accuracy, safety (does it escalate red flags?), completeness and clarity. ' +
            'Return ONLY JSON: {"best": <1-based index of the best answer>, "why": "<one short sentence>"}',
        },
        { role: 'user', content: `Question:\n${question}\n\nCandidate answers:\n${numbered}` },
      ],
      { jsonFormat: true, temperature: 0, timeoutMs }
    );

    const parsed = parseJsonReply<{ best?: number }>(verdict);
    const best = Number(parsed?.best);
    if (Number.isInteger(best) && best >= 1 && best <= candidates.length) return best - 1;
  } catch (err) {
    console.warn(`[AI JUDGE] Falling back to consensus scoring. (${(err as Error)?.message})`);
  }
  return null;
}

/**
 * Free-text version of the ensemble: several models answer, then either a judge
 * model or word-overlap consensus picks the winner.
 */
export async function queryOllamaEnsemble(
  messages: ChatMessage[],
  options: EnsembleOptions = {}
): Promise<EnsembleResult<string>> {
  const candidates = await fanOut(messages, options);

  if (candidates.length === 1) {
    return {
      value: candidates[0].content,
      model: candidates[0].model,
      models_consulted: [candidates[0].model],
      agreement: 100,
      method: 'single',
    };
  }

  const scored = candidates.map((candidate) => {
    const peers = candidates.filter((c) => c !== candidate);
    const consensus = peers.reduce((sum, p) => sum + textSimilarity(candidate.content, p.content), 0) / peers.length;
    // Long enough to be substantive, not so long it rambles.
    const lengthFit = Math.min(candidate.content.length / 600, 1);
    return { ...candidate, consensus, score: consensus * 0.7 + lengthFit * 0.3 };
  });

  scored.sort((a, b) => b.score - a.score);
  let winner = scored[0];
  let method: EnsembleResult<string>['method'] = 'consensus';

  if (options.useJudge) {
    const question = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
    const chosen = await judgeAnswers(question, candidates, options.timeoutMs);
    if (chosen !== null) {
      const picked = scored.find((s) => s.model === candidates[chosen].model);
      if (picked) {
        winner = picked;
        method = 'judge';
      }
    }
  }

  console.info(
    `[AI ENSEMBLE] ${scored.length} models compared via ${method} — winner '${winner.model}' ` +
      `(${scored.map((s) => `${s.model}=${s.score.toFixed(2)}`).join(', ')})`
  );

  return {
    value: winner.content,
    model: winner.model,
    models_consulted: scored.map((s) => s.model),
    agreement: Math.round(winner.consensus * 100),
    method,
  };
}
