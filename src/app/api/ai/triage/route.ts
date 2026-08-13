import { NextRequest, NextResponse } from 'next/server';
import { analyzeSymptomTriageAI } from '@/lib/ai/ai-services';

// Ensemble calls fan out to several cloud models, so the default serverless
// budget is too tight. Vercel caps this at the plan maximum.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/ai/triage
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symptomDescription, age, duration, painScore } = body;

    if (!symptomDescription) {
      return NextResponse.json({ error: 'Symptom description is required' }, { status: 400 });
    }

    const result = await analyzeSymptomTriageAI(symptomDescription, {
      age: age ? Number(age) : undefined,
      duration,
      painScore: painScore ? Number(painScore) : undefined,
    });

    return NextResponse.json({ success: true, triage: result });
  } catch (error: any) {
    console.error('[API/AI/TRIAGE]', error);
    return NextResponse.json({ error: error.message || 'AI Triage processing failed' }, { status: 500 });
  }
}
