import { NextRequest, NextResponse } from 'next/server';
import { generateSoapNotesAI } from '@/lib/ai/ai-services';

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
