import express from 'express';
import { concurrencyLimiter, MAX_CONCURRENT_LLM_CALLS } from '../apps/api/src/middleware/rateLimit.js';

async function testConcurrency() {
  console.log('='.repeat(70));
  console.log('  TESTING GLOBAL CONCURRENCY CAP (20 IN FLIGHT)');
  console.log('='.repeat(70));

  const app = express();
  // Simulate an in-flight endpoint that holds for 300ms
  app.get('/test-concurrency', concurrencyLimiter, async (_req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    res.json({ ok: true });
  });

  const server = app.listen(3098);

  try {
    console.log(`\nLaunching 25 concurrent requests against /test-concurrency (Cap is ${MAX_CONCURRENT_LLM_CALLS})...`);
    const promises = Array.from({ length: 25 }, async (_, i) => {
      const res = await fetch('http://localhost:3098/test-concurrency');
      const data: any = await res.json();
      return { reqId: i + 1, status: res.status, data };
    });

    const results = await Promise.all(promises);
    const passed = results.filter((r) => r.status === 200);
    const rejected = results.filter((r) => r.status === 429);

    console.log(`  200 OK passed: ${passed.length}`);
    console.log(`  429 CONCURRENCY_LIMIT_EXCEEDED rejected: ${rejected.length}`);

    if (passed.length === 20 && rejected.length === 5) {
      console.log('  ✓ Exactly 20 concurrent requests passed; 5 exceeded requests rejected with 429.');
      console.log(`  Sample 429 response:`, JSON.stringify(rejected[0].data));
    } else {
      throw new Error(`Expected 20 passed and 5 rejected, got ${passed.length} passed and ${rejected.length} rejected`);
    }

    console.log('\n[✓] Concurrency Limiter Verification Passed!');
  } finally {
    server.close();
  }
}

testConcurrency().catch((err) => {
  console.error('Concurrency test error:', err);
  process.exit(1);
});
