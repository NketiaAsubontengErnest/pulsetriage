import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/specializations
export async function GET() {
  try {
    const specializations = await db.specialization.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ specializations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch specializations' }, { status: 500 });
  }
}

// POST /api/specializations — admin adds a specialization
export async function POST(req: NextRequest) {
  try {
    const { name, added_by } = await req.json();
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const specialization = await db.specialization.create({ data: { name } });

    await db.auditLog.create({
      data: {
        actor: added_by || 'admin',
        action: 'SPECIALIZATION_ADDED',
        entity: 'Specialization',
        entity_id: specialization.id,
        details: `Specialization "${name}" added`,
      },
    });

    return NextResponse.json({ specialization }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Specialization already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create specialization' }, { status: 500 });
  }
}

// DELETE /api/specializations?name=
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    await db.specialization.delete({ where: { name } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete specialization' }, { status: 500 });
  }
}
