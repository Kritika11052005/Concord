import { describe, it, expect } from 'vitest';
import { validateConstraintSet } from '../src/validator/index.js';
import type { ConstraintSet } from '@concord/schema';

describe('Extraction Validator', () => {
  const validSet: ConstraintSet = {
    intent_id: 'i_1',
    intent_text: 'espresso machine under ₹15,000',
    intent_hash: 'abc',
    extracted_at: '2026-08-23T00:00:00Z',
    extractor_version: '1.0.0',
    constraints: [
      {
        id: 'c_price',
        kind: 'price_max',
        operator: 'lte',
        value: { type: 'money', amount: 1500000, currency: 'INR' },
        scope: 'total',
        hardness: 'hard',
        source_span: { start: 17, end: 30, text: 'under ₹15,000' },
        confidence: 0.95,
      },
    ],
    semantic_residue: null,
    extraction_confidence: 0.95,
  };

  it('validates a faithful extraction', () => {
    const res = validateConstraintSet(validSet, 'INR');
    expect(res.valid).toBe(true);
  });

  it('rejects source_span mismatch', () => {
    const badSet: ConstraintSet = {
      ...validSet,
      constraints: [
        {
          ...validSet.constraints[0],
          source_span: { start: 0, end: 8, text: 'wrong_word' },
        },
      ],
    };
    const res = validateConstraintSet(badSet, 'INR');
    expect(res.valid).toBe(false);
    expect((res as any).rule).toBe('source_span_mismatch');
  });

  it('rejects currency mismatch with cart', () => {
    const res = validateConstraintSet(validSet, 'USD');
    expect(res.valid).toBe(false);
    expect((res as any).rule).toBe('currency_mismatch');
  });

  it('rejects conflicting hard constraints (min > max)', () => {
    const conflictSet: ConstraintSet = {
      ...validSet,
      intent_text: 'espresso between 20k and 10k',
      constraints: [
        {
          id: 'c_max',
          kind: 'price_max',
          operator: 'lte',
          value: { type: 'money', amount: 1000000, currency: 'INR' },
          scope: 'total',
          hardness: 'hard',
          source_span: { start: 21, end: 28, text: 'and 10k' },
          confidence: 0.95,
        },
        {
          id: 'c_min',
          kind: 'price_min',
          operator: 'gte',
          value: { type: 'money', amount: 2000000, currency: 'INR' },
          scope: 'total',
          hardness: 'hard',
          source_span: { start: 9, end: 20, text: 'between 20k' },
          confidence: 0.95,
        },
      ],
    };
    const res = validateConstraintSet(conflictSet, 'INR');
    expect(res.valid).toBe(false);
    expect((res as any).rule).toBe('conflicting_constraints');
  });
});
