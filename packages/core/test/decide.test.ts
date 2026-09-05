import { describe, it, expect } from 'vitest';
import { decide } from '../src/decide/index.js';
import type { CheckResult } from '@concord/schema';

describe('Decision Algebra decide()', () => {
  const baseCheck: CheckResult = {
    check_id: 'chk_1',
    constraint_id: 'c_1',
    constraint_kind: 'price_max',
    hardness: 'hard',
    layer: 'deterministic',
    line_sku: 'SKU_1',
    verdict: 'pass',
    confidence: 1.0,
    reason: 'Under cap',
    observed: {},
    expected: {},
  };

  it('Rule 1: Declines on hard deterministic failure', () => {
    const checks: CheckResult[] = [
      { ...baseCheck, verdict: 'fail' },
    ];
    const res = decide(checks, 0.9, 0.75);
    expect(res.decision).toBe('decline');
    expect(res.rule_applied).toBe('hard_deterministic_fail');
  });

  it('Rule 2: Step-up on unavailable check (fail-closed)', () => {
    const checks: CheckResult[] = [
      baseCheck,
      {
        ...baseCheck,
        constraint_kind: 'category',
        layer: 'semantic',
        verdict: 'unavailable',
      },
    ];
    const res = decide(checks, 0.9, 0.75);
    expect(res.decision).toBe('step_up');
    expect(res.rule_applied).toBe('check_unavailable');
  });

  it('Rule 3: Step-up when extraction confidence < 0.6', () => {
    const checks: CheckResult[] = [baseCheck];
    const res = decide(checks, 0.55, 0.75);
    expect(res.decision).toBe('step_up');
    expect(res.rule_applied).toBe('low_extraction_confidence');
  });

  it('Rule 4: Declines on hard semantic fail with confidence >= strictness', () => {
    const checks: CheckResult[] = [
      baseCheck,
      {
        ...baseCheck,
        constraint_kind: 'category',
        layer: 'semantic',
        verdict: 'fail',
        confidence: 0.85,
      },
    ];
    const res = decide(checks, 0.9, 0.75);
    expect(res.decision).toBe('decline');
    expect(res.rule_applied).toBe('high_confidence_semantic_fail');
  });

  it('Rule 5: Step-up on hard semantic fail with confidence < strictness', () => {
    const checks: CheckResult[] = [
      baseCheck,
      {
        ...baseCheck,
        constraint_kind: 'category',
        layer: 'semantic',
        verdict: 'fail',
        confidence: 0.65,
      },
    ];
    const res = decide(checks, 0.9, 0.75);
    expect(res.decision).toBe('step_up');
    expect(res.rule_applied).toBe('low_confidence_semantic_fail');
  });

  it('Rule 6: Step-up on soft constraint failure', () => {
    const checks: CheckResult[] = [
      baseCheck,
      {
        ...baseCheck,
        hardness: 'soft',
        verdict: 'fail',
      },
    ];
    const res = decide(checks, 0.9, 0.75);
    expect(res.decision).toBe('step_up');
    expect(res.rule_applied).toBe('soft_constraint_fail');
  });

  it('Safety net: Step-up when zero checks ran', () => {
    const res = decide([], 0.95, 0.75);
    expect(res.decision).toBe('step_up');
    expect(res.rule_applied).toBe('zero_checks_safety_net');
    expect(res.reason).toBe('No constraints could be verified against this request.');
  });

  it('Rule 7: Passes when all checks conform', () => {
    const checks: CheckResult[] = [baseCheck];
    const res = decide(checks, 0.95, 0.75);
    expect(res.decision).toBe('pass');
    expect(res.rule_applied).toBe('all_checks_passed');
  });
});
