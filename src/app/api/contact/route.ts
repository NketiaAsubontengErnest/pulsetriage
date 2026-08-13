import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_MESSAGE = 4000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/contact — deliver a public enquiry to the administrators.
 *
 * The form used to set a "submitted" flag in React and drop the message on the
 * floor. There is no dedicated enquiries table, so each message is delivered as
 * a notification to every administrator and recorded in the audit trail — it
 * lands somewhere a human actually looks, without a schema change.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email and message are all required.' }, { status: 400 });
    }
    if (!EMAIL.test(String(email).trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (String(message).length > MAX_MESSAGE) {
      return NextResponse.json({ error: 'That message is too long.' }, { status: 400 });
    }

    const cleanName = String(name).trim().slice(0, 120);
    const cleanEmail = String(email).trim().slice(0, 200);
    const cleanSubject = String(subject || 'General enquiry').trim().slice(0, 160);
    const cleanMessage = String(message).trim();

    const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });

    // The enquiry and its audit row travel together: a message that reaches an
    // administrator must also be traceable, and one that fails should leave
    // neither behind.
    await db.$transaction(async (tx) => {
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            user_id: admin.id,
            title: `Enquiry: ${cleanSubject}`,
            message: `From ${cleanName} <${cleanEmail}>\n\n${cleanMessage}`,
            type: 'SYSTEM',
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          actor: cleanEmail,
          action: 'CONTACT_ENQUIRY',
          entity: 'Contact',
          details: `${cleanSubject} — from ${cleanName}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      delivered_to: admins.length,
    });
  } catch (error) {
    console.error('[CONTACT/POST]', error);
    return NextResponse.json({ error: 'Could not send your message. Please try again.' }, { status: 500 });
  }
}
