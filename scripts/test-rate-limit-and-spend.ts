import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { pool } from '../apps/api/src/db/index.js';
import { PostgresSpendGuard, MAX_CONCURRENT_LLM_CALLS } from '../apps/api/src/middleware/rateLimit.js';

async function runTests() {
  console.log('='.repeat(70));
  console.log('  CONCORD RATE LIMITER, SPEND GUARD & CONCURRENCY VERIFICATION');
  console.log('='.repeat(70));

  // 1. Verify Spend Guard against PostgreSQL
  console.log('\n[1] Testing PostgresSpendGuard:');
  const guard = new PostgresSpendGuard(5); // ceiling of 5 for test
  const initialCount = await guard.getTodayCount();
  console.log(`  Initial today count in rate_limit_buckets: ${initialCount}`);

  const canSpendBefore = await guard.canSpend();
  console.log(`  Can spend (ceiling=5, current=${initialCount}): ${canSpendBefore}`);

  // Test recording spend
  await guard.recordSpend();
  const countAfter = await guard.getTodayCount();
  console.log(`  Count after recordSpend: ${countAfter} (increased by ${countAfter - initialCount})`);

  // Test ceiling breach
  const strictGuard = new PostgresSpendGuard(0); // ceiling 0
  const canSpendExceeded = await strictGuard.canSpend();
  console.log(`  Can spend with ceiling=0: ${canSpendExceeded} (expected: false)`);
  if (!canSpendExceeded) {
    console.log('  ✓ Spend ceiling correctly blocks spending when limit reached.');
  } else {
    throw new Error('Spend ceiling failed to block spending');
  }

  // 2. Verify Concurrency Constant
  console.log('\n[2] Testing Concurrency Configuration:');
  console.log(`  MAX_CONCURRENT_LLM_CALLS is configured to: ${MAX_CONCURRENT_LLM_CALLS}`);
  if (MAX_CONCURRENT_LLM_CALLS === 20) {
    console.log('  ✓ Global LLM concurrency cap matches 20 in-flight spec.');
  } else {
    throw new Error(`Expected MAX_CONCURRENT_LLM_CALLS to be 20, got ${MAX_CONCURRENT_LLM_CALLS}`);
  }

  // 3. Verify Rate Limits Table in PostgreSQL
  console.log('\n[3] Testing PostgreSQL rate_limits table:');
  const tableCheck = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'rate_limits'`);
  console.log(`  rate_limits table columns:`, tableCheck.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  if (tableCheck.rows.length >= 3) {
    console.log('  ✓ PostgreSQL rate_limits table verified.');
  } else {
    throw new Error('rate_limits table missing expected columns');
  }

  console.log('\n[✓] All Rate Limiting, Spend Guard & Concurrency Checks Passed.');
  await pool.end();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  pool.end().finally(() => process.exit(1));
});
