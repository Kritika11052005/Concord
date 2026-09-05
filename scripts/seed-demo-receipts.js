import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const API_BASE = process.env.API_URL || 'http://localhost:3001';
// 15 SKU catalog items for diverse checkout generation
const CATALOG_ITEMS = {
    SKU_ESP_13200: {
        sku: 'SKU_ESP_13200',
        title: 'Barista Pro 15-Bar Compact Espresso Machine',
        description: 'Premium 15-bar Italian pump espresso machine with integrated milk frother.',
        category_path: ['Kitchen', 'Coffee', 'Espresso Machines'],
        brand: 'BaristaPro',
        unit_amount: 1320000,
        currency: 'INR',
    },
    SKU_GRIND_14500: {
        sku: 'SKU_GRIND_14500',
        title: 'AromaMaster Precision Conical Burr Coffee Grinder',
        description: 'Professional 40mm conical steel burr grinder with 30 micro-settings.',
        category_path: ['Kitchen', 'Coffee', 'Grinders'],
        brand: 'AromaMaster',
        unit_amount: 1450000,
        currency: 'INR',
    },
    SKU_POUR_12000: {
        sku: 'SKU_POUR_12000',
        title: 'Artisan Handcrafted Glass Pour-Over Drip Coffee Maker',
        description: 'Thermal-resistant borosilicate glass pour-over brewer with permanent stainless steel filter.',
        category_path: ['Kitchen', 'Coffee', 'Manual Brewers'],
        brand: 'ArtisanBrew',
        unit_amount: 1200000,
        currency: 'INR',
    },
    SKU_TRAIL_7800: {
        sku: 'SKU_TRAIL_7800',
        title: 'Apex Terra Grip Trail Running Shoes (Size 8)',
        description: 'All-terrain trail running shoes with Vibram multidirectional lugged outsole.',
        category_path: ['Footwear', 'Running', 'Trail'],
        brand: 'Apex',
        unit_amount: 780000,
        currency: 'INR',
    },
    SKU_ROAD_7900: {
        sku: 'SKU_ROAD_7900',
        title: 'AeroPace Speed Road Running Shoes (Size 8)',
        description: 'Lightweight responsive road racing and pavement shoes with smooth blown-rubber outsole.',
        category_path: ['Footwear', 'Running', 'Road'],
        brand: 'AeroPace',
        unit_amount: 790000,
        currency: 'INR',
    },
    SKU_HEADPHONE_ANC_WIRELESS: {
        sku: 'SKU_HEADPHONE_ANC_WIRELESS',
        title: 'SonicQuiet 500 Wireless Active Noise Cancelling Headphones',
        description: 'Over-ear Bluetooth 5.3 headphones with hybrid ANC, 40-hour battery life.',
        category_path: ['Electronics', 'Audio', 'Headphones'],
        brand: 'SonicQuiet',
        unit_amount: 1850000,
        currency: 'INR',
    },
    SKU_SMARTWATCH_GPS: {
        sku: 'SKU_SMARTWATCH_GPS',
        title: 'PulseApex Pro Multi-Sport GPS Smartwatch',
        description: 'Rugged titanium GPS smartwatch with wrist heart rate and topographical maps.',
        category_path: ['Electronics', 'Wearables', 'Smartwatches'],
        brand: 'PulseApex',
        unit_amount: 2299900,
        currency: 'INR',
    },
    SKU_DOG_FOOD_10KG: {
        sku: 'SKU_DOG_FOOD_10KG',
        title: 'NaturePure Grain-Free Adult Dog Food (10kg Chicken & Sweet Potato)',
        description: 'Complete balanced nutrition for adult dogs with real deboned chicken and probiotics.',
        category_path: ['Pet Supplies', 'Dogs', 'Food'],
        brand: 'NaturePure',
        unit_amount: 349900,
        currency: 'INR',
    },
    SKU_MECHANICAL_KEYBOARD: {
        sku: 'SKU_MECHANICAL_KEYBOARD',
        title: 'KeyCraft RGB Hot-Swappable 75% Mechanical Keyboard',
        description: 'Customizable 75% layout mechanical gaming keyboard with pre-lubed tactile switches.',
        category_path: ['Computers', 'Peripherals', 'Keyboards'],
        brand: 'KeyCraft',
        unit_amount: 649900,
        currency: 'INR',
    },
};
function buildCart(skuKey) {
    const item = CATALOG_ITEMS[skuKey];
    if (!item)
        throw new Error(`Unknown skuKey: ${skuKey}`);
    return {
        cart_id: `cart_seed_${Math.random().toString(36).substring(2, 10)}`,
        merchant_id: '00000000-0000-0000-0000-000000000001',
        currency: item.currency,
        lines: [
            {
                sku: item.sku,
                title: item.title,
                description: item.description,
                category_path: item.category_path,
                brand: item.brand,
                unit_amount: item.unit_amount,
                quantity: 1,
                condition: 'new',
                refundable: true,
                attributes: {},
            },
        ],
        total_amount: item.unit_amount,
        promised_delivery_date: '2026-08-28',
    };
}
// 30 realistic scenarios: ~15 pass, ~10 step-up, ~5 decline
const SCENARIOS = [
    // ── PASS (15) ──
    {
        intent: 'espresso machine under ₹15,000',
        sku: 'SKU_ESP_13200',
        expectedDecision: 'pass',
        description: 'Conforming espresso machine under budget',
    },
    {
        intent: 'espresso machine under ₹15,000', // repeated -> cache hit
        sku: 'SKU_ESP_13200',
        expectedDecision: 'pass',
        description: 'Repeated espresso machine (cache hit test)',
    },
    {
        intent: 'espresso machine under ₹15,000', // repeated -> cache hit
        sku: 'SKU_ESP_13200',
        expectedDecision: 'pass',
        description: 'Repeated espresso machine 3 (cache hit test)',
    },
    {
        intent: 'trail running shoes under ₹8,000',
        sku: 'SKU_TRAIL_7800',
        expectedDecision: 'pass',
        description: 'Conforming trail running shoes',
    },
    {
        intent: 'trail running shoes under ₹8,000', // repeated -> cache hit
        sku: 'SKU_TRAIL_7800',
        expectedDecision: 'pass',
        description: 'Repeated trail shoes (cache hit test)',
    },
    {
        intent: 'buy AromaMaster Precision Conical Burr Coffee Grinder',
        sku: 'SKU_GRIND_14500',
        expectedDecision: 'pass',
        description: 'Named product exact match pass',
    },
    {
        intent: 'buy AromaMaster Precision Conical Burr Coffee Grinder', // repeated -> cache hit
        sku: 'SKU_GRIND_14500',
        expectedDecision: 'pass',
        description: 'Named product repeated (cache hit test)',
    },
    {
        intent: 'wireless headphone under ₹20,000',
        sku: 'SKU_HEADPHONE_ANC_WIRELESS',
        expectedDecision: 'pass',
        description: 'Conforming wireless ANC headphones',
    },
    {
        intent: 'wireless headphone under ₹20,000', // repeated -> cache hit
        sku: 'SKU_HEADPHONE_ANC_WIRELESS',
        expectedDecision: 'pass',
        description: 'Repeated wireless headphones (cache hit)',
    },
    {
        intent: 'smartwatch under ₹25,000',
        sku: 'SKU_SMARTWATCH_GPS',
        expectedDecision: 'pass',
        description: 'Conforming GPS smartwatch',
    },
    {
        intent: 'smartwatch under ₹25,000', // repeated -> cache hit
        sku: 'SKU_SMARTWATCH_GPS',
        expectedDecision: 'pass',
        description: 'Repeated GPS smartwatch (cache hit)',
    },
    {
        intent: 'dog food under ₹4,000',
        sku: 'SKU_DOG_FOOD_10KG',
        expectedDecision: 'pass',
        description: 'Conforming premium dog food',
    },
    {
        intent: 'coffee maker under ₹15,000',
        sku: 'SKU_POUR_12000',
        expectedDecision: 'pass',
        description: 'Pour-over satisfying coffee maker appliance',
    },
    {
        intent: 'mechanical keyboard under ₹8,000',
        sku: 'SKU_MECHANICAL_KEYBOARD',
        expectedDecision: 'pass',
        description: 'Conforming mechanical keyboard under budget',
    },
    {
        intent: 'mechanical keyboard under ₹8,000', // repeated -> cache hit
        sku: 'SKU_MECHANICAL_KEYBOARD',
        expectedDecision: 'pass',
        description: 'Repeated mechanical keyboard (cache hit)',
    },
    // ── STEP-UP (10) ──
    // Using higher strictness (0.88-0.90) so near-miss category mismatches calibrate into step-up
    {
        intent: 'espresso machine under ₹15,000, delivered by Friday',
        sku: 'SKU_GRIND_14500',
        strictness: 0.90, // Calibrated conf 0.84 < strictness 0.90 -> STEP_UP
        expectedDecision: 'step_up',
        description: 'Near-miss grinder vs espresso machine at strictness 0.90',
    },
    {
        intent: 'trail running shoes under ₹8,000',
        sku: 'SKU_ROAD_7900',
        strictness: 0.90, // Calibrated conf 0.84 < strictness 0.90 -> STEP_UP
        expectedDecision: 'step_up',
        description: 'Road shoe substituted for trail running at strictness 0.90',
    },
    {
        intent: 'espresso machine under ₹15,000',
        sku: 'SKU_POUR_12000',
        strictness: 0.85, // Pour over vs espresso conf ~0.80 < 0.85 -> STEP_UP
        expectedDecision: 'step_up',
        description: 'Pour-over vs espresso machine at strictness 0.85',
    },
    {
        intent: 'trail running shoes under ₹8,000, need them by Friday',
        sku: 'SKU_ROAD_7900',
        strictness: 0.90,
        expectedDecision: 'step_up',
        description: 'Road running near miss with Friday delivery deadline',
    },
    {
        intent: 'espresso machine maker under ₹15k',
        sku: 'SKU_GRIND_14500',
        strictness: 0.90,
        expectedDecision: 'step_up',
        description: 'Grinder vs espresso maker intent at strictness 0.90',
    },
    {
        intent: 'rugged trail running shoes for mountain hiking',
        sku: 'SKU_ROAD_7900',
        strictness: 0.90,
        expectedDecision: 'step_up',
        description: 'Road pavement shoes selected for mountain trail',
    },
    {
        intent: 'wireless ANC headphones under ₹18,000',
        sku: 'SKU_MECHANICAL_KEYBOARD',
        strictness: 0.90,
        expectedDecision: 'step_up',
        description: 'Headphones vs keyboard at strictness 0.90',
    },
    {
        intent: 'standalone GPS outdoor smartwatch',
        sku: 'SKU_TRAIL_7800',
        strictness: 0.90,
        expectedDecision: 'step_up',
        description: 'Smartwatch vs shoe at strictness 0.90',
    },
    {
        intent: '15-bar pump espresso maker under ₹15,000',
        sku: 'SKU_POUR_12000',
        strictness: 0.85,
        expectedDecision: 'step_up',
        description: 'Pour-over brewer vs 15-bar pump espresso maker',
    },
    {
        intent: 'trail running shoes size 8',
        sku: 'SKU_ROAD_7900',
        strictness: 0.90,
        expectedDecision: 'step_up',
        description: 'Road shoe selected for trail running request',
    },
    // ── DECLINE (5) ──
    {
        intent: 'trail running shoes under ₹7,000',
        sku: 'SKU_TRAIL_7800',
        expectedDecision: 'decline',
        description: 'Hard budget violation: ₹7,800 > ₹7,000',
    },
    {
        intent: 'espresso machine under ₹10,000',
        sku: 'SKU_ESP_13200',
        expectedDecision: 'decline',
        description: 'Hard budget violation: ₹13,200 > ₹10,000',
    },
    {
        intent: 'buy AromaMaster Precision Conical Burr Coffee Grinder',
        sku: 'SKU_ESP_13200',
        expectedDecision: 'decline',
        description: 'Named product mismatch: grinder requested, espresso machine in cart',
    },
    {
        intent: 'dog food under ₹3,000',
        sku: 'SKU_DOG_FOOD_10KG',
        expectedDecision: 'decline',
        description: 'Hard budget violation: ₹3,499 > ₹3,000',
    },
    {
        intent: 'mechanical keyboard under ₹5,000',
        sku: 'SKU_MECHANICAL_KEYBOARD',
        expectedDecision: 'decline',
        description: 'Hard budget violation: ₹6,499 > ₹5,000',
    },
];
async function isServerRunning() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        return res.ok;
    }
    catch {
        return false;
    }
}
async function waitForServer(maxMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
        if (await isServerRunning())
            return;
        await new Promise((r) => setTimeout(r, 400));
    }
    throw new Error('Server did not become healthy within timeout');
}
async function main() {
    console.log('='.repeat(70));
    console.log('  CONCORD DEMO TRAFFIC SEED SCRIPT — 30 REAL VERIFY PIPELINE REQUESTS');
    console.log('='.repeat(70));
    let apiProc = null;
    if (!(await isServerRunning())) {
        console.log('\n[!] API server not running. Spawning apps/api/src/index.ts via tsx...');
        apiProc = spawn('npx', ['tsx', 'src/index.ts'], {
            cwd: path.resolve(rootDir, 'apps/api'),
            stdio: 'inherit',
            shell: true,
            env: { ...process.env, PORT: '3001' },
        });
        try {
            await waitForServer();
            console.log('[✓] API server is ready on http://localhost:3001');
        }
        catch (err) {
            if (apiProc)
                apiProc.kill();
            throw err;
        }
    }
    else {
        console.log('[✓] Detected running Concord API on http://localhost:3001');
    }
    const decisionCounts = { pass: 0, step_up: 0, decline: 0 };
    let successCount = 0;
    console.log(`\nDispatching ${SCENARIOS.length} sequential verification requests...\n`);
    for (let i = 0; i < SCENARIOS.length; i++) {
        const sc = SCENARIOS[i];
        const cart = buildCart(sc.sku);
        try {
            const payload = {
                intent_text: sc.intent,
                cart,
            };
            if (sc.strictness) {
                payload.strictness = sc.strictness;
            }
            const res = await fetch(`${API_BASE}/v1/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'idempotency-key': `seed_${i}_${Date.now()}`,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errText = await res.text();
                console.error(`  [${i + 1}/${SCENARIOS.length}] FAILED (${res.status}): ${errText}`);
                continue;
            }
            const data = await res.json();
            const dec = data.decision;
            decisionCounts[dec] = (decisionCounts[dec] || 0) + 1;
            successCount++;
            const mark = dec === sc.expectedDecision ? '✓' : '~';
            console.log(`  ${mark} [${(i + 1).toString().padStart(2, ' ')}/${SCENARIOS.length}] ${dec.toUpperCase().padEnd(7)} | ${sc.description}`);
        }
        catch (err) {
            console.error(`  [${i + 1}/${SCENARIOS.length}] Error:`, err.message);
        }
    }
    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log(`Total Requests Processed: ${successCount} / ${SCENARIOS.length}`);
    console.log(`Decision Breakdown:`);
    console.log(`  PASS:    ${decisionCounts.pass}`);
    console.log(`  STEP-UP: ${decisionCounts.step_up}`);
    console.log(`  DECLINE: ${decisionCounts.decline}`);
    // Fetch updated console metrics from database to verify consistency
    console.log('\nFetching fresh metrics from /v1/console/metrics...');
    try {
        const metricsRes = await fetch(`${API_BASE}/v1/console/metrics`);
        if (metricsRes.ok) {
            const metrics = await metricsRes.json();
            console.log('\n--- LIVE DATABASE OPS METRICS ---');
            console.log(`Chain Height:             #${metrics.chain_length}`);
            console.log(`p95 Latency:              ${metrics.p95_latency_ms} ms`);
            console.log(`Cache Hit Rate:           ${(metrics.cache_hit_rate * 100).toFixed(1)}%`);
            console.log(`Degradation Rate:         ${(metrics.degradation_rate * 100).toFixed(1)}%`);
            console.log(`Pass Orders (DB):         ${metrics.decision_mix?.pass}`);
            console.log(`Step-Up Orders (DB):      ${metrics.decision_mix?.step_up}`);
            console.log(`Decline Orders (DB):      ${metrics.decision_mix?.decline}`);
            const sumDecisions = (metrics.decision_mix?.pass || 0) +
                (metrics.decision_mix?.step_up || 0) +
                (metrics.decision_mix?.decline || 0);
            console.log(`Sum of Decisions:         ${sumDecisions}`);
            console.log(`Consistency Check:        ${sumDecisions === metrics.chain_length ? '✓ MATCH (No forks)' : '⚠ MISMATCH'}`);
            console.log(`Active Check Types:       ${metrics.checks_breakdown?.length || 0}`);
        }
    }
    catch (err) {
        console.error('Failed to fetch console metrics:', err.message);
    }
    if (apiProc) {
        console.log('\nStopping spawned API process...');
        apiProc.kill();
    }
    console.log('\n[✓] Seeding completed successfully.\n');
}
main().catch((err) => {
    console.error('Fatal seeding error:', err);
    process.exit(1);
});
