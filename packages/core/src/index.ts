export * from './validator/index.js';
export * from './checks/deterministic.js';
export * from './calibration/platt.js';
export * from './decide/index.js';
export * from './receipt/index.js';
export * from './llm/index.js';
export * from './payments/index.js';
export * from './resolver/index.js';
export * from './agent/index.js';

import catalogData from './fixtures/catalog.json' with { type: 'json' };
import type { ProductSKU } from '@concord/schema';

export const CATALOG: ProductSKU[] = catalogData as unknown as ProductSKU[];
