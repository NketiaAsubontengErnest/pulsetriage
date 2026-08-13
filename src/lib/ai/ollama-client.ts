import { Ollama } from 'ollama';

/**
 * Credentials are read from the environment ONLY.
 *
 * This module previously carried a literal API key as a `||` fallback so that
 * the AI features worked without any configuration. That was technical debt
 * item TD-02 and defect D-02: the key was committed to source and therefore
 * present in repository history. It has been removed.
 *
 * When OLLAMA_API_KEY is absent the AI layer does not silently authenticate as
 * somebody else and it does not crash the application. `queryOllama` raises a
 * clear configuration error, which `queryOllamaJson` converts into the
 * deterministic fallback each caller supplies (FR-9.3). The deterministic
 * triage engine is entirely unaffected — it never calls this module.
 */
const DEFAULT_OLLAMA_HOST = 'https://ollama.com';

/** Reads the API key at call time so a redeployed environment takes effect without a rebuild. */
function readApiKey(): string | undefined {
  const key = process.env.OLLAMA_API_KEY?.trim();
  return key ? key : undefined;
}

function readHost(): string {
  return process.env.OLLAMA_HOST?.trim() || DEFAULT_OLLAMA_HOST;
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

export const DEFAULT_AI_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
export const FALLBACK_MODELS = ['llama3.2', 'llama3', 'qwen2.5', 'mistral', 'gemma2'];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function queryOllama(
  messages: ChatMessage[],
  options?: {
    model?: string;
    jsonFormat?: boolean;
    temperature?: number;
  }
): Promise<string> {
  const modelToUse = options?.model || DEFAULT_AI_MODEL;
  const activeApiKey = readApiKey();
  const activeHost = readHost();

  // Fail fast and explicitly rather than issuing an unauthenticated request.
  // queryOllamaJson catches this and returns the caller's deterministic
  // fallback, so an unconfigured environment degrades the AI feature instead
  // of failing the user's request.
  if (!activeApiKey) {
    throw new Error(
      'AI service is not configured: OLLAMA_API_KEY is missing from the environment.'
    );
  }

  // 1. On Vercel serverless, attempt direct HTTP fetch to Cloud AI Host Endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for fast response

    const targetEndpoint = activeHost.endsWith('/') ? `${activeHost}api/chat` : `${activeHost}/api/chat`;
    const res = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeApiKey}`,
        'X-API-Key': activeApiKey,
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: messages,
        stream: false,
        ...(options?.jsonFormat ? { format: 'json' } : {}),
        options: {
          ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.message?.content) {
        return data.message.content;
      }
    }
  } catch (e) {
    console.warn('[CLOUD LLM FETCH NOTICE] Cloud endpoint fetch failed or timed out. Trying SDK fallback...');
  }

  // 2. Fallback to Ollama SDK instance
  const modelsToTry = Array.from(
    new Set([modelToUse, ...FALLBACK_MODELS])
  );

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    try {
      const response = await ollamaClient.chat({
        model: currentModel,
        messages: messages,
        ...(options?.jsonFormat ? { format: 'json' } : {}),
        options: {
          ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
        },
      });

      return response.message.content || '';
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || error?.error || '';

      if (errorMsg.includes('requires both a Pro') || errorMsg.includes('upgrade for access') || error?.status_code === 403) {
        console.warn(`[OLLAMA MODEL NOTICE] Model '${currentModel}' requires upgraded cloud plan. Trying fallback...`);
        continue;
      }
      console.warn(`[OLLAMA MODEL RETRY] Failed with model '${currentModel}'. Retrying next model...`);
    }
  }

  console.error(`[OLLAMA ALL MODELS EXHAUSTED] Could not query Ollama models (${modelsToTry.join(', ')}). Using safe fallback.`);
  throw lastError || new Error('Ollama service unavailable');
}

/**
 * Safely query Ollama expecting a JSON response object.
 * Extracts and parses JSON even if wrapped in markdown code blocks.
 * Returns structured fallback if Ollama cloud model is unreachable.
 */
export async function queryOllamaJson<T>(
  messages: ChatMessage[],
  fallback: T,
  options?: { model?: string; temperature?: number }
): Promise<T> {
  try {
    const rawText = await queryOllama(messages, {
      ...options,
      jsonFormat: true,
    });

    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.info('[AI SYSTEM NOTICE] Operating in rule-engine fallback mode.');
    return fallback;
  }
}
