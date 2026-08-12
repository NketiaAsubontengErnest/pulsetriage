import { Ollama } from 'ollama';

// Configure Ollama client instance & environment keys
const apiKey = process.env.OLLAMA_API_KEY || 'a04ae336855243d2ac4215adc064dfc0.Og0czoZ8437jZPv9ZiuQ9jOW';
const hostUrl = process.env.OLLAMA_HOST || undefined; // uses default or custom host

export const ollamaClient = new Ollama({
  ...(hostUrl ? { host: hostUrl } : {}),
  ...(apiKey ? { headers: { Authorization: `Bearer ${apiKey}`, 'X-API-Key': apiKey } } : {}),
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
  const activeApiKey = process.env.OLLAMA_API_KEY || 'a04ae336855243d2ac4215adc064dfc0.Og0czoZ8437jZPv9ZiuQ9jOW';
  const activeHost = process.env.OLLAMA_HOST || 'https://ollama.com';

  // 1. On Vercel serverless, attempt direct HTTP fetch to Cloud AI Host Endpoint first
  if (activeHost || activeApiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for fast response

      const targetEndpoint = activeHost.endsWith('/') ? `${activeHost}api/chat` : `${activeHost}/api/chat`;
      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeApiKey ? { Authorization: `Bearer ${activeApiKey}`, 'X-API-Key': activeApiKey } : {}),
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
