import { pool } from './index.js';
import crypto from 'node:crypto';

export async function runMigration() {
  console.log('Running Concord database migrations...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Enums if they do not exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE decision_t AS ENUM ('pass', 'step_up', 'decline');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE verdict_t AS ENUM ('pass', 'fail', 'unavailable');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE layer_t AS ENUM ('deterministic', 'semantic');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE resolution_t AS ENUM ('accepted', 'overridden', 'abandoned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        strictness NUMERIC(3,2) NOT NULL DEFAULT 0.75 CHECK (strictness BETWEEN 0.50 AND 0.95),
        signing_key_version INT NOT NULL DEFAULT 1,
        chain_head_id UUID,
        chain_length BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
        key_prefix TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        label TEXT,
        last_used_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS api_keys_prefix_uq ON api_keys (key_prefix);
      CREATE INDEX IF NOT EXISTS api_keys_merchant_idx ON api_keys (merchant_id) WHERE revoked_at IS NULL;

      CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        sequence_number BIGINT NOT NULL,
        prev_hash TEXT,
        hash TEXT NOT NULL,
        signature TEXT NOT NULL,
        signing_key_version INT NOT NULL,
        decision decision_t NOT NULL,
        strictness_used NUMERIC(3,2) NOT NULL,
        extraction_confidence NUMERIC(4,3) NOT NULL,
        degraded BOOLEAN NOT NULL DEFAULT FALSE,
        intent_text TEXT NOT NULL,
        intent_hash TEXT NOT NULL,
        constraint_set JSONB NOT NULL,
        cart JSONB NOT NULL,
        cart_total_minor BIGINT NOT NULL,
        currency CHAR(3) NOT NULL,
        versions JSONB NOT NULL,
        latency_ms JSONB NOT NULL,
        request_id TEXT NOT NULL,
        issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT receipts_seq_uq UNIQUE (merchant_id, sequence_number),
        CONSTRAINT receipts_first_link CHECK (
          (sequence_number = 1 AND prev_hash IS NULL) OR
          (sequence_number > 1 AND prev_hash IS NOT NULL)
        )
      );

      CREATE INDEX IF NOT EXISTS receipts_merchant_time_idx ON receipts (merchant_id, issued_at DESC);
      CREATE INDEX IF NOT EXISTS receipts_decision_idx ON receipts (merchant_id, decision, issued_at DESC);
      CREATE INDEX IF NOT EXISTS receipts_intent_hash_idx ON receipts (intent_hash);
      CREATE INDEX IF NOT EXISTS receipts_hash_idx ON receipts (hash);

      CREATE TABLE IF NOT EXISTS checks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE RESTRICT,
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        constraint_id TEXT NOT NULL,
        constraint_kind TEXT NOT NULL,
        hardness TEXT NOT NULL CHECK (hardness IN ('hard','soft')),
        layer layer_t NOT NULL,
        line_sku TEXT,
        verdict verdict_t NOT NULL,
        confidence NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
        raw_confidence NUMERIC(4,3),
        reason TEXT NOT NULL,
        observed JSONB,
        expected JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS checks_receipt_idx ON checks (receipt_id);
      CREATE INDEX IF NOT EXISTS checks_analysis_idx ON checks (merchant_id, constraint_kind, verdict);
      CREATE INDEX IF NOT EXISTS checks_verdict_idx ON checks (merchant_id, verdict, created_at DESC);

      CREATE TABLE IF NOT EXISTS step_up_resolutions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_id UUID NOT NULL REFERENCES receipts(id),
        resolution resolution_t NOT NULL,
        proposed_sku TEXT,
        replacement_receipt_id UUID REFERENCES receipts(id),
        resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT step_up_one_per_receipt UNIQUE (receipt_id)
      );

      CREATE TABLE IF NOT EXISTS extraction_cache (
        intent_hash TEXT NOT NULL,
        extractor_version TEXT NOT NULL,
        prompt_version TEXT NOT NULL,
        constraint_set JSONB NOT NULL,
        confidence NUMERIC(4,3) NOT NULL,
        hit_count BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_hit_at TIMESTAMPTZ,
        PRIMARY KEY (intent_hash, extractor_version, prompt_version)
      );

      CREATE TABLE IF NOT EXISTS idempotency_keys (
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        key TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        receipt_id UUID REFERENCES receipts(id),
        status TEXT NOT NULL CHECK (status IN ('in_flight','completed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        expires_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (merchant_id, key)
      );

      CREATE INDEX IF NOT EXISTS idempotency_expiry_idx ON idempotency_keys (expires_at);

      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        bucket_key TEXT PRIMARY KEY,
        tokens NUMERIC NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS rate_limits (
        key VARCHAR(255) PRIMARY KEY,
        points INTEGER DEFAULT 0 NOT NULL,
        expire BIGINT
      );
    `);

    // 3. Seed demo merchant if not exists
    const demoMerchantCheck = await client.query(`SELECT id FROM merchants WHERE id = '00000000-0000-0000-0000-000000000001'`);
    if (demoMerchantCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO merchants (id, name, strictness, signing_key_version, chain_length)
        VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Merchant Store', 0.75, 1, 0);
      `);

      // Seed default demo API key: 'ck_test_demo_concord_key'
      const keyHash = crypto.createHash('sha256').update('ck_test_demo_concord_key').digest('hex');
      await client.query(`
        INSERT INTO api_keys (merchant_id, key_prefix, key_hash, label)
        VALUES ('00000000-0000-0000-0000-000000000001', 'ck_test_demo', $1, 'Demo Default Key');
      `, [keyHash]);
      console.log('Seeded demo merchant and default API key: ck_test_demo_concord_key');
    }

    await client.query('COMMIT');
    console.log('✓ Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
