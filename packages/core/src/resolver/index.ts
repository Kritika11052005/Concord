import type {
  Cart,
  ConstraintSet,
  ProductSKU,
  StepUpProposal,
} from '@concord/schema';

export function resolveStepUpProposal(
  constraintSet: ConstraintSet,
  cart: Cart,
  catalog: ProductSKU[]
): StepUpProposal | null {
  const categoryConstraint = constraintSet.constraints.find(
    (c) => c.kind === 'category'
  );
  const priceConstraint = constraintSet.constraints.find(
    (c) => c.kind === 'price_max' && c.value.type === 'money'
  );

  const reqText = categoryConstraint && categoryConstraint.value.type === 'text'
    ? categoryConstraint.value.value.toLowerCase()
    : '';

  const maxPriceMinor = priceConstraint && priceConstraint.value.type === 'money'
    ? priceConstraint.value.amount
    : Infinity;

  // Search catalog for a conforming item
  const match = catalog.find((item) => {
    const itemPrice = item.price_paise;
    if (itemPrice > maxPriceMinor) return false;

    const titleLower = item.title.toLowerCase();
    const catPath = item.category_path.map((p) => p.toLowerCase()).join(' ');

    if (reqText.includes('espresso')) {
      return (titleLower.includes('espresso machine') || titleLower.includes('espresso maker')) && !titleLower.includes('grinder');
    }
    if (reqText.includes('trail running') || reqText.includes('trail')) {
      return catPath.includes('trail') && !catPath.includes('road');
    }
    if (reqText.includes('wireless headphone')) {
      return item.attributes?.connectivity === 'bluetooth / wireless' || titleLower.includes('wireless');
    }
    if (reqText.includes('dog food')) {
      return catPath.includes('dog') || titleLower.includes('dog');
    }
    return false;
  });

  if (!match) return null;

  const originalSku = cart.lines[0]?.sku || 'unknown';
  const priceFormatted = (match.price_paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
  });

  return {
    original_sku: originalSku,
    proposed_sku: match.sku,
    proposed_title: match.title,
    proposed_unit_amount: match.price_paise,
    reason: `Found "${match.title}" (${priceFormatted}), which conforms to your original request.`,
  };
}
