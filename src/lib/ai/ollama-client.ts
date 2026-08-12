import { Ollama } from 'ollama';

// Configure Ollama client instance
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
  const modelsToTry = Array.from(
    new Set([options?.model || DEFAULT_AI_MODEL, ...FALLBACK_MODELS])
  );

  let lastError: any = null;

  for (const modelToUse of modelsToTry) {
    try {
      const response = await ollamaClient.chat({
        model: modelToUse,
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
      
      // If error indicates paid plan required (403), try next model silently
      if (errorMsg.includes('requires both a Pro') || errorMsg.includes('upgrade for access') || error?.status_code === 403) {
        console.warn(`[OLLAMA MODEL NOTICE] Model '${modelToUse}' requires upgraded cloud plan. Trying fallback model...`);
        continue;
      }
      
      // For other errors, try fallback model as well
      console.warn(`[OLLAMA MODEL RETRY] Failed with model '${modelToUse}'. Retrying next model...`);
    }
  }

  console.error(`[OLLAMA ALL MODELS EXHAUSTED] Could not query Ollama models (${modelsToTry.join(', ')}). Using safe fallback.`);
  throw lastError || new Error('Ollama service unavailable');
}

/**
 * Safely query Ollama expecting a JSON response object.
 * Extracts and parses JSON even if wrapped in markdown code blocks.
 * Returns structured fallback if Ollama cloud model requires subscription.
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

    // Clean code fences if present
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.info('[AI SYSTEM NOTICE] Operating in rule-engine fallback mode.');
    return fallback;
  }
}
