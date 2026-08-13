import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// A peer is considered "in the room" while it keeps polling (poll = heartbeat).
const PRESENCE_TTL_MS = 15_000;
// Signalling rows are throw-away — anything older than an hour is dead weight.
const SIGNAL_TTL_MS = 60 * 60 * 1000;

const touchPresence = (appointment_id: string, peer_id: string, role: string, name: string) =>
  db.roomPresence.upsert({
    where: { appointment_id_peer_id: { appointment_id, peer_id } },
    create: { appointment_id, peer_id, role, name, last_seen: new Date() },
    update: { last_seen: new Date(), role, name },
  });

// GET /api/room/[appointmentId]?peer_id=&role=&name=&since=
// Heartbeats the caller, then returns every signal addressed to it since the
// cursor, who else is in the room, and the live appointment status.
export async function GET(req: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const { appointmentId } = await params;
    const { searchParams } = new URL(req.url);
    const peer_id = searchParams.get('peer_id');
    const role = searchParams.get('role') === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
    const name = searchParams.get('name') || 'Participant';
    const sinceParam = searchParams.get('since');

    if (!peer_id) return NextResponse.json({ error: 'peer_id required' }, { status: 400 });

    await touchPresence(appointmentId, peer_id, role, name);

    // No cursor yet → start from "now" so a joining peer never replays a stale
    // offer/ICE batch from an earlier session of the same room.
    let since = sinceParam === null || sinceParam === '' ? null : Number(sinceParam);
    if (since !== null && Number.isNaN(since)) since = null;

    if (since === null) {
      const latest = await db.roomSignal.findFirst({
        where: { appointment_id: appointmentId },
        orderBy: { seq: 'desc' },
        select: { seq: true },
      });
      since = latest?.seq ?? 0;
    }

    const presenceCutoff = new Date(Date.now() - PRESENCE_TTL_MS);

    const [signals, presence, appointment] = await Promise.all([
      db.roomSignal.findMany({
        where: {
          appointment_id: appointmentId,
          seq: { gt: since },
          sender_id: { not: peer_id },
          OR: [{ target_id: null }, { target_id: peer_id }],
        },
        orderBy: { seq: 'asc' },
        take: 200,
      }),
      db.roomPresence.findMany({
        where: { appointment_id: appointmentId, last_seen: { gte: presenceCutoff } },
        orderBy: { last_seen: 'desc' },
      }),
      db.appointment.findUnique({
        where: { id: appointmentId },
        // The doctor's side renders the intake brief next to the video, so this
        // poll carries the triage assessment and the patient's identity too.
        // Patients get the narrow projection — they already have their own data
        // and the room endpoint is unauthenticated by peer id alone.
        select:
          role === 'DOCTOR'
            ? {
                status: true,
                notes: true,
                reason: true,
                appointment_date: true,
                start_time: true,
                end_time: true,
                patient_id: true,
                patient: { select: { full_name: true, phone: true, email: true } },
                triage: true,
              }
            : { status: true, notes: true },
      }),
    ]);

    const cursor = signals.length ? signals[signals.length - 1].seq : since;

    // Past signed-off consultations give the doctor the patient's history
    // without leaving the room. Cheap enough at one query per poll, and only
    // for the doctor.
    let patient_brief = null;
    const detailed = appointment as typeof appointment & Record<string, any>;
    if (role === 'DOCTOR' && detailed?.patient_id) {
      const previous = await db.appointment.findMany({
        where: {
          patient_id: detailed.patient_id,
          status: 'COMPLETED',
          notes: { not: null },
          id: { not: appointmentId },
        },
        orderBy: { appointment_date: 'desc' },
        take: 3,
        select: {
          id: true,
          appointment_date: true,
          notes: true,
          doctor: { select: { user: { select: { full_name: true } } } },
        },
      });

      patient_brief = {
        patient_name: detailed.patient?.full_name || 'Patient',
        patient_phone: detailed.patient?.phone ?? null,
        patient_email: detailed.patient?.email ?? null,
        reason: detailed.reason ?? null,
        appointment_date: detailed.appointment_date,
        start_time: detailed.start_time,
        end_time: detailed.end_time,
        triage: detailed.triage
          ? {
              primary_symptom: detailed.triage.primary_symptom,
              symptom_duration: detailed.triage.symptom_duration,
              pain_score: detailed.triage.pain_score,
              red_flag_present: detailed.triage.red_flag_present,
              // safeParse falls back to {} on bad JSON, so the shape is checked.
              red_flags: (() => {
                const parsed = safeParse(detailed.triage.red_flags_json);
                return Array.isArray(parsed) ? parsed : [];
              })(),
              severity_score: detailed.triage.severity_score,
              urgency_level: detailed.triage.urgency_level,
              recommended_specialty: detailed.triage.recommended_specialty,
              triage_summary: detailed.triage.triage_summary,
              action_recommendation: detailed.triage.action_recommendation,
              created_at: detailed.triage.created_at,
            }
          : null,
        history: previous.map((p) => ({
          id: p.id,
          appointment_date: p.appointment_date,
          doctor_name: p.doctor?.user?.full_name ?? null,
          notes: p.notes as string,
        })),
      };
    }

    return NextResponse.json({
      cursor,
      signals: signals.map((s) => ({
        seq: s.seq,
        sender_id: s.sender_id,
        sender_role: s.sender_role,
        sender_name: s.sender_name,
        type: s.type,
        payload: safeParse(s.payload),
        created_at: s.created_at,
      })),
      peers: presence.map((p) => ({ peer_id: p.peer_id, role: p.role, name: p.name })),
      appointment_status: appointment?.status || null,
      appointment_notes: appointment?.notes || null,
      patient_brief,
    });
  } catch (error) {
    console.error('[ROOM/GET]', error);
    return NextResponse.json({ error: 'Failed to sync consultation room' }, { status: 500 });
  }
}

