import { describe, it, expect, vi } from 'vitest';
import {
  GoogleGeminiProvider,
  createLLMProvider,
  GeminiRateLimitError,
  type SpendGuard,
} from '../src/llm/index.js';
import type { Cart, ConstraintSet } from '@concord/schema';

describe('Gemini Provider & Hygiene Tests', () => {
  const mockCart: Cart = {
    cart_id: 'cart_test_1',
    merchant_id: '00000000-0000-0000-0000-000000000001',
    currency: 'INR',
    lines: [
      {
        sku: 'SKU_ESP_13200',
        title: 'Espresso Express Deluxe 15-bar pump espresso maker',
        description: 'Authentic 15-bar pump espresso maker',
        category_path: ['Home & Kitchen', 'Kitchen Appliances', 'Coffee & Espresso', 'Espresso Machines'],
        brand: 'CafePro',
        unit_amount: 1320000,
        quantity: 1,
        condition: 'new',
        refundable: true,
        attributes: { power_wattage: 1250 },
      },
    ],
    total_amount: 1320000,
    promised_delivery_date: '2026-08-28',
  };

  const mockConstraintSet: ConstraintSet = {
    intent_id: 'intent_test',
    intent_text: 'espresso machine under 15k',
    intent_hash: 'hash_test',
    extracted_at: new Date().toISOString(),
    extractor_version: '1.0.0',
    constraints: [
      {
        id: 'c_category',
        kind: 'category',
        operator: 'eq',
        value: { type: 'text', value: 'Espresso Machine' },
        scope: 'per_line',
        hardness: 'hard',
        source_span: { start: 0, end: 16, text: 'espresso machine' },
        confidence: 0.95,
      },
    ],
    semantic_residue: null,
    extraction_confidence: 0.95,
  };

  it('createLLMProvider recognizes gemini-2.5-flash', () => {
    const provider = createLLMProvider('gemini-2.5-flash', 'test-key');
    expect(provider).toBeInstanceOf(GoogleGeminiProvider);
  });

  it('Spend Guard blocks remote API call and triggers fail-closed fallback when ceiling is hit', async () => {
    const mockSpendGuard: SpendGuard = {
      canSpend: vi.fn().mockResolvedValue(false), // Ceiling hit
      recordSpend: vi.fn().mockResolvedValue(undefined),
    };

    const provider = new GoogleGeminiProvider('test-key', { spendGuard: mockSpendGuard });

    // 1. Extraction fallback
    const extracted = await provider.extractConstraints('espresso machine under 15k');
    expect(extracted).toBeDefined();
    expect(extracted.constraints.length).toBeGreaterThan(0);
    expect(mockSpendGuard.canSpend).toHaveBeenCalled();
    expect(mockSpendGuard.recordSpend).not.toHaveBeenCalled();

    // 2. Semantic check fallback to 'unavailable'
    const results = await provider.evaluateSemantic(mockConstraintSet, mockCart);
    expect(results.length).toBe(1);
    expect(results[0].verdict).toBe('unavailable');
    expect(results[0].confidence).toBe(0);
    expect(results[0].reason).toContain('spend ceiling reached');
  });

  it('GeminiRateLimitError is thrown on 429 and causes immediate fallback without retries', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCallCount = 0;

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      fetchCallCount++;
      return {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: {
            code: 429,
            message: 'Your prepayment credits are depleted.',
            status: 'RESOURCE_EXHAUSTED',
          },
        }),
      } as any;
    });

    try {
      const provider = new GoogleGeminiProvider('test-key');
      const results = await provider.evaluateSemantic(mockConstraintSet, mockCart);

      // Verify that exactly ONE fetch call was made (ZERO retries on 429)
      expect(fetchCallCount).toBe(1);
      expect(results.length).toBe(1);
      expect(results[0].verdict).toBe('unavailable');
      expect(results[0].reason).toContain('429');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('Transient 503 error is retried once with exponential backoff before fallback', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCallCount = 0;

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      fetchCallCount++;
      return {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error: 'Service Unavailable' }),
      } as any;
    });

    try {
      const provider = new GoogleGeminiProvider('test-key');
      const results = await provider.evaluateSemantic(mockConstraintSet, mockCart);

      // Initial attempt (1) + Exactly 1 retry (2) = 2 calls
      expect(fetchCallCount).toBe(2);
      expect(results.length).toBe(1);
      expect(results[0].verdict).toBe('unavailable');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
