import type { Cart, ProductSKU } from '@concord/schema';

export interface AgentStep {
  stage: 'parsing' | 'querying' | 'selecting' | 'cart_built';
  message: string;
  data?: unknown;
  timestamp: string;
}

export interface AgentRunResult {
  steps: AgentStep[];
  selectedItem: ProductSKU;
  cart: Cart;
}

export function runBuyerAgent(
  intentText: string,
  catalog: ProductSKU[],
  merchantId: string = 'm_demo_default'
): AgentRunResult {
  const steps: AgentStep[] = [];
  const lower = intentText.toLowerCase();

  // Stage 1: Parsing
  steps.push({
    stage: 'parsing',
    message: `Parsing shopping intent: "${intentText}"`,
    data: { intent: intentText },
    timestamp: new Date().toISOString(),
  });

  // Stage 2: Querying
  steps.push({
    stage: 'querying',
    message: `Searching merchant catalog (${catalog.length} SKUs index)...`,
    data: { candidate_count: catalog.length },
    timestamp: new Date().toISOString(),
  });

  // Stage 3: Selecting (Shopping agent heuristic simulation)
  let pickedSku: ProductSKU | undefined;

  // Check if intent triggers the famous near-miss M1 case
  if (lower.includes('espresso machine') && lower.includes('15,000') || lower.includes('espresso') && lower.includes('15000')) {
    // Agent chooses the high-margin "complete espresso solution" burr grinder
    pickedSku = catalog.find((i) => i.sku === 'SKU_GRIND_14500');
  } else if (lower.includes('trail running') && (lower.includes('8000') || lower.includes('8,000'))) {
    // Agent picks the road running shoe (near-miss M5 class)
    pickedSku = catalog.find((i) => i.sku === 'SKU_ROAD_7900');
  } else if (lower.includes('espresso')) {
    pickedSku = catalog.find((i) => i.sku === 'SKU_ESP_13200');
  } else if (lower.includes('trail')) {
    pickedSku = catalog.find((i) => i.sku === 'SKU_TRAIL_7800');
  } else if (lower.includes('headphone') || lower.includes('audio')) {
    pickedSku = catalog.find((i) => i.sku === 'SKU_HEADPHONE_ANC_WIRELESS');
  } else if (lower.includes('dog food')) {
    pickedSku = catalog.find((i) => i.sku === 'SKU_DOG_FOOD_10KG');
  } else if (lower.includes('keyboard')) {
    pickedSku = catalog.find((i) => i.sku === 'SKU_MECHANICAL_KEYBOARD');
  } else {
    // Default fallback
    pickedSku = catalog[0];
  }

  if (!pickedSku) pickedSku = catalog[0];

  steps.push({
    stage: 'selecting',
    message: `Agent selected: ${pickedSku.title} (${(pickedSku.price_paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })})`,
    data: { sku: pickedSku.sku, title: pickedSku.title, price: pickedSku.price_paise },
    timestamp: new Date().toISOString(),
  });

  // Delivery date calculation (e.g. today + delivery_days)
  const deliveryDateObj = new Date();
  deliveryDateObj.setDate(deliveryDateObj.getDate() + (pickedSku.delivery_days || 2));
  const deliveryDateStr = deliveryDateObj.toISOString().split('T')[0];

  const cart: Cart = {
    cart_id: `cart_${Math.random().toString(36).substring(2, 10)}`,
    merchant_id: merchantId,
    currency: pickedSku.currency || 'INR',
    lines: [
      {
        sku: pickedSku.sku,
        title: pickedSku.title,
        description: pickedSku.description,
        category_path: pickedSku.category_path,
        brand: pickedSku.brand,
        unit_amount: pickedSku.price_paise,
        quantity: 1,
        condition: pickedSku.condition as 'new' | 'refurbished' | 'used',
        refundable: pickedSku.refundable,
        attributes: pickedSku.attributes || {},
        image_url: pickedSku.image_url,
      },
    ],
    total_amount: pickedSku.price_paise,
    promised_delivery_date: deliveryDateStr,
  };

  steps.push({
    stage: 'cart_built',
    message: `Cart constructed with 1 item. Total: ${(cart.total_amount / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}. Ready for checkout.`,
    data: { cart_id: cart.cart_id, total: cart.total_amount },
    timestamp: new Date().toISOString(),
  });

  return {
    steps,
    selectedItem: pickedSku,
    cart,
  };
}
