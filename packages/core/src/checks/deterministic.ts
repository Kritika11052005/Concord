import type {
  Cart,
  CheckResult,
  Constraint,
  ConstraintSet,
} from '@concord/schema';

/**
 * Pure deterministic check engine (Layer 1).
 * Never reads merchant-authored free-text (title/description).
 * Operates strictly on structured fields.
 */
export function evaluateDeterministicChecks(
  constraintSet: ConstraintSet,
  cart: Cart,
  allowedMerchantsFromMandate?: string[]
): CheckResult[] {
  const results: CheckResult[] = [];

  for (const c of constraintSet.constraints) {
    switch (c.kind) {
      case 'price_max': {
        if (c.value.type === 'money') {
          const capMinor = c.value.amount;
          const currency = c.value.currency;

          if (c.scope === 'total') {
            const passed = cart.total_amount <= capMinor;
            const observedFormatted = (cart.total_amount / 100).toLocaleString('en-IN', {
              style: 'currency',
              currency,
            });
            const capFormatted = (capMinor / 100).toLocaleString('en-IN', {
              style: 'currency',
              currency,
            });

            results.push({
              check_id: `chk_${c.id}_total`,
              constraint_id: c.id,
              constraint_kind: c.kind,
              hardness: c.hardness,
              layer: 'deterministic',
              line_sku: null,
              verdict: passed ? 'pass' : 'fail',
              confidence: 1.0,
              reason: passed
                ? `Cart total ${observedFormatted} is within the ${capFormatted} budget.`
                : `Cart total ${observedFormatted} exceeds the ${capFormatted} budget limit.`,
              observed: { amount_minor: cart.total_amount, currency },
              expected: { max_minor: capMinor, currency },
            });
          } else {
            // per_unit or per_line
            for (const line of cart.lines) {
              const passed = line.unit_amount <= capMinor;
              const unitFormatted = (line.unit_amount / 100).toLocaleString('en-IN', {
                style: 'currency',
                currency,
              });
              const capFormatted = (capMinor / 100).toLocaleString('en-IN', {
                style: 'currency',
                currency,
              });

              results.push({
                check_id: `chk_${c.id}_${line.sku}`,
                constraint_id: c.id,
                constraint_kind: c.kind,
                hardness: c.hardness,
                layer: 'deterministic',
                line_sku: line.sku,
                verdict: passed ? 'pass' : 'fail',
                confidence: 1.0,
                reason: passed
                  ? `Item ${line.sku} unit price ${unitFormatted} is within ${capFormatted}.`
                  : `Item ${line.sku} unit price ${unitFormatted} exceeds the ${capFormatted} limit.`,
                observed: { unit_amount_minor: line.unit_amount, currency, sku: line.sku },
                expected: { max_unit_amount_minor: capMinor, currency },
              });
            }
          }
        }
        break;
      }

      case 'price_min': {
        if (c.value.type === 'money') {
          const minMinor = c.value.amount;
          const currency = c.value.currency;

          for (const line of cart.lines) {
            const passed = line.unit_amount >= minMinor;
            const unitFormatted = (line.unit_amount / 100).toLocaleString('en-IN', {
              style: 'currency',
              currency,
            });
            const minFormatted = (minMinor / 100).toLocaleString('en-IN', {
              style: 'currency',
              currency,
            });

            results.push({
              check_id: `chk_${c.id}_${line.sku}`,
              constraint_id: c.id,
              constraint_kind: c.kind,
              hardness: c.hardness,
              layer: 'deterministic',
              line_sku: line.sku,
              verdict: passed ? 'pass' : 'fail',
              confidence: 1.0,
              reason: passed
                ? `Item ${line.sku} price ${unitFormatted} meets minimum ${minFormatted}.`
                : `Item ${line.sku} price ${unitFormatted} is below minimum ${minFormatted}.`,
              observed: { unit_amount_minor: line.unit_amount, sku: line.sku },
              expected: { min_unit_amount_minor: minMinor },
            });
          }
        }
        break;
      }

      case 'quantity': {
        if (c.value.type === 'number') {
          const requiredQty = c.value.value;

          if (c.scope === 'total') {
            const totalQty = cart.lines.reduce((sum, l) => sum + l.quantity, 0);
            let passed = false;
            if (c.operator === 'eq') passed = totalQty === requiredQty;
            else if (c.operator === 'lte') passed = totalQty <= requiredQty;
            else if (c.operator === 'gte') passed = totalQty >= requiredQty;

            results.push({
              check_id: `chk_${c.id}_total`,
              constraint_id: c.id,
              constraint_kind: c.kind,
              hardness: c.hardness,
              layer: 'deterministic',
              line_sku: null,
              verdict: passed ? 'pass' : 'fail',
              confidence: 1.0,
              reason: passed
                ? `Total quantity ${totalQty} matches constraint (${c.operator} ${requiredQty}).`
                : `Total quantity ${totalQty} does not satisfy ${c.operator} ${requiredQty}.`,
              observed: { total_quantity: totalQty },
              expected: { operator: c.operator, quantity: requiredQty },
            });
          } else {
            for (const line of cart.lines) {
              let passed = false;
              if (c.operator === 'eq') passed = line.quantity === requiredQty;
              else if (c.operator === 'lte') passed = line.quantity <= requiredQty;
              else if (c.operator === 'gte') passed = line.quantity >= requiredQty;

              results.push({
                check_id: `chk_${c.id}_${line.sku}`,
                constraint_id: c.id,
                constraint_kind: c.kind,
                hardness: c.hardness,
                layer: 'deterministic',
                line_sku: line.sku,
                verdict: passed ? 'pass' : 'fail',
                confidence: 1.0,
                reason: passed
                  ? `Item ${line.sku} quantity ${line.quantity} matches (${c.operator} ${requiredQty}).`
                  : `Item ${line.sku} quantity ${line.quantity} fails requirement (${c.operator} ${requiredQty}).`,
                observed: { sku: line.sku, quantity: line.quantity },
                expected: { operator: c.operator, quantity: requiredQty },
              });
            }
          }
        }
        break;
      }

      case 'delivery_by': {
        if (c.value.type === 'date') {
          const reqDate = new Date(c.value.value);
          const promisedDate = cart.promised_delivery_date
            ? new Date(cart.promised_delivery_date)
            : null;

          if (!promisedDate) {
            results.push({
              check_id: `chk_${c.id}`,
              constraint_id: c.id,
              constraint_kind: c.kind,
              hardness: c.hardness,
              layer: 'deterministic',
              line_sku: null,
              verdict: 'fail',
              confidence: 1.0,
              reason: `No promised delivery date specified by merchant (required by ${c.value.value}).`,
              observed: { promised_delivery_date: null },
              expected: { delivery_by: c.value.value },
            });
          } else {
            const passed = promisedDate.getTime() <= reqDate.getTime();
            results.push({
              check_id: `chk_${c.id}`,
              constraint_id: c.id,
              constraint_kind: c.kind,
              hardness: c.hardness,
              layer: 'deterministic',
              line_sku: null,
              verdict: passed ? 'pass' : 'fail',
              confidence: 1.0,
              reason: passed
                ? `Promised delivery date (${cart.promised_delivery_date}) meets required deadline (${c.value.value}).`
                : `Promised delivery date (${cart.promised_delivery_date}) is after required deadline (${c.value.value}).`,
              observed: { promised_delivery_date: cart.promised_delivery_date },
              expected: { delivery_by: c.value.value },
            });
          }
        }
        break;
      }

      case 'brand_allow': {
        if (c.value.type === 'string_set') {
          const allowedBrands = c.value.values.map((b) => b.toLowerCase().trim());
          for (const line of cart.lines) {
            const lineBrand = (line.brand || '').toLowerCase().trim();
            const passed = allowedBrands.includes(lineBrand);

            results.push({
              check_id: `chk_${c.id}_${line.sku}`,
              constraint_id: c.id,
              constraint_kind: c.kind,
              hardness: c.hardness,
              layer: 'deterministic',
              line_sku: line.sku,
              verdict: passed ? 'pass' : 'fail',
              confidence: 1.0,
              reason: passed
                ? `Item ${line.sku} brand "${line.brand}" is in allowed list.`
                : `Item ${line.sku} brand "${line.brand}" is not in allowed list [${c.value.values.join(', ')}].`,
              observed: { brand: line.brand, sku: line.sku },
              expected: { allowed_brands: c.value.values },
            });
          }
        }
        break;
      }

      case 'brand_deny': {
        if (c.value.type === 'string_set') {
          const deniedBrands = c.value.values.map((b) => b.toLowerCase().trim());
          for (const line of cart.lines) {
            const lineBrand = (line.brand || '').toLowerCase().trim();
            const passed = !deniedBrands.includes(lineBrand);

            results.push({
              check_id: `chk_${c.id}_${line.sku}`,
              constraint_id: c.id,
              constraint_kind: c.kind,
              hardness: c.hardness,
              layer: 'deterministic',
              line_sku: line.sku,
              verdict: passed ? 'pass' : 'fail',
              confidence: 1.0,
              reason: passed
                ? `Item ${line.sku} brand "${line.brand}" is not denied.`
                : `Item ${line.sku} brand "${line.brand}" is on denied brands list.`,
              observed: { brand: line.brand, sku: line.sku },
              expected: { denied_brands: c.value.values },
            });
          }
        }
        break;
      }

      case 'condition': {
        if (c.value.type === 'string_set') {
          const allowedConditions = c.value.values.map((v) => v.toLowerCase().trim());
          for (const line of cart.lines) {
            const lineCond = (line.condition || 'new').toLowerCase().trim();
            const passed = allowedConditions.includes(lineCond);

            results.push({
              check_id: `chk_${c.id}_${line.sku}`,
              constraint_id: c.id,
              constraint_kind: c.kind,
              hardness: c.hardness,
              layer: 'deterministic',
              line_sku: line.sku,
              verdict: passed ? 'pass' : 'fail',
              confidence: 1.0,
              reason: passed
                ? `Item condition "${line.condition}" satisfies condition requirement.`
                : `Item condition "${line.condition}" is not acceptable [${c.value.values.join(', ')}].`,
              observed: { condition: line.condition, sku: line.sku },
              expected: { allowed_conditions: c.value.values },
            });
          }
        }
        break;
      }

      case 'refundable': {
        if (c.value.type === 'boolean') {
          const required = c.value.value;
          for (const line of cart.lines) {
            const passed = !required || line.refundable === true;

            results.push({
              check_id: `chk_${c.id}_${line.sku}`,
              constraint_id: c.id,
              constraint_kind: c.kind,
              hardness: c.hardness,
              layer: 'deterministic',
              line_sku: line.sku,
              verdict: passed ? 'pass' : 'fail',
              confidence: 1.0,
              reason: passed
                ? `Item ${line.sku} return policy conforms to refundability requirements.`
                : `Item ${line.sku} is non-refundable, which violates requirement.`,
              observed: { refundable: line.refundable, sku: line.sku },
              expected: { refundable_required: required },
            });
          }
        }
        break;
      }

      case 'merchant_allow': {
        if (c.value.type === 'string_set') {
          const allowed = c.value.values;
          const passed = allowed.includes(cart.merchant_id);

          results.push({
            check_id: `chk_${c.id}`,
            constraint_id: c.id,
            constraint_kind: c.kind,
            hardness: c.hardness,
            layer: 'deterministic',
            line_sku: null,
            verdict: passed ? 'pass' : 'fail',
            confidence: 1.0,
            reason: passed
              ? `Merchant ID "${cart.merchant_id}" is authorized.`
              : `Merchant ID "${cart.merchant_id}" is not in mandate allowed list.`,
            observed: { merchant_id: cart.merchant_id },
            expected: { allowed_merchants: allowed },
          });
        }
        break;
      }

      default:
        // Semantic constraints handled by Layer 2
        break;
    }
  }

  return results;
}
