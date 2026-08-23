import { Router } from 'express';
import type { Request, Response } from 'express';
import { createPaymentsAdapter } from '@concord/core';

export const webhooksRouter = Router();

webhooksRouter.post('/razorpay', (req: Request, res: Response): void => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const paymentsAdapter = createPaymentsAdapter(
    process.env.PAYMENTS_PROVIDER,
    process.env.RAZORPAY_KEY_ID,
    process.env.RAZORPAY_KEY_SECRET
  );

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (webhookSecret && signature) {
    const isValid = paymentsAdapter.verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature mismatch' } });
      return;
    }
  }

  const event = req.body?.event || 'payment.captured';
  const payload = req.body?.payload;

  console.log(`[Razorpay Webhook Received] Event: ${event}`, {
    payment_id: payload?.payment?.entity?.id,
    order_id: payload?.payment?.entity?.order_id,
    amount: payload?.payment?.entity?.amount,
    status: payload?.payment?.entity?.status,
  });

  res.status(200).json({ status: 'ok', received: true, event });
});
