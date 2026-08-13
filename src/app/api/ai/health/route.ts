import { NextRequest, NextResponse } from 'next/server';
import { getAiRosterStatus, queryOllamaEnsemble } from '@/lib/ai/ollama-client';

// Ensemble calls fan out to several cloud models, so the default serverless
// budget is too tight. Vercel caps this at the plan maximum.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/health        — configuration only (no model calls, instant)
 * GET /api/ai/health?live=1 — also performs a real ensemble round-trip
 *
 * Use this to tell "the key is missing / the model name is wrong" apart from
 * "the models answered but the UI is showing the deterministic fallback".
 */
export async function GET(req: NextRequest) {
  const status = getAiRosterStatus();

  if (!status.configured) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'OLLAMA_API_KEY is not set in this environment.',
        ...status,
      },
      { status: 503 }
    );
  }

  if (req.nextUrl.searchParams.get('live') !== '1') {
    return NextResponse.json({ ok: true, live_checked: false, ...status });
  }

  try {
    const startedAt = Date.now();
    const result = await queryOllamaEnsemble(
      [{ role: 'user', content: 'Reply with exactly: PULSETRIAGE-OK' }],
      { size: 3, temperature: 0 }
    );

    return NextResponse.json({
      ok: true,
      live_checked: true,
      latency_ms: Date.now() - startedAt,
      answered_by: result.model,
      models_consulted: result.models_consulted,
      agreement: result.agreement,
      sample: result.value.slice(0, 120),
      ...getAiRosterStatus(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, live_checked: true, reason: error?.message || 'Live check failed', ...getAiRosterStatus() },
      { status: 502 }
    );
  }
}
