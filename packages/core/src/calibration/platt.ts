/**
 * Platt scaling (two-parameter logistic regression)
 * Maps uncalibrated raw LLM confidence to calibrated posterior probability.
 * P(correct | raw_score) = 1 / (1 + exp(-(A * raw_score + B)))
 */
export interface PlattParameters {
  A: number;
  B: number;
}

// Default calibrated parameters fitted on dev splits
export const DEFAULT_PLATT_PARAMS: PlattParameters = {
  A: 3.2,
  B: -1.4,
};

export function calibrateConfidence(
  rawConfidence: number,
  params: PlattParameters = DEFAULT_PLATT_PARAMS
): number {
  if (rawConfidence <= 0) return 0.01;
  if (rawConfidence >= 1) return 0.99;

  const z = params.A * rawConfidence + params.B;
  const calibrated = 1 / (1 + Math.exp(-z));
  // Keep bounded to [0.01, 0.99]
  return Math.max(0.01, Math.min(0.99, Number(calibrated.toFixed(3))));
}
