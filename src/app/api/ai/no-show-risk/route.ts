import { NextRequest, NextResponse } from 'next/server';
import { predictNoShowRiskAI } from '@/lib/ai/ai-services';

// Ensemble calls fan out to several cloud models, so the default serverless
// budget is too tight. Vercel caps this at the plan maximum.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/ai/no-show-risk
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patient_name, appointment_date, lead_time_days, consultation_type, past_no_shows_count } = body;

    const prediction = await predictNoShowRiskAI({
      patient_name: patient_name || 'Patient',
      appointment_date: appointment_date || new Date().toISOString(),
      lead_time_days: Number(lead_time_days) || 1,
      consultation_type: consultation_type === 'IN_PERSON' ? 'IN_PERSON' : 'VIDEO',
      past_no_shows_count: Number(past_no_shows_count) || 0,
    });

    return NextResponse.json({ success: true, prediction });
  } catch (error: any) {
    console.error('[API/AI/NO-SHOW-RISK]', error);
    return NextResponse.json({ error: error.message || 'No-show prediction failed' }, { status: 500 });
  }
}
