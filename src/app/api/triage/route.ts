import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/triage?patient_id=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patient_id = searchParams.get('patient_id');

    const triages = await db.triageAssessment.findMany({
      where: patient_id ? { patient_id } : {},
      orderBy: { created_at: 'desc' },
    });

    const result = triages.map((t) => ({
      ...t,
      red_flags: JSON.parse(t.red_flags_json || '[]'),
    }));

    return NextResponse.json({ triages: result });
  } catch (error) {
    console.error('[TRIAGE/GET]', error);
    return NextResponse.json({ error: 'Failed to fetch triage records' }, { status: 500 });
  }
}

// POST /api/triage — save a new triage assessment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient_id,
      primary_symptom,
      symptom_duration,
      pain_score,
      red_flag_present,
      red_flags,
      severity_score,
      urgency_level,
      recommended_specialty,
      triage_summary,
      action_recommendation,
    } = body;

    if (!patient_id || !primary_symptom || !urgency_level) {
      return NextResponse.json({ error: 'Missing required triage fields' }, { status: 400 });
    }

    const triage = await db.triageAssessment.create({
      data: {
        patient_id,
        primary_symptom,
        symptom_duration: symptom_duration || 'Unknown',
        pain_score: parseInt(pain_score) || 5,
        red_flag_present: red_flag_present || false,
        red_flags_json: JSON.stringify(red_flags || []),
        severity_score: parseInt(severity_score) || 50,
        urgency_level,
        recommended_specialty: recommended_specialty || 'General Practice',
        triage_summary: triage_summary || action_recommendation || '',
        action_recommendation: action_recommendation || '',
      },
    });

    // Create notification for patient
    await db.notification.create({
      data: {
        user_id: patient_id,
        title: urgency_level === 'EMERGENCY' ? '🚨 Emergency Triage Alert' : '✅ Triage Complete',
        message: action_recommendation || 'Your triage assessment has been recorded.',
        type: 'TRIAGE',
      },
    });

    await db.auditLog.create({
      data: {
        actor: patient_id,
        action: 'TRIAGE_SUBMITTED',
        entity: 'TriageAssessment',
        entity_id: triage.id,
        details: `${urgency_level} triage: ${primary_symptom}`,
      },
    });

    return NextResponse.json({ triage: { ...triage, red_flags: red_flags || [] } }, { status: 201 });
  } catch (error) {
    console.error('[TRIAGE/POST]', error);
    return NextResponse.json({ error: 'Failed to save triage' }, { status: 500 });
  }
}
