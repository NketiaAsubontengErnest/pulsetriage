import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/payments — admin: all payment logs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patient_id = searchParams.get('patient_id');

    const payments = await db.paymentLog.findMany({
      where: patient_id ? { patient_id } : {},
      include: {
        patient: { select: { full_name: true, email: true } },
        appointment: { select: { appointment_date: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('[PAYMENTS/GET]', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/payments — log a payment transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointment_id, patient_id, amount, payment_method, provider, transaction_ref } = body;

    if (!appointment_id || !patient_id || !amount) {
      return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
    }

    const ref = transaction_ref || `REF-${Date.now()}`;

    const payment = await db.paymentLog.create({
      data: {
        appointment_id,
        patient_id,
        transaction_ref: ref,
        amount: parseFloat(amount),
        payment_method: payment_method || 'MOBILE_MONEY',
        provider: provider || 'MTN Mobile Money',
        status: 'SUCCESS',
      },
    });

    // Mark appointment as paid
    await db.appointment.update({
      where: { id: appointment_id },
      data: { payment_status: 'SIMULATED_SUCCESS', status: 'CONFIRMED' },
    });

    await db.auditLog.create({
      data: {
        actor: patient_id,
        action: 'PAYMENT_PROCESSED',
        entity: 'PaymentLog',
        entity_id: payment.id,
        details: `GHC ${amount} via ${provider} — ${ref}`,
      },
    });

    // Notify patient
    await db.notification.create({
      data: {
        user_id: patient_id,
        title: 'Payment Successful',
        message: `Your payment of GHC ${amount} was processed successfully. Ref: ${ref}`,
        type: 'PAYMENT',
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('[PAYMENTS/POST]', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
