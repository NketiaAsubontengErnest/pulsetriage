import { NextRequest, NextResponse } from 'next/server';
import { generateSoapNotesAI } from '@/lib/ai/ai-services';

// Ensemble calls fan out to several cloud models, so the default serverless
// budget is too tight. Vercel caps this at the plan maximum.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/ai/soap
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, patientName, age, gender } = body;

    if (!transcript) {
      return NextResponse.json({ error: 'Consultation transcript or notes required' }, { status: 400 });
    }

    const soapNote = await generateSoapNotesAI(transcript, {
      name: patientName,
      age: age ? Number(age) : undefined,
      gender,
    });

    return NextResponse.json({ success: true, soapNote });
  } catch (error: any) {
    console.error('[API/AI/SOAP]', error);
    return NextResponse.json({ error: error.message || 'SOAP note generation failed' }, { status: 500 });
  }
}
