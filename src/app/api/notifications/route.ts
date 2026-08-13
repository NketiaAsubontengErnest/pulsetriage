import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/notifications?user_id=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    // Admin dispatch queue needs every notification, not one user's.
    const all = searchParams.get('all') === 'true';

    if (!user_id && !all) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const notifications = await db.notification.findMany({
      where: user_id ? { user_id } : {},
      include: all ? { user: { select: { full_name: true, email: true } } } : undefined,
      orderBy: { created_at: 'desc' },
      take: all ? 50 : 20,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications — create one or many notifications
// Appointment reminders used to be pushed into an in-memory array that every
// visitor shared and nothing survived a reload. They are rows now.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming = Array.isArray(body.notifications) ? body.notifications : [body];

    const rows: Array<{ user_id: string; title: string; message: string; type: string }> = incoming
      .filter((n: any) => n?.user_id && n?.title && n?.message)
      .map((n: any) => ({
        user_id: String(n.user_id),
        title: String(n.title),
        message: String(n.message),
        type: ['TRIAGE', 'APPOINTMENT', 'PAYMENT', 'SYSTEM'].includes(n.type) ? n.type : 'SYSTEM',
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: 'user_id, title and message are required' }, { status: 400 });
    }

    await db.notification.createMany({ data: rows });

    const notifications = await db.notification.findMany({
      where: { user_id: { in: rows.map((r) => r.user_id) } },
      orderBy: { created_at: 'desc' },
      take: rows.length,
    });

    return NextResponse.json({ success: true, notifications }, { status: 201 });
  } catch (error) {
    console.error('[NOTIFICATIONS/POST]', error);
    return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
  }
}

// PATCH /api/notifications — mark notification(s) as read
export async function PATCH(req: NextRequest) {
  try {
    const { id, user_id, mark_all } = await req.json();

    if (mark_all && user_id) {
      await db.notification.updateMany({ where: { user_id }, data: { is_read: true } });
    } else if (id) {
      await db.notification.update({ where: { id }, data: { is_read: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
