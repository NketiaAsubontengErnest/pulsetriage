import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PRESENCE_TTL_MS = 15_000;

// GET /api/room?appointment_ids=a,b,c
// Tells an appointment list which rooms currently have a doctor (or anyone)
// waiting inside, so "Doctor is in the room" works across devices.
export async function GET(req: NextRequest) {
  try {
    const idsParam = new URL(req.url).searchParams.get('appointment_ids') || '';
    const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean);

    if (ids.length === 0) return NextResponse.json({ active_rooms: [] });

    const presence = await db.roomPresence.findMany({
      where: {
        appointment_id: { in: ids },
        last_seen: { gte: new Date(Date.now() - PRESENCE_TTL_MS) },
      },
      select: { appointment_id: true, role: true, name: true },
    });

    const rooms = new Map<string, { appointment_id: string; doctor_present: boolean; patient_present: boolean; participants: string[] }>();
    for (const p of presence) {
      const room = rooms.get(p.appointment_id) || {
        appointment_id: p.appointment_id,
        doctor_present: false,
        patient_present: false,
        participants: [],
      };
      if (p.role === 'DOCTOR') room.doctor_present = true;
      else room.patient_present = true;
      if (!room.participants.includes(p.name)) room.participants.push(p.name);
      rooms.set(p.appointment_id, room);
    }

    return NextResponse.json({ active_rooms: Array.from(rooms.values()) });
  } catch (error) {
    console.error('[ROOM/ACTIVE]', error);
    return NextResponse.json({ error: 'Failed to read room presence' }, { status: 500 });
  }
}
