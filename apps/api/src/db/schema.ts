import {
  bigint,
  boolean,
  char,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Enums
export const decisionEnum = pgEnum('decision_t', ['pass', 'step_up', 'decline']);
export const verdictEnum = pgEnum('verdict_t', ['pass', 'fail', 'unavailable']);
export const layerEnum = pgEnum('layer_t', ['deterministic', 'semantic']);
export const resolutionEnum = pgEnum('resolution_t', ['accepted', 'overridden', 'abandoned']);

// 1. merchants
export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  strictness: decimal('strictness', { precision: 3, scale: 2 }).notNull().default('0.75'),
  signing_key_version: integer('signing_key_version').notNull().default(1),
  chain_head_id: uuid('chain_head_id'),
  chain_length: bigint('chain_length', { mode: 'number' }).notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 2. api_keys
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchant_id: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),
    key_prefix: text('key_prefix').notNull(), // 'ck_test_a3f9'
    key_hash: text('key_hash').notNull(), // argon2id / sha256
    label: text('label'),
    last_used_at: timestamp('last_used_at', { withTimezone: true }),
    revoked_at: timestamp('revoked_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('api_keys_prefix_uq').on(table.key_prefix),
    index('api_keys_merchant_idx').on(table.merchant_id),
  ]
);

// 3. receipts
export const receipts = pgTable(
  'receipts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchant_id: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id),
    sequence_number: bigint('sequence_number', { mode: 'number' }).notNull(),
    prev_hash: text('prev_hash'),
    hash: text('hash').notNull(),
    signature: text('signature').notNull(),
    signing_key_version: integer('signing_key_version').notNull().default(1),
    decision: decisionEnum('decision').notNull(),
    strictness_used: decimal('strictness_used', { precision: 3, scale: 2 }).notNull(),
    extraction_confidence: decimal('extraction_confidence', { precision: 4, scale: 3 }).notNull(),
    degraded: boolean('degraded').notNull().default(false),
    intent_text: text('intent_text').notNull(),
    intent_hash: text('intent_hash').notNull(),
    constraint_set: jsonb('constraint_set').notNull(),
    cart: jsonb('cart').notNull(),
    cart_total_minor: bigint('cart_total_minor', { mode: 'number' }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    versions: jsonb('versions').notNull(),
    latency_ms: jsonb('latency_ms').notNull(),
    request_id: text('request_id').notNull(),
    issued_at: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('receipts_seq_uq').on(table.merchant_id, table.sequence_number),
    index('receipts_merchant_time_idx').on(table.merchant_id, table.issued_at),
    index('receipts_decision_idx').on(table.merchant_id, table.decision, table.issued_at),
    index('receipts_intent_hash_idx').on(table.intent_hash),
    index('receipts_hash_idx').on(table.hash),
  ]
);

// 4. checks
export const checks = pgTable(
  'checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receipt_id: uuid('receipt_id')
      .notNull()
      .references(() => receipts.id, { onDelete: 'restrict' }),
    merchant_id: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id),
    constraint_id: text('constraint_id').notNull(),
    constraint_kind: text('constraint_kind').notNull(),
    hardness: text('hardness').notNull(),
    layer: layerEnum('layer').notNull(),
    line_sku: text('line_sku'),
    verdict: verdictEnum('verdict').notNull(),
    confidence: decimal('confidence', { precision: 4, scale: 3 }).notNull(),
    raw_confidence: decimal('raw_confidence', { precision: 4, scale: 3 }),
    reason: text('reason').notNull(),
    observed: jsonb('observed'),
    expected: jsonb('expected'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('checks_receipt_idx').on(table.receipt_id),
    index('checks_analysis_idx').on(table.merchant_id, table.constraint_kind, table.verdict),
    index('checks_verdict_idx').on(table.merchant_id, table.verdict, table.created_at),
  ]
);

// 5. step_up_resolutions
export const stepUpResolutions = pgTable(
  'step_up_resolutions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    receipt_id: uuid('receipt_id')
      .notNull()
      .references(() => receipts.id),
    resolution: resolutionEnum('resolution').notNull(),
    proposed_sku: text('proposed_sku'),
    replacement_receipt_id: uuid('replacement_receipt_id').references(() => receipts.id),
    resolved_at: timestamp('resolved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('step_up_one_per_receipt').on(table.receipt_id)]
);

// 6. extraction_cache
export const extractionCache = pgTable('extraction_cache', {
  intent_hash: text('intent_hash').notNull(),
  extractor_version: text('extractor_version').notNull(),
  prompt_version: text('prompt_version').notNull(),
  constraint_set: jsonb('constraint_set').notNull(),
  confidence: decimal('confidence', { precision: 4, scale: 3 }).notNull(),
  hit_count: bigint('hit_count', { mode: 'number' }).notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  last_hit_at: timestamp('last_hit_at', { withTimezone: true }),
});

// 7. idempotency_keys
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    merchant_id: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id),
    key: text('key').notNull(),
    request_hash: text('request_hash').notNull(),
    receipt_id: uuid('receipt_id').references(() => receipts.id),
    status: text('status').notNull(), // 'in_flight' | 'completed'
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('idempotency_expiry_idx').on(table.expires_at)]
);

// 8. rate_limit_buckets
export const rateLimitBuckets = pgTable('rate_limit_buckets', {
  bucket_key: text('bucket_key').primaryKey(),
  tokens: decimal('tokens').notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 9. rate_limits (rate-limiter-flexible)
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  points: integer('points').notNull().default(0),
  expire: bigint('expire', { mode: 'number' }),
});
