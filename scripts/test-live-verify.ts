import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import { verifyRouter } from '../apps/api/src/routes/verify.js';
import { pool } from '../apps/api/src/db/index.js';

async function testLiveVerify() {
  console.log('='.repeat(70));
  console.log('  TESTING LIVE VERIFY ROUTE WITH RATE LIMITING & GEMINI-2.5-FLASH');
  console.log('='.repeat(70));

  const app = express();
  app.use(express.json());
  app.use('/v1/verify', verifyRouter);

  const server = app.listen(3099);

  try {
    const payload = {
      intent_text: 'espresso machine under ₹15,000, delivered by Friday',
      cart: {
        cart_id: 'cart_live_test_1',
        merchant_id: '00000000-0000-0000-0000-000000000001',
        currency: 'INR',
        lines: [
          {
            sku: 'SKU_ESP_13200',
            title: 'Espresso Express Deluxe 15-bar pump espresso maker',
            description: 'Compact 15-bar Italian pump espresso machine for home baristas',
            category_path: ['Home & Kitchen', 'Kitchen Appliances', 'Coffee & Espresso', 'Espresso Machines'],
            brand: 'CafePro',
            unit_amount: 1320000,
            quantity: 1,
            condition: 'new',
            refundable: true,
            attributes: { color: 'Stainless Steel', power_wattage: '1250' },
          },
        ],
        total_amount: 1320000,
        promised_delivery_date: '2026-08-28',
      },
      strictness: 0.75,
    };

    console.log('\n[1] Sending POST /v1/verify with test API key...');
    const testApiKey = 'ck_test_live_verify_test_key';
    const res = await fetch('http://localhost:3099/v1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testApiKey}`,
        'idempotency-key': `test_live_${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });

    console.log(`  Response Status: ${res.status} ${res.statusText}`);
    console.log(`  RateLimit Headers:`);
    console.log(`    X-RateLimit-Limit-Minute: ${res.headers.get('x-ratelimit-limit-minute')}`);
    console.log(`    X-RateLimit-Remaining-Minute: ${res.headers.get('x-ratelimit-remaining-minute')}`);
    console.log(`    X-RateLimit-Limit-Day: ${res.headers.get('x-ratelimit-limit-day')}`);
    console.log(`    X-RateLimit-Remaining-Day: ${res.headers.get('x-ratelimit-remaining-day')}`);

    const data: any = await res.json();
    console.log(`  Decision: ${data.decision}`);
    console.log(`  Receipt ID: ${data.receipt_id}`);
    console.log(`  Sequence Number: ${data.sequence_number}`);
    console.log(`  Hash: ${data.hash?.slice(0, 16)}...`);
    console.log(`  Checks Count: ${data.checks?.length}`);
    console.log(`  Degraded Flag: ${data.degraded}`);

    if (res.status === 200 && data.decision) {
      console.log('  ✓ Live verify call succeeded through rate limiter and pipeline.');
    } else {
      throw new Error(`Unexpected verify response: ${JSON.stringify(data)}`);
    }

    // 2. Test Rate Limiting Trigger (consume remainder for this test key)
    console.log('\n[2] Testing Rate Limiter exhaustion (bursting requests in concurrent batches)...');
    let got429 = false;
    let retryAfterHeader = null;

    for (let b = 0; b < 6 && !got429; b++) {
      const promises = Array.from({ length: 15 }, async (_, idx) => {
        const reqNum = b * 15 + idx + 1;
        const burstRes = await fetch('http://localhost:3099/v1/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testApiKey}`,
          },
          body: JSON.stringify({}),
        });
        const status = burstRes.status;
        const text = await burstRes.text();
        return { reqNum, status, headers: burstRes.headers, body: text };
      });

      const batchResults = await Promise.all(promises);
      for (const r of batchResults) {
        if (r.status === 429) {
          got429 = true;
          retryAfterHeader = r.headers.get('retry-after');
          try {
            const errJson = JSON.parse(r.body);
            console.log(`  ✓ Received 429 on request #${r.reqNum}: ${errJson.error?.code} (${errJson.error?.message})`);
          } catch {
            console.log(`  ✓ Received 429 on request #${r.reqNum}`);
          }
          console.log(`  Retry-After header: ${retryAfterHeader}s`);
          break;
        }
      }
    }

    if (!got429) {
      throw new Error('Rate limiter failed to return 429 after bursting requests');
    }

    console.log('\n[✓] All Live Verify & Rate Limiting Tests Succeeded!');
  } finally {
    server.close();
    await pool.end();
  }
}

testLiveVerify().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
