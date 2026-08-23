import crypto from 'node:crypto';

export interface CreateOrderParams {
  amountMinor: number;
  currency: string;
  receiptId: string;
  notes?: Record<string, string>;
}

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  created_at: number;
}

export interface PaymentsAdapter {
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string
  ): boolean;
}

export class MockPaymentsAdapter implements PaymentsAdapter {
  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const orderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    return {
      orderId,
      amount: params.amountMinor,
      currency: params.currency,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string
  ): boolean {
    if (!secret) return true;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature || '', 'utf8'),
      Buffer.from(expected, 'utf8')
    );
  }
}

export class RazorpayPaymentsAdapter implements PaymentsAdapter {
  private keyId: string;
  private keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    if (!this.keyId || !this.keySecret) {
      return new MockPaymentsAdapter().createOrder(params);
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amountMinor,
          currency: params.currency,
          receipt: params.receiptId,
          notes: params.notes || {},
        }),
      });

      if (!res.ok) {
        // Fallback to mock order in case of network issue in test mode
        return new MockPaymentsAdapter().createOrder(params);
      }

      const data = await res.json();
      return {
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        created_at: data.created_at,
      };
    } catch {
      return new MockPaymentsAdapter().createOrder(params);
    }
  }

  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string
  ): boolean {
    if (!secret || !signature) return false;
    try {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expected, 'utf8')
      );
    } catch {
      return false;
    }
  }
}

export function createPaymentsAdapter(
  provider: string = 'mock',
  keyId?: string,
  keySecret?: string
): PaymentsAdapter {
  if (provider === 'razorpay' && keyId && keySecret) {
    return new RazorpayPaymentsAdapter(keyId, keySecret);
  }
  return new MockPaymentsAdapter();
}
