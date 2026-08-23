import { z } from 'zod';

// ==========================================
// 1. Core Constraint Enums & Types
// ==========================================

export const ConstraintKindSchema = z.enum([
  'price_max',
  'price_min',
  'quantity',
  'delivery_by',
  'brand_allow',
  'brand_deny',
  'condition',
  'refundable',
  'merchant_allow',
  'category',
  'attribute',
]);
export type ConstraintKind = z.infer<typeof ConstraintKindSchema>;

export const OperatorSchema = z.enum([
  'lte',
  'gte',
  'eq',
  'neq',
  'in',
  'not_in',
  'before',
  'after',
]);
export type Operator = z.infer<typeof OperatorSchema>;

export const ConstraintValueSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('money'),
    amount: z.number().int().nonnegative(), // in minor units / paise
    currency: z.string().length(3).toUpperCase(),
  }),
  z.object({
    type: z.literal('number'),
    value: z.number(),
  }),
  z.object({
    type: z.literal('date'),
    value: z.string(), // ISO 8601 YYYY-MM-DD
  }),
  z.object({
    type: z.literal('string_set'),
    values: z.array(z.string()),
  }),
  z.object({
    type: z.literal('boolean'),
    value: z.boolean(),
  }),
  z.object({
    type: z.literal('text'),
    value: z.string(),
  }),
]);
export type ConstraintValue = z.infer<typeof ConstraintValueSchema>;

export const SourceSpanSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  text: z.string(),
});
export type SourceSpan = z.infer<typeof SourceSpanSchema>;

export const ConstraintSchema = z.object({
  id: z.string(),
  kind: ConstraintKindSchema,
  operator: OperatorSchema,
  value: ConstraintValueSchema,
  scope: z.enum(['per_unit', 'total', 'per_line']),
  hardness: z.enum(['hard', 'soft']),
  source_span: SourceSpanSchema,
  confidence: z.number().min(0).max(1),
});
export type Constraint = z.infer<typeof ConstraintSchema>;

export const ConstraintSetSchema = z.object({
  intent_id: z.string(),
  intent_text: z.string(),
  intent_hash: z.string(),
  extracted_at: z.string(),
  extractor_version: z.string(),
  constraints: z.array(ConstraintSchema),
  semantic_residue: z.string().nullable(),
  extraction_confidence: z.number().min(0).max(1),
});
export type ConstraintSet = z.infer<typeof ConstraintSetSchema>;

// ==========================================
// 2. Cart Schemas
// ==========================================

export const CartLineSchema = z.object({
  sku: z.string(),
  title: z.string(),
  description: z.string(),
  category_path: z.array(z.string()),
  brand: z.string(),
  unit_amount: z.number().int().nonnegative(), // minor units / paise
  quantity: z.number().int().positive(),
  condition: z.enum(['new', 'refurbished', 'used']),
  refundable: z.boolean(),
  attributes: z.record(z.string()),
  image_url: z.string().optional(),
});
export type CartLine = z.infer<typeof CartLineSchema>;

export const CartSchema = z.object({
  cart_id: z.string(),
  merchant_id: z.string(),
  currency: z.string().length(3).toUpperCase(),
  lines: z.array(CartLineSchema).min(1),
  total_amount: z.number().int().nonnegative(),
  promised_delivery_date: z.string().nullable(),
});
export type Cart = z.infer<typeof CartSchema>;

// ==========================================
// 3. Check Results & Decisions
// ==========================================

export const VerdictSchema = z.enum(['pass', 'fail', 'unavailable']);
export type Verdict = z.infer<typeof VerdictSchema>;

export const LayerSchema = z.enum(['deterministic', 'semantic']);
export type Layer = z.infer<typeof LayerSchema>;

