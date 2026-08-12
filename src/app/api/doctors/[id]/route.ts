import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/doctors/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doctor = await db.doctor.findUnique({
      where: { id },
      include: { user: { select: { full_name: true, email: true, phone: true } }, schedules: true },
    });
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    return NextResponse.json({ doctor });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/doctors/[id] — update doctor details
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { is_verified, bio, consultation_fee, specialization, updated_by } = body;

    const doctor = await db.doctor.update({
      where: { id },
      data: {
        ...(is_verified !== undefined && { is_verified }),
        ...(bio && { bio }),
        ...(consultation_fee !== undefined && { consultation_fee }),
        ...(specialization && { specialization }),
      },
    });

    await db.auditLog.create({
      data: {
        actor: updated_by || 'admin',
        action: 'DOCTOR_UPDATED',
        entity: 'Doctor',
        entity_id: id,
        details: `Doctor profile updated`,
      },
    });

    return NextResponse.json({ doctor });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/doctors/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { deleted_by } = await req.json().catch(() => ({ deleted_by: 'admin' }));

    const doctor = await db.doctor.findUnique({ where: { id }, include: { user: true } });
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    await db.doctor.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actor: deleted_by || 'admin',
        action: 'DOCTOR_REMOVED',
        entity: 'Doctor',
        entity_id: id,
        details: `Doctor ${doctor.user.full_name} removed`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
