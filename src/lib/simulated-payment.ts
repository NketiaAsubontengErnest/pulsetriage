import { PaymentLog } from './types';

export interface PaymentRequest {
  appointment_id: string;
  patient_id: string;
  amount: number;
  payment_method: 'MOBILE_MONEY' | 'CREDIT_CARD' | 'HEALTH_INSURANCE';
  provider: string; // e.g. 'MTN Mobile Money', 'Visa / Mastercard', 'NHIS / Nationwide'
  account_number: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  transaction_ref: string;
  payment_log?: PaymentLog;
}

/**
 * TECHNICAL DEBT IMPLEMENTATION #1: SIMULATED PAYMENT GATEWAY
 * -------------------------------------------------------------
 * Cause: 48-Hour Exam Time Constraint prevents live Paystack/Stripe merchant API integration.
 * Implementation: Synchronous status update simulation with random validation checks & mock refs.
 * Impact: Immediate end-to-end user checkout experience without external payment API keys.
 * Payback Plan: Replace with Paystack / Hubtel REST API webhooks in Version 2.0.
 */
export async function processSimulatedPayment(req: PaymentRequest): Promise<PaymentResult> {
  // Simulate network latency (800ms)
  await new Promise((resolve) => setTimeout(resolve, 800));

  const isInvalidAccount = req.account_number.trim().length < 5 || req.account_number === '00000';
  
  if (isInvalidAccount) {
    return {
      success: false,
      message: 'Payment declined: Invalid payment account or insufficient balance.',
      transaction_ref: `REF-DECLINED-${Date.now()}`
    };
  }

  const transactionRef = `PAY-SIM-${Math.floor(100000 + Math.random() * 900000)}`;

  const paymentLog: PaymentLog = {
    id: `paylog-${Date.now()}`,
    appointment_id: req.appointment_id,
    patient_id: req.patient_id,
    transaction_ref: transactionRef,
    amount: req.amount,
    payment_method: req.payment_method,
    provider: req.provider,
    status: 'SUCCESS',
    created_at: new Date().toISOString()
  };

  return {
    success: true,
    message: `Payment of GH₵ ${req.amount.toFixed(2)} processed successfully via ${req.provider}.`,
    transaction_ref: transactionRef,
    payment_log: paymentLog
  };
}
