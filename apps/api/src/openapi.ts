export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Concord Agent Order Verification API',
    version: '1.0.0',
    description: `
# Concord Verification API Reference

Concord is an institutional-grade verification protocol that validates AI agent checkout orders against original human buyer intent before payment capture.

---

### 🛡️ Architecture & Verification Pipeline

Concord executes a fail-closed dual-layer verification engine for every agent-placed order:

1. **Layer 1: Deterministic Engine (Sub-15ms)**
   - Hard mathematical bounds checking: Cart Total $\\le$ Budget Cap, Item Quantities $\\le$ Ceiling, Delivery Date $\\le$ Max Timestamp, Brand Allowlists, Refundability Constraints.
   - Independent of LLMs — immune to hallucinations.

2. **Layer 2: Semantic Intent Engine (Platt-Calibrated)**
   - Natural language extraction with strict delimited untrusted block boundaries (Prompt Injection Hardened).
   - Validates semantic intent alignment (e.g. *Espresso Machine* vs *Coffee Grinder*, *Trail Runner* vs *Road Runner*).
   - Probabilities are Platt-calibrated against a 60-pair ground truth benchmark.

3. **Decision Algebra & Verdicts**
   - \`pass\`: All Layer 1 constraints satisfy AND Layer 2 semantic confidence $\\ge \\tau$ (strictness threshold, default 0.75).
   - \`step_up\`: Layer 1 satisfies, but Layer 2 confidence is borderline ($0.40 \\le c < \\tau$). Order is intercepted and requires human buyer confirmation.
   - \`decline\`: Any Layer 1 arithmetic violation OR semantic confidence $< 0.40$.

4. **Cryptographic Audit Hash Chain (Ed25519)**
   - Every verification generates an immutable receipt.
   - \`receipt_hash = SHA256(prev_hash || CanonicalJSON(receipt_body))\`.
   - Signed with Ed25519 merchant key (\`ck_live_...\`).

---

### 🔑 Authentication
All private API requests require an API key in the Authorization header:
\`\`\`http
Authorization: Bearer ck_live_a8f93bc102...
\`\`\`
`,
    contact: {
      name: 'Kritika Benjwal (Concord)',
      url: 'https://github.com/Kritika11052005/Concord',
      email: 'ananya.benjwal@gmail.com',
    },
    license: {
      name: 'Apache-2.0',
      url: 'https://opensource.org/licenses/Apache-2.0',
    },
  },
  servers: [
    {
      url: 'https://concord-mh6j.onrender.com',
      description: 'Live Production Gateway (Render)',
    },
    {
      url: 'http://localhost:3001',
      description: 'Local Development Gateway',
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Verification Pipeline',
      description: 'Core evaluation endpoints for AI agent order validation and receipt issuance.',
    },
    {
      name: 'Cryptographic Receipts',
      description: 'Tamper-evident audit receipt inspection and zero-PII public verification.',
    },
    {
      name: 'Agent Simulation & Catalog',
      description: 'Test utilities to simulate autonomous shopping agents and search product catalog.',
    },
    {
      name: 'Merchant Console & Ops',
      description: 'Merchant operations, live order feed, telemetry metrics, and strictness configuration.',
    },
    {
      name: 'Keys & System Health',
      description: 'Cryptographic public keys, key rotation info, and health probes.',
    },
  ],
  paths: {
    '/v1/verify': {
      post: {
        tags: ['Verification Pipeline'],
        summary: 'Verify AI-Agent Order Against Human Intent',
        description: 'Evaluates an AI-agent-placed shopping cart against the raw human prompt using dual-layer deterministic and semantic validation. Generates an Ed25519-signed cryptographic receipt committed to the merchant audit hash chain.',
        operationId: 'verifyOrder',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifyRequest' },
              examples: {
                standardPass: {
                  summary: 'Conforming Agent Order (Pass)',
                  value: {
                    intent_text: 'Buy me a pair of noise cancelling wireless headphones for my flight tomorrow, budget under ₹25,000. Sony or Bose preferred.',
                    cart: {
                      currency: 'INR',
                      total_amount: 19990,
                      lines: [
                        {
                          item_id: 'prod_wh1000xm5',
                          title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
                          unit_amount: 19990,
                          quantity: 1,
                          category_path: ['Electronics', 'Audio', 'Headphones'],
                          brand: 'Sony',
                          condition: 'new',
                          refundable: true,
                          description: 'Industry-leading noise cancellation with Auto NC Optimizer and 30-hour battery life.',
                        },
                      ],
                    },
                    agent_metadata: {
                      agent_id: 'agent_shop_gpt4o_01',
                      model_name: 'gpt-4o',
                      session_id: 'sess_9921_bc',
                    },
                  },
                },
                budgetViolation: {
                  summary: 'Budget Violation (Hard Decline)',
                  value: {
                    intent_text: 'Get an espresso machine for under ₹15,000.',
                    cart: {
                      currency: 'INR',
                      total_amount: 28500,
                      lines: [
                        {
                          item_id: 'prod_delonghi_dedica',
                          title: 'DeLonghi Dedica Deluxe Espresso Machine',
                          unit_amount: 28500,
                          quantity: 1,
                          category_path: ['Appliances', 'Coffee Machines'],
                          brand: 'DeLonghi',
                          condition: 'new',
                          refundable: true,
                          description: '15-bar pump espresso maker with manual milk frother.',
                        },
                      ],
                    },
                  },
                },
                semanticNearMiss: {
                  summary: 'Near-Miss Category Drift (Step-Up Interception)',
                  value: {
                    intent_text: 'Need trail running shoes with aggressive lug grip for muddy mountain trails.',
                    cart: {
                      currency: 'INR',
                      total_amount: 11499,
                      lines: [
                        {
                          item_id: 'prod_nike_pegasus',
                          title: 'Nike Air Zoom Pegasus 40 Road Running Shoe',
                          unit_amount: 11499,
                          quantity: 1,
                          category_path: ['Footwear', 'Running Shoes', 'Road'],
                          brand: 'Nike',
                          condition: 'new',
                          refundable: true,
                          description: 'Smooth road running trainer for asphalt and daily track workouts.',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Verification evaluation complete. Contains decision verdict and cryptographic receipt.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerifyResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid cart payload or malformed intent text.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized. Missing or invalid merchant API key.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/v1/receipts/{id}': {
      get: {
        tags: ['Cryptographic Receipts'],
        summary: 'Get Cryptographic Receipt Evidence Details',
        description: 'Retrieves the complete cryptographic receipt record, including character-level intent provenance spans, extracted constraint sets, per-check verification logs, execution latencies, and Ed25519 digital signature.',
        operationId: 'getReceipt',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'The unique receipt ID (e.g. `rec_sample_pass_001` or UUID)',
            schema: { type: 'string', example: 'rec_sample_pass_001' },
          },
        ],
        responses: {
          '200': {
            description: 'Receipt record retrieved successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    receipt: { $ref: '#/components/schemas/Receipt' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Receipt not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/v1/receipts/{id}/verify': {
      get: {
        tags: ['Cryptographic Receipts'],
        summary: 'Public Cryptographic Receipt Verifier (Zero PII)',
        description: 'Public, privacy-preserving verification endpoint. Recomputes SHA-256 canonical hash, verifies the Ed25519 digital signature against the merchant public key, and validates hash chain continuity without leaking buyer personal identifiable info (Zero PII).',
        operationId: 'verifyReceiptIntegrity',
        security: [],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'The receipt ID to cryptographically verify.',
            schema: { type: 'string', example: 'rec_sample_pass_001' },
          },
        ],
        responses: {
          '200': {
            description: 'Receipt cryptographic integrity report.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicVerificationResult' },
              },
            },
          },
          '404': {
            description: 'Receipt ID not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/v1/agent/simulate': {
      post: {
        tags: ['Agent Simulation & Catalog'],
        summary: 'Simulate Agent Order Generation',
        description: 'Executes an LLM-driven autonomous shopping agent against a buyer prompt and catalog inventory, returning the selected cart and rationale for testing.',
        operationId: 'simulateAgent',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: {
                    type: 'string',
                    description: 'Buyer intent prompt to simulate shopping for.',
                    example: 'Get me high quality barista espresso beans with medium roast profile under ₹1,200.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Agent cart selection generated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    agent_id: { type: 'string' },
                    decision: { type: 'string' },
                    cart: { $ref: '#/components/schemas/Cart' },
                    rationale: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/catalog/products': {
      get: {
        tags: ['Agent Simulation & Catalog'],
        summary: 'List Demo Store Products',
        description: 'Retrieves all available demo store catalog products with categories, prices, and specifications.',
        operationId: 'listCatalogProducts',
        security: [],
        responses: {
          '200': {
            description: 'Array of products.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/CartLine' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/payments/webhook': {
      post: {
        tags: ['Verification Pipeline'],
        summary: 'Merchant Payment Gateway Webhook',
        description: 'Receives payment intent webhooks (e.g. Stripe, Razorpay). Verifies receipt signature and decision before authorizing final settlement.',
        operationId: 'handlePaymentWebhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['event_type', 'receipt_id'],
                properties: {
                  event_type: { type: 'string', example: 'payment_intent.created' },
                  receipt_id: { type: 'string', example: 'rec_sample_pass_001' },
                  amount: { type: 'number', example: 19990 },
                  currency: { type: 'string', example: 'INR' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook processed. Verification confirmed.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'authorized' },
                    receipt_id: { type: 'string' },
                    settlement_status: { type: 'string', example: 'captured' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/console/orders': {
      get: {
        tags: ['Merchant Console & Ops'],
        summary: 'List Verified Order Feed',
        description: 'Returns real-time stream of agent checkout verification requests with decision filter and pagination for merchant ops.',
        operationId: 'listConsoleOrders',
        parameters: [
          {
            name: 'decision',
            in: 'query',
            required: false,
            description: 'Filter orders by decision verdict: `pass`, `step_up`, `decline`, or `all`.',
            schema: { type: 'string', enum: ['all', 'pass', 'step_up', 'decline'], default: 'all' },
          },
        ],
        responses: {
          '200': {
            description: 'List of recent orders.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orders: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          sequence_number: { type: 'integer' },
                          decision: { type: 'string', enum: ['pass', 'step_up', 'decline'] },
                          intent_text: { type: 'string' },
                          cart_total: { type: 'number' },
                          currency: { type: 'string' },
                          latency_total: { type: 'number' },
                          failing_reason: { type: 'string' },
                          issued_at: { type: 'string', format: 'date-time' },
                          hash: { type: 'string' },
                        },
                      },
                    },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/console/metrics': {
      get: {
        tags: ['Merchant Console & Ops'],
        summary: 'Merchant Ops & Telemetry Metrics',
        description: 'Returns real-time SQL aggregated operational counters, p95 verify latency, extraction cache hit rates, degradation telemetry, and constraint firing frequency breakdown.',
        operationId: 'getConsoleMetrics',
        responses: {
          '200': {
            description: 'Operational telemetry metrics.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    chain_length: { type: 'integer', example: 105 },
                    p95_latency_ms: { type: 'number', example: 185 },
                    cache_hit_rate: { type: 'number', example: 0.825 },
                    degradation_rate: { type: 'number', example: 0.0 },
                    decision_mix: {
                      type: 'object',
                      properties: {
                        pass: { type: 'integer', example: 32 },
                        step_up: { type: 'integer', example: 18 },
                        decline: { type: 'integer', example: 8 },
                      },
                    },
                    checks_breakdown: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          constraint_kind: { type: 'string' },
                          total: { type: 'integer' },
                          failures: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/console/settings': {
      post: {
        tags: ['Merchant Console & Ops'],
        summary: 'Update Merchant Strictness Threshold',
        description: 'Updates the semantic strictness threshold (tau) between 0.50 (permissive) and 0.95 (high assurance) to modulate precision vs recall trade-off.',
        operationId: 'updateMerchantSettings',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['strictness'],
                properties: {
                  strictness: {
                    type: 'number',
                    minimum: 0.5,
                    maximum: 0.95,
                    example: 0.75,
                    description: 'The strictness threshold (0.50 to 0.95).',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Strictness setting saved successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    strictness: { type: 'number', example: 0.75 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/v1/keys': {
      get: {
        tags: ['Keys & System Health'],
        summary: 'Get Ed25519 Public Signing Key Information',
        description: 'Retrieves current active Ed25519 public key and key rotation status for independent cryptographic receipt validation.',
        operationId: 'getSigningKeys',
        security: [],
        responses: {
          '200': {
            description: 'Public signing key metadata.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    key_version: { type: 'string', example: 'v1' },
                    algorithm: { type: 'string', example: 'Ed25519' },
                    public_key_hex: { type: 'string', example: 'a90e38f192b49c0d291e0a2948f928e...' },
                    status: { type: 'string', example: 'active' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Keys & System Health'],
        summary: 'Service Health & Database Probe',
        description: 'Liveness and readiness check testing PostgreSQL database connectivity and API runtime health.',
        operationId: 'getHealth',
        security: [],
        responses: {
          '200': {
            description: 'System healthy and database connected.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    database: { type: 'string', example: 'connected' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1.0.0' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Database disconnected or service degraded.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'unhealthy' },
                    database: { type: 'string', example: 'disconnected' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API_KEY',
        description: 'Merchant API Key (e.g. `Bearer ck_live_...` or `Bearer ck_test_...`)',
      },
    },
    schemas: {
      VerifyRequest: {
        type: 'object',
        required: ['intent_text', 'cart'],
        properties: {
          intent_text: {
            type: 'string',
            description: 'Raw human buyer intent prompt in natural language.',
            example: 'Get me a lightweight waterproof running jacket for mountain rain under ₹10,000 in size M.',
          },
          cart: { $ref: '#/components/schemas/Cart' },
          agent_metadata: {
            type: 'object',
            description: 'Optional agent attribution metadata.',
            properties: {
              agent_id: { type: 'string', example: 'agent_runner_v1' },
              model_name: { type: 'string', example: 'gpt-4o' },
              session_id: { type: 'string', example: 'sess_18290a' },
            },
          },
        },
      },
      Cart: {
        type: 'object',
        required: ['currency', 'total_amount', 'lines'],
        properties: {
          currency: { type: 'string', example: 'INR', description: 'ISO 4217 Currency Code' },
          total_amount: { type: 'number', example: 8499, description: 'Total price in main currency units' },
          lines: {
            type: 'array',
            items: { $ref: '#/components/schemas/CartLine' },
          },
        },
      },
      CartLine: {
        type: 'object',
        required: ['item_id', 'title', 'unit_amount', 'quantity', 'category_path', 'brand', 'condition', 'refundable'],
        properties: {
          item_id: { type: 'string', example: 'prod_jacket_trail_01' },
          title: { type: 'string', example: 'Salomon Bonatti Pro Waterproof Jacket M' },
          unit_amount: { type: 'number', example: 8499 },
          quantity: { type: 'integer', example: 1 },
          category_path: {
            type: 'array',
            items: { type: 'string' },
            example: ['Apparel', 'Jackets', 'Rainwear'],
          },
          brand: { type: 'string', example: 'Salomon' },
          condition: { type: 'string', enum: ['new', 'refurbished', 'used'], example: 'new' },
          refundable: { type: 'boolean', example: true },
          description: {
            type: 'string',
            description: 'Free-form description (Untrusted Layer 1 prose).',
            example: 'Lightweight technical trail running shell with Pertex Shield 2.5L membrane.',
          },
        },
      },
      VerifyResponse: {
        type: 'object',
        required: ['decision', 'receipt_id', 'receipt', 'checks', 'latency_ms'],
        properties: {
          decision: {
            type: 'string',
            enum: ['pass', 'step_up', 'decline'],
            description: 'Final automated governance decision.',
            example: 'pass',
          },
          receipt_id: { type: 'string', example: 'rec_sample_pass_001' },
          failing_reason: {
            type: 'string',
            description: 'Explanation if the order was stepped up or declined.',
          },
          receipt: { $ref: '#/components/schemas/Receipt' },
          checks: {
            type: 'array',
            items: { $ref: '#/components/schemas/CheckResult' },
          },
          latency_ms: {
            type: 'object',
            properties: {
              extract: { type: 'number', example: 45 },
              deterministic: { type: 'number', example: 4 },
              semantic: { type: 'number', example: 120 },
              total: { type: 'number', example: 169 },
            },
          },
        },
      },
      Receipt: {
        type: 'object',
        required: [
          'receipt_id',
          'sequence_number',
          'request_id',
          'decision',
          'intent_text',
          'constraint_set',
          'cart',
          'checks',
          'strictness_used',
          'prev_hash',
          'hash',
          'signature',
          'signing_key_version',
          'issued_at',
        ],
        properties: {
          receipt_id: { type: 'string', example: 'rec_sample_pass_001' },
          sequence_number: { type: 'integer', example: 105 },
          request_id: { type: 'string', example: 'req_8f9301ba' },
          decision: { type: 'string', enum: ['pass', 'step_up', 'decline'], example: 'pass' },
          intent_text: { type: 'string', example: 'Get me a waterproof jacket under ₹10,000.' },
          constraint_set: { $ref: '#/components/schemas/ConstraintSet' },
          cart: { $ref: '#/components/schemas/Cart' },
          checks: {
            type: 'array',
            items: { $ref: '#/components/schemas/CheckResult' },
          },
          strictness_used: { type: 'number', example: 0.75 },
          prev_hash: { type: 'string', example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
          hash: { type: 'string', example: '4f92d83a19b010c283748291a02938102948e918239019283401928340192834' },
          signature: { type: 'string', example: '3a0981f...ed25519...91283' },
          signing_key_version: { type: 'string', example: 'v1' },
          issued_at: { type: 'string', format: 'date-time', example: '2026-08-24T00:15:00.000Z' },
        },
      },
      ConstraintSet: {
        type: 'object',
        required: ['constraints'],
        properties: {
          constraints: {
            type: 'array',
            items: { $ref: '#/components/schemas/Constraint' },
          },
        },
      },
      Constraint: {
        type: 'object',
        required: ['id', 'kind', 'hardness', 'source_span', 'value'],
        properties: {
          id: { type: 'string', example: 'c_price_max' },
          kind: {
            type: 'string',
            enum: ['price_max', 'quantity', 'category', 'delivery_by', 'brand_allow', 'condition_allow', 'refundable_required'],
            example: 'price_max',
          },
          hardness: { type: 'string', enum: ['hard', 'soft'], example: 'hard' },
          source_span: {
            type: 'object',
            properties: {
              start: { type: 'integer', example: 34 },
              end: { type: 'integer', example: 48 },
              text: { type: 'string', example: 'under ₹10,000' },
            },
          },
          value: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'money' },
              amount: { type: 'number', example: 10000 },
              currency: { type: 'string', example: 'INR' },
            },
          },
        },
      },
      CheckResult: {
        type: 'object',
        required: ['constraint_id', 'constraint_kind', 'layer', 'verdict', 'confidence', 'reason'],
        properties: {
          constraint_id: { type: 'string', example: 'c_price_max' },
          constraint_kind: { type: 'string', example: 'price_max' },
          layer: { type: 'string', enum: ['deterministic', 'semantic'], example: 'deterministic' },
          verdict: { type: 'string', enum: ['pass', 'fail'], example: 'pass' },
          confidence: { type: 'number', example: 1.0 },
          reason: { type: 'string', example: 'Cart total ₹8,499 does not exceed budget ceiling ₹10,000.' },
        },
      },
      PublicVerificationResult: {
        type: 'object',
        required: ['receipt_id', 'sequence_number', 'decision', 'integrity_valid', 'signature_valid', 'chain_valid', 'issued_at'],
        properties: {
          receipt_id: { type: 'string', example: 'rec_sample_pass_001' },
          sequence_number: { type: 'integer', example: 105 },
          decision: { type: 'string', enum: ['pass', 'step_up', 'decline'], example: 'pass' },
          integrity_valid: { type: 'boolean', example: true },
          signature_valid: { type: 'boolean', example: true },
          chain_valid: { type: 'boolean', example: true },
          hash: { type: 'string', example: '4f92d83a19b010c283748291a02938102948e918239019283401928340192834' },
          prev_hash: { type: 'string', example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
          signing_key_version: { type: 'string', example: 'v1' },
          issued_at: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'INVALID_CART_PAYLOAD' },
              message: { type: 'string', example: 'Cart lines cannot be empty.' },
            },
          },
        },
      },
    },
  },
};
