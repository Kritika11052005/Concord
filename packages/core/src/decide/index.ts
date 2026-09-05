import type { CheckResult, Decision } from '@concord/schema';

export interface DecisionOutcome {
  decision: Decision;
  rule_applied: string;
  reason: string;
  failing_checks: CheckResult[];
}

/**
 * Pure decision algebra engine.
 * Evaluated in strict order; first match wins.
 *
 * 1. Any deterministic check with verdict = fail on a hard constraint -> decline
 * 2. Any check with verdict = unavailable -> step_up (fail-closed)
 * 3. extraction_confidence < 0.6 -> step_up
 * 4. Any semantic check with verdict = fail on a hard constraint and confidence >= strictness -> decline
 * 5. Any semantic check with verdict = fail on a hard constraint and confidence < strictness -> step_up
 * 6. Any check with verdict = fail on a soft constraint -> step_up
 * 7. Otherwise -> pass
 */
export function decide(
  checks: CheckResult[],
  extractionConfidence: number,
  strictness: number = 0.75
): DecisionOutcome {
  // 1. Any deterministic check failed on hard constraint -> DECLINE
  const hardDeterministicFails = checks.filter(
    (c) => c.layer === 'deterministic' && c.hardness === 'hard' && c.verdict === 'fail'
  );
  if (hardDeterministicFails.length > 0) {
    return {
      decision: 'decline',
      rule_applied: 'hard_deterministic_fail',
      reason: `Hard deterministic constraint violated: ${hardDeterministicFails[0].reason}`,
      failing_checks: hardDeterministicFails,
    };
  }

  // 2. Any check unavailable (LLM timeout/error) -> STEP_UP (fail-closed)
  const unavailableChecks = checks.filter((c) => c.verdict === 'unavailable');
  if (unavailableChecks.length > 0) {
    return {
      decision: 'step_up',
      rule_applied: 'check_unavailable',
      reason: 'Semantic verification layer was unavailable; escalated for review.',
      failing_checks: unavailableChecks,
    };
  }

  // 3. Extraction confidence < 0.6 -> STEP_UP
  if (extractionConfidence < 0.6) {
    return {
      decision: 'step_up',
      rule_applied: 'low_extraction_confidence',
      reason: `Low confidence in intent interpretation (${extractionConfidence.toFixed(2)} < 0.60); escalated for human confirmation.`,
      failing_checks: [],
    };
  }

  // 4. Semantic check failed on hard constraint with confidence >= strictness -> DECLINE
  const highConfHardSemanticFails = checks.filter(
    (c) =>
      c.layer === 'semantic' &&
      c.hardness === 'hard' &&
      c.verdict === 'fail' &&
      c.confidence >= strictness
  );
  if (highConfHardSemanticFails.length > 0) {
    return {
      decision: 'decline',
      rule_applied: 'high_confidence_semantic_fail',
      reason: `Semantic constraint failed with high confidence (${highConfHardSemanticFails[0].confidence.toFixed(2)} >= ${strictness}): ${highConfHardSemanticFails[0].reason}`,
      failing_checks: highConfHardSemanticFails,
    };
  }

  // 5. Semantic check failed on hard constraint with confidence < strictness -> STEP_UP
  const lowConfHardSemanticFails = checks.filter(
    (c) =>
      c.layer === 'semantic' &&
      c.hardness === 'hard' &&
      c.verdict === 'fail' &&
      c.confidence < strictness
  );
  if (lowConfHardSemanticFails.length > 0) {
    return {
      decision: 'step_up',
      rule_applied: 'low_confidence_semantic_fail',
      reason: `Ambiguous semantic fit (${lowConfHardSemanticFails[0].confidence.toFixed(2)} < strictness ${strictness}); step-up suggested: ${lowConfHardSemanticFails[0].reason}`,
      failing_checks: lowConfHardSemanticFails,
    };
  }

  // 6. Any check failed on a soft constraint -> STEP_UP
  const softFails = checks.filter((c) => c.hardness === 'soft' && c.verdict === 'fail');
  if (softFails.length > 0) {
    return {
      decision: 'step_up',
      rule_applied: 'soft_constraint_fail',
      reason: `Soft preference not met: ${softFails[0].reason}`,
      failing_checks: softFails,
    };
  }

  // Zero-checks safety net -> STEP_UP
  if (checks.length === 0) {
    return {
      decision: 'step_up',
      rule_applied: 'zero_checks_safety_net',
      reason: 'No constraints could be verified against this request.',
      failing_checks: [],
    };
  }

  // 7. Otherwise -> PASS
  return {
    decision: 'pass',
    rule_applied: 'all_checks_passed',
    reason: 'All hard and soft constraints satisfied.',
    failing_checks: [],
  };
}
