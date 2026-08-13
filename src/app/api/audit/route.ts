import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-server';

// GET /api/audit?limit=50
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req, ['ADMIN']);
    if ('response' in auth) return auth.response;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await db.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('[AUDIT/GET]', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
