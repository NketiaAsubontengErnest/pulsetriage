import { NextRequest, NextResponse } from 'next/server';
import { healthChatAssistantAI } from '@/lib/ai/ai-services';

// Ensemble calls fan out to several cloud models, so the default serverless
// budget is too tight. Vercel caps this at the plan maximum.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/ai/chat
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const reply = await healthChatAssistantAI(messages);

    return NextResponse.json({ success: true, message: reply });
  } catch (error: any) {
    console.error('[API/AI/CHAT]', error);
    return NextResponse.json({ error: error.message || 'AI Chat Assistant error' }, { status: 500 });
  }
}