export const CheckResultSchema = z.object({
  check_id: z.string(),
  constraint_id: z.string(),
  constraint_kind: ConstraintKindSchema,
  hardness: z.enum(['hard', 'soft']),
  layer: LayerSchema,
  line_sku: z.string().nullable(),
  verdict: VerdictSchema,
  confidence: z.number().min(0).max(1),
  raw_confidence: z.number().min(0).max(1).optional(),
  reason: z.string(),
  observed: z.unknown(),
  expected: z.unknown(),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;

export const DecisionSchema = z.enum(['pass', 'step_up', 'decline']);
export type Decision = z.infer<typeof DecisionSchema>;

// ==========================================
// 4. Receipts & Verification
// ==========================================

export const ReceiptVersionsSchema = z.object({
  extractor: z.string(),
  checker: z.string(),
  schema: z.string(),
  prompt: z.string(),
});
export type ReceiptVersions = z.infer<typeof ReceiptVersionsSchema>;

export const ReceiptLatencySchema = z.object({
  extract: z.number(),
  deterministic: z.number(),
  semantic: z.number(),
  total: z.number(),
});
export type ReceiptLatency = z.infer<typeof ReceiptLatencySchema>;

export const ReceiptSchema = z.object({
  receipt_id: z.string(),
  merchant_id: z.string(),
  sequence_number: z.number().int().positive(),
  prev_hash: z.string().nullable(),
  hash: z.string(),
  signature: z.string(),
  signing_key_version: z.number().int().positive(),
  issued_at: z.string(),
  decision: DecisionSchema,
  strictness_used: z.number().min(0.5).max(0.95),
  extraction_confidence: z.number().min(0).max(1),
  degraded: z.boolean(),
  intent_text: z.string(),
  intent_hash: z.string(),
  constraint_set: ConstraintSetSchema,
  cart: CartSchema,
  cart_total_minor: z.number().int().nonnegative(),
  currency: z.string().length(3).toUpperCase(),
  checks: z.array(CheckResultSchema),
  versions: ReceiptVersionsSchema,
  latency_ms: ReceiptLatencySchema,
  request_id: z.string(),
});
export type Receipt = z.infer<typeof ReceiptSchema>;

// ==========================================
// 5. API Request & Response Schemas
// ==========================================

export const VerifyRequestSchema = z.object({
  intent_text: z.string().min(1).max(2000),
  cart: CartSchema,
  strictness: z.number().min(0.5).max(0.95).optional(),
  mandate: z
    .object({
      id: z.string(),
      max_amount: z.number().optional(),
      allowed_merchants: z.array(z.string()).optional(),
      expires_at: z.string().optional(),
      signature: z.string().optional(),
    })
    .optional(),
});
export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;

export const StepUpProposalSchema = z.object({
  original_sku: z.string(),
  proposed_sku: z.string(),
  proposed_title: z.string(),
  proposed_unit_amount: z.number().int().nonnegative(),
  reason: z.string(),
});
export type StepUpProposal = z.infer<typeof StepUpProposalSchema>;

export const VerifyResponseSchema = z.object({
  decision: DecisionSchema,
  receipt_id: z.string(),
  sequence_number: z.number(),
  hash: z.string(),
  signature: z.string(),
  checks: z.array(CheckResultSchema),
  degraded: z.boolean(),
  step_up_proposal: StepUpProposalSchema.nullable().optional(),
  razorpay_order_id: z.string().nullable().optional(),
  latency_ms: ReceiptLatencySchema,
});
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;

// ==========================================
// 6. Public Verification Result
// ==========================================

export const PublicVerifyResultSchema = z.object({
  receipt_id: z.string(),
  sequence_number: z.number(),
  prev_hash: z.string().nullable(),
  hash: z.string(),
  signature: z.string(),
  signature_valid: z.boolean(),
  chain_link_valid: z.boolean(),
  signing_key_version: z.number(),
  issued_at: z.string(),
  decision: DecisionSchema,
  strictness_used: z.number(),
  checks_summary: z.array(
    z.object({
      check_id: z.string(),
      constraint_kind: ConstraintKindSchema,
      layer: LayerSchema,
      verdict: VerdictSchema,
      confidence: z.number(),
      reason: z.string(),
    })
  ),
  versions: ReceiptVersionsSchema,
});
export type PublicVerifyResult = z.infer<typeof PublicVerifyResultSchema>;

// ==========================================
// 7. Catalog SKU Definition
// ==========================================

export const ProductSKUSchema = z.object({
  sku: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  category_path: z.array(z.string()),
  brand: z.string(),
  price_paise: z.number().int().nonnegative(),
  currency: z.string().default('INR'),
  condition: z.enum(['new', 'refurbished', 'used']).default('new'),
  refundable: z.boolean().default(true),
  attributes: z.record(z.string()),
  delivery_days: z.number().int().default(2),
  image_url: z.string().optional(),
  in_stock: z.boolean().default(true),
});
export type ProductSKU = z.infer<typeof ProductSKUSchema>;
