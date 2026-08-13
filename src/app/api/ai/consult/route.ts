import { NextRequest, NextResponse } from 'next/server';
import { clinicalConsultAI } from '@/lib/ai/ai-services';

// Ensemble calls fan out to several cloud models, so the default serverless
// budget is too tight. Vercel caps this at the plan maximum.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/consult — clinical decision support during a live consultation.
 *
 * Deliberately has no deterministic fallback: when the models are unreachable
 * this returns an error the doctor can see, rather than a canned answer that
 * would read like AI output.
 */
export async function POST(req: NextRequest) {
  try {
    const { question, context } = await req.json();

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'A question is required' }, { status: 400 });
    }

    const { answer, provenance } = await clinicalConsultAI(question, String(context || '').slice(0, 8000));

    return NextResponse.json({ success: true, answer, ai_provenance: provenance });
  } catch (error: any) {
    console.error('[API/AI/CONSULT]', error);
    return NextResponse.json(
      {
        error:
          'The AI models could not be reached, so there is no answer to show. ' +
          `Check /api/ai/health?live=1. (${error?.message || 'unknown error'})`,
      },
      { status: 502 }
    );
  }
}
