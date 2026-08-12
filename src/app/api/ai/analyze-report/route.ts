import { NextRequest, NextResponse } from 'next/server';
import { analyzeMedicalReportAI } from '@/lib/ai/ai-services';

// POST /api/ai/analyze-report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportText } = body;

    if (!reportText) {
      return NextResponse.json({ error: 'Lab report text is required' }, { status: 400 });
    }

    const analysis = await analyzeMedicalReportAI(reportText);

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('[API/AI/ANALYZE-REPORT]', error);
    return NextResponse.json({ error: error.message || 'Medical report analysis failed' }, { status: 500 });
  }
}
