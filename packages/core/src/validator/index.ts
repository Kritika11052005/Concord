import type { Constraint, ConstraintSet } from '@concord/schema';

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string; rule: string };

const ALLOWED_KINDS = new Set([
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

const VALID_OPERATOR_VALUE_TYPES: Record<string, string[]> = {
  lte: ['money', 'number', 'date'],
  gte: ['money', 'number', 'date'],
  eq: ['money', 'number', 'date', 'boolean', 'text'],
  neq: ['money', 'number', 'date', 'boolean', 'text'],
  in: ['string_set'],
  not_in: ['string_set'],
  before: ['date'],
  after: ['date'],
};

/**
 * Validates extracted constraints against strict integrity rules:
 * 1. source_span exactly matches the intent_text at those offsets
 * 2. kind is in the closed set
 * 3. operator is compatible with value type
 * 4. confidence is in [0, 1]
 * 5. no conflicting hard constraints (e.g. price_max < price_min)
 */
export function validateConstraintSet(
  constraintSet: ConstraintSet,
  cartCurrency?: string
): ValidationResult {
  const { intent_text, constraints } = constraintSet;

  if (constraintSet.extraction_confidence < 0 || constraintSet.extraction_confidence > 1) {
    return {
      valid: false,
      rule: 'confidence_range',
      reason: `Extraction confidence ${constraintSet.extraction_confidence} outside [0, 1]`,
    };
  }

  for (const c of constraints) {
    // 1. Kind whitelist
    if (!ALLOWED_KINDS.has(c.kind)) {
      return {
        valid: false,
        rule: 'unknown_kind',
        reason: `Unknown constraint kind "${c.kind}"`,
      };
    }

    // 2. Source span match
    const spanText = intent_text.slice(c.source_span.start, c.source_span.end);
    if (spanText.toLowerCase() !== c.source_span.text.toLowerCase()) {
      return {
        valid: false,
        rule: 'source_span_mismatch',
        reason: `Source span mismatch on ${c.id}: expected "${c.source_span.text}", found "${spanText}" in intent`,
      };
    }

    // 3. Operator and value compatibility
    const allowedTypes = VALID_OPERATOR_VALUE_TYPES[c.operator];
    if (!allowedTypes || !allowedTypes.includes(c.value.type)) {
      return {
        valid: false,
        rule: 'incompatible_operator_value',
        reason: `Operator "${c.operator}" is incompatible with value type "${c.value.type}" in constraint ${c.id}`,
      };
    }

    // 4. Confidence range
    if (c.confidence < 0 || c.confidence > 1) {
      return {
        valid: false,
        rule: 'confidence_range',
        reason: `Confidence ${c.confidence} outside [0, 1] on constraint ${c.id}`,
      };
    }

    // 5. Currency check if cart currency is provided
    if (c.value.type === 'money' && cartCurrency) {
      if (c.value.currency.toUpperCase() !== cartCurrency.toUpperCase()) {
        return {
          valid: false,
          rule: 'currency_mismatch',
          reason: `Currency ${c.value.currency} in constraint ${c.id} differs from cart currency ${cartCurrency}`,
        };
      }
    }
  }

  // 6. Conflicting hard constraints
  const hardPriceMax = constraints.find(
    (c: Constraint) => c.kind === 'price_max' && c.hardness === 'hard' && c.value.type === 'money'
  );
  const hardPriceMin = constraints.find(
    (c: Constraint) => c.kind === 'price_min' && c.hardness === 'hard' && c.value.type === 'money'
  );

  if (
    hardPriceMax &&
    hardPriceMin &&
    hardPriceMax.value.type === 'money' &&
    hardPriceMin.value.type === 'money'
  ) {
    if (hardPriceMax.value.amount < hardPriceMin.value.amount) {
      return {
        valid: false,
        rule: 'conflicting_constraints',
        reason: `Conflicting price constraints: max ${hardPriceMax.value.amount} < min ${hardPriceMin.value.amount}`,
      };
    }
  }

  return { valid: true };
}
