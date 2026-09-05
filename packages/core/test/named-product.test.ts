import { describe, it, expect } from 'vitest';
import { MockLLMProvider } from '../src/llm/index.js';
import { evaluateDeterministicChecks } from '../src/checks/deterministic.js';
import { decide } from '../src/decide/index.js';
import { CATALOG } from '../src/index.js';
import type { Cart, CartLine, ProductSKU } from '@concord/schema';

function makeCart(sku: string): Cart {
  const item = CATALOG.find((p: ProductSKU) => p.sku === sku);
  if (!item) throw new Error(`SKU ${sku} not found in catalog`);

  const line: CartLine = {
    sku: item.sku,
    title: item.title,
    description: item.description,
    category_path: item.category_path,
    brand: item.brand,
    unit_amount: item.price_paise,
    quantity: 1,
    condition: item.condition,
    refundable: item.refundable,
    attributes: item.attributes || {},
    image_url: item.image_url,
  };

  return {
    cart_id: `cart_test_${sku}`,
    merchant_id: '00000000-0000-0000-0000-000000000001',
    currency: item.currency || 'INR',
    lines: [line],
    total_amount: item.price_paise,
    promised_delivery_date: '2026-08-28',
  };
}

describe('Fix B: Named Product Intent Verification', () => {
  const provider = new MockLLMProvider();
  const intent = 'buy AromaMaster Precision Conical Burr Coffee Grinder';

  it('Test 1: Named product with WRONG cart (espresso machine) produces non-pass decision and checks > 0', async () => {
    // Cart contains espresso machine (SKU_ESP_13200) instead of coffee grinder
    const wrongCart = makeCart('SKU_ESP_13200');

    // 1. Extract constraints
    const constraintSet = await provider.extractConstraints(intent);
    expect(constraintSet.constraints.length).toBe(0);
    expect(constraintSet.semantic_residue).toBeTruthy();
    expect(constraintSet.extraction_confidence).toBe(0.65);

    // 2. Deterministic checks (empty since no typed constraints)
    const detChecks = evaluateDeterministicChecks(constraintSet, wrongCart);

    // 3. Semantic checks (must fire residue check)
    const semChecks = await provider.evaluateSemantic(constraintSet, wrongCart);
    const allChecks = [...detChecks, ...semChecks];

    expect(allChecks.length).toBeGreaterThan(0);
    const residueCheck = allChecks.find((c) => c.constraint_id === 'c_residue_match');
    expect(residueCheck).toBeDefined();
    expect(residueCheck?.verdict).toBe('fail');

    // 4. Decision algebra
    const outcome = decide(allChecks, constraintSet.extraction_confidence, 0.75);
    expect(['decline', 'step_up']).toContain(outcome.decision);
  });

  it('Test 2: Named product with CORRECT cart (the grinder) produces pass decision and checks > 0', async () => {
    // Cart contains the exact grinder (SKU_GRIND_14500)
    const correctCart = makeCart('SKU_GRIND_14500');

    // 1. Extract constraints
    const constraintSet = await provider.extractConstraints(intent);
    expect(constraintSet.constraints.length).toBe(0);
    expect(constraintSet.semantic_residue).toBeTruthy();
    expect(constraintSet.extraction_confidence).toBe(0.65);

    // 2. Deterministic checks
    const detChecks = evaluateDeterministicChecks(constraintSet, correctCart);

    // 3. Semantic checks
    const semChecks = await provider.evaluateSemantic(constraintSet, correctCart);
    const allChecks = [...detChecks, ...semChecks];

    expect(allChecks.length).toBeGreaterThan(0);
    const residueCheck = allChecks.find((c) => c.constraint_id === 'c_residue_match');
    expect(residueCheck).toBeDefined();
    expect(residueCheck?.verdict).toBe('pass');

    // 4. Decision algebra
    const outcome = decide(allChecks, constraintSet.extraction_confidence, 0.75);
    expect(outcome.decision).toBe('pass');
    expect(outcome.rule_applied).toBe('all_checks_passed');
  });
});
