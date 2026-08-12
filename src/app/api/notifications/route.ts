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