// POST /api/room/[appointmentId] — publish one signal (offer/answer/ICE/chat/ended)
export async function POST(req: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const { appointmentId } = await params;
    const { peer_id, role, name, type, payload, target_id } = await req.json();

    if (!peer_id || !type) {
      return NextResponse.json({ error: 'peer_id and type are required' }, { status: 400 });
    }

    const signal = await db.roomSignal.create({
      data: {
        appointment_id: appointmentId,
        sender_id: peer_id,
        sender_role: role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
        sender_name: name || 'Participant',
        target_id: target_id || null,
        type,
        payload: JSON.stringify(payload ?? {}),
      },
    });

    await touchPresence(appointmentId, peer_id, role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT', name || 'Participant');

    // Opportunistic sweep so the signalling tables stay small.
    if (Math.random() < 0.05) {
      const cutoff = new Date(Date.now() - SIGNAL_TTL_MS);
      await Promise.all([
        db.roomSignal.deleteMany({ where: { created_at: { lt: cutoff } } }),
        db.roomPresence.deleteMany({ where: { last_seen: { lt: cutoff } } }),
      ]).catch(() => undefined);
    }

    return NextResponse.json({ seq: signal.seq }, { status: 201 });
  } catch (error) {
    console.error('[ROOM/POST]', error);
    return NextResponse.json({ error: 'Failed to publish room signal' }, { status: 500 });
  }
}

// DELETE /api/room/[appointmentId]?peer_id= — leave the room immediately
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const { appointmentId } = await params;
    const peer_id = new URL(req.url).searchParams.get('peer_id');
    if (!peer_id) return NextResponse.json({ error: 'peer_id required' }, { status: 400 });

    await db.roomPresence.deleteMany({ where: { appointment_id: appointmentId, peer_id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ROOM/DELETE]', error);
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 });
  }
}

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
