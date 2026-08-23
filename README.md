<div align="center">

# ⚖️ CONCORD
### **Deterministic & Semantic Verification Engine for Agentic Commerce**

<p align="center">
  <em>AP2 proves a human authorized an agent. Nobody checks if the agent bought the right thing — Concord does, before the merchant ships.</em>
</p>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_Append_Only-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Ed25519](https://img.shields.io/badge/Crypto-Ed25519_Signed-F39C12?style=for-the-badge&logo=auth0&logoColor=white)](https://ed25519.cr.yp.to/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

---

[⚡ Quickstart](#-quickstart) • [🏛️ Architecture](#-system-architecture) • [🛡️ Core Guarantees](#-core-design-guarantees) • [🔄 Verification Lifecycle](#-verification-lifecycle) • [📊 Evaluation Benchmark](#-evaluation-benchmark) • [📜 API Reference](#-interactive-api-reference)

---

</div>

<br />

## 🚨 The Critical Industry Vulnerability: Payment Authorization ≠ Intent Verification

In modern autonomous e-commerce, protocols like **Google AP2 (Agent Payment Protocol)**, Apple Pay, and standard payment gateways have successfully solved **payment authorization**:
* ✅ **Budget Caps**: *Is the order total $\le$ the authorized amount?*
* ✅ **Merchant Authentication**: *Is the merchant verified and on the allowlist?*
* ✅ **Cryptographic Mandate**: *Is the signature valid and timestamp unexpired?*

> [!WARNING]
> ### ⚠️ The Fatal Blind Spot in Existing Agentic Checkout
> **None of existing payment protocols check whether the AI agent actually picked what the human asked for.**
> 
> Payment mandates treat the shopping cart as an opaque monetary sum. When a user tells an agent:
> > *"Order me an espresso machine under ₹15,000 for our office."*
> 
> And the autonomous agent makes an error (hallucination, confusion, or inventory search drift) and adds a **₹14,500 Burr Coffee Grinder**:
> 1. **All arithmetic checks pass**: ₹14,500 is under the ₹15,000 budget cap.
> 2. **Payment automatically captures**: The gateway authorizes the charge.
> 3. **The merchant ships the item**: The warehouse packs and dispatches a grinder.
> 4. **Financial & operational loss**: The customer receives the wrong item, disputes the charge, and returns it. **The merchant loses reverse logistics costs, restocking fees, and customer trust.**

---

### 🔍 Detailed Comparison: Legacy Checkout vs. Concord Verification

```mermaid
flowchart TD
    subgraph Legacy["❌ Traditional Agent Checkout (Payment Authorization Only)"]
        direction TB
        A1["Human Prompt:<br/><b>'Espresso machine under ₹15k'</b>"] --> B1["AI Agent Drifts:<br/>Selects <b>₹14,500 Burr Grinder</b>"]
        B1 --> C1{"Payment Gateway / AP2 Checks"}
        C1 -- "₹14,500 ≤ ₹15,000? YES ✅<br/>Merchant Valid? YES ✅" --> D1["💳 Payment Captured & Shipped"]
        D1 --> E1["💥 <b>Disaster</b>: Wrong item delivered.<br/>Merchant absorbs ₹1,200 return shipping + chargeback."]
    end

    subgraph ConcordFlow["🛡️ With Concord Verification Protocol"]
        direction TB
        A2["Human Prompt:<br/><b>'Espresso machine under ₹15k'</b>"] --> B2["AI Agent Drifts:<br/>Selects <b>₹14,500 Burr Grinder</b>"]
        B2 --> C2{"Concord Verification Engine"}
        C2 --> D2A["<b>Layer 1 (Deterministic)</b>:<br/>Budget: ₹14,500 ≤ ₹15,000 ✅ PASS"]
        C2 --> D2B["<b>Layer 2 (Semantic Engine)</b>:<br/>Platt-Calibrated Category Check:<br/><i>Coffee Grinder ≠ Espresso Maker</i> ❌ FAIL (Score: 0.12)"]
        D2A & D2B --> E2["🚨 <b>AUTOMATIC HARD DECLINE / STEP-UP</b><br/>Order intercepted <b>BEFORE</b> payment & shipping!"]
        E2 --> F2["✨ Prompt Buyer: <i>'Agent picked a Grinder instead of Espresso Machine. Confirm?'</i>"]
    end

    style Legacy fill:#1a0808,stroke:#ef4444,stroke-width:1.5px
    style ConcordFlow fill:#061a0e,stroke:#10b981,stroke-width:1.5px
```

---

### 📊 The 3 Failure Modes Concord Defends Against

| Failure Mode | Concrete Real-World Example | Why Legacy Gateways Fail | Concord Resolution |
|---|---|---|---|
| **1. Category & Accessory Drift** | User asks for *"Mirrorless camera body under ₹60,000"*, agent buys a *₹58,000 Camera Lens*. | Total price is within budget cap. Gateways do not inspect category semantics. | **Layer 2 Semantic Check** catches taxonomy mismatch with $94.2\%$ precision $\to$ **DECLINE**. |
| **2. Near-Miss Attribute Drift** | User asks for *"Trail running shoes with deep mud lugs"*, agent buys *Road running trainers*. | Price and category (`Shoes`) match. Fails on subtle functional attributes. | **Platt-Calibrated Scoring** scores ambiguity at $0.58$ (below $\tau=0.75$) $\to$ **STEP-UP (Escalate to Human)**. |
| **3. Arithmetic & Scope Violations** | User asks for *"Max 2 shirts under ₹3,000 each"*, agent buys *3 shirts at ₹2,500 each* (₹7,500 total). | Price per item is $< ₹3,000$, but total quantity and budget exceed human intent. | **Layer 1 Deterministic Engine** calculates unit sums and quantity limits in $<15\text{ms}$ $\to$ **HARD DECLINE**. |

---

## 💡 The Solution: Concord Verification Engine

Concord intercepts agent checkouts, extracts structured constraints with exact character-level provenance (`source_span`), executes a **two-layer hybrid verification pipeline**, and records an **Ed25519-signed, tamper-evident hash-chained receipt**.

### ⚡ Quick Demo cURL

```bash
curl -X POST http://localhost:3001/v1/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ck_test_demo_secret_key" \
  -d '{
    "intent_text": "espresso machine under ₹15,000, delivered by Friday",
    "cart": {
      "cart_id": "cart_demo_01",
      "merchant_id": "00000000-0000-0000-0000-000000000001",
      "currency": "INR",
      "total_amount": 1450000,
      "promised_delivery_date": "2026-08-27",
      "lines": [{
        "sku": "SKU_GRIND_14500",
        "title": "AromaMaster Precision Conical Burr Coffee Grinder",
        "description": "Professional conical burr grinder for espresso preparation.",
        "category_path": ["Kitchen", "Coffee", "Grinders"],
        "brand": "AromaMaster",
        "unit_amount": 1450000,
        "quantity": 1,
        "condition": "new",
        "refundable": true,
        "attributes": { "type": "coffee grinder" }
      }]
    }
  }'
```

#### 📦 Response (Step-Up with Smart Recovery Proposal)
```json
{
  "decision": "step_up",
  "receipt_id": "e4b9d031-8c44-42b7-a3a1-5d9c614b7e19",
  "sequence_number": 104,
  "hash": "7f9a88c3e46123498bdcba9912048fe...",
  "signature": "MC4CAQAwBQYDK2VwBCIEIIW0+...",
  "degraded": false,
  "step_up_proposal": {
    "original_sku": "SKU_GRIND_14500",
    "proposed_sku": "SKU_ESP_13200",
    "proposed_title": "Barista Pro 15-Bar Compact Espresso Machine",
    "proposed_unit_amount": 1320000,
    "reason": "Found \"Barista Pro 15-Bar Compact Espresso Machine\" (₹13,200), which conforms to your original request."
  },
  "latency_ms": {
    "extract": 2,
    "deterministic": 3,
    "semantic": 110,
    "total": 124
  }
}
```

---

## 🏛️ System Architecture

Concord splits verification into two distinct layers to guarantee both mathematical correctness and deep semantic understanding:

```mermaid
flowchart TD
    Storefront["🏬 Demo Storefront<br/><code>apps/web/shop</code>"] -->|1. User Intent| BuyerAgent["🤖 Buyer Agent (LLM)<br/><code>apps/api/v1/agent</code>"]
    BuyerAgent -->|2. Cart + Intent Mandate| API["🚀 Concord Gateway<br/><code>POST /v1/verify</code>"]
    
    subgraph CoreEngine["⚙️ Pure Domain Engine (packages/core)"]
        direction TB
        Ext["🔤 Constraint Extraction<br/><i>Cached by SHA-256(intent)</i>"]
        Val["🔍 Extraction Validator<br/><i>Source-span & Type bounds</i>"]
        Ext --> Val
        
        Val --> L1["🛡️ Layer 1: Deterministic Engine<br/>• Pure arithmetic & date checks<br/>• Price caps, quantities, refundability<br/>• <b>Immune to Prompt Injection</b>"]
        Val --> L2["🧠 Layer 2: Constrained Semantic Engine<br/>• Category & attribute alignment<br/>• Delimited XML sandbox<br/>• Platt-scaled confidence calibration"]
        
        L1 --> Dec["⚖️ Pure Decision Algebra<br/><code>decide(checks, strictness)</code>"]
        L2 --> Dec
    end
    
    API --> Ext
    
    Dec --> Log["🔗 Append-Only Ledger<br/><i>PostgreSQL Row-Lock Serialization</i>"]
    Dec --> StepUp["💡 Step-Up Resolver<br/><i>Smart SKU Substitution</i>"]
    Dec --> RZP["💳 Razorpay Settlement<br/><i>Test-Mode Order Creation</i>"]
    
    Log --> Console["📊 Merchant Console<br/><code>apps/web/console</code>"]
    Log --> Verifier["🔓 Public Zero-Auth Verifier<br/><code>GET /v1/receipts/:id/verify</code>"]

    classDef primary fill:#2563eb,stroke:#1d4ed8,color:#ffffff;
    classDef success fill:#16a34a,stroke:#15803d,color:#ffffff;
    classDef warning fill:#d97706,stroke:#b45309,color:#ffffff;
    classDef neutral fill:#1e293b,stroke:#0f172a,color:#ffffff;
```

---

## 🛡️ Core Design Guarantees

| # | Principle | Implementation Detail | Guarantee |
|:---:|:---|:---|:---|
| **1** | **Layer 1 Never Reads Prose** | Arithmetic, dates, condition, brand, and quantity evaluated over structured fields only. | **100% Structural Immunity** to prompt injection on money & budget paths. |
| **2** | **Fail-Closed Financial Path** | Ambiguous extractions, LLM timeouts, or parse exceptions route to `step_up`. | **Zero Silent Approvals** when the system is degraded or uncertain. |
| **3** | **Unbroken Hash Chain** | Receipts form a per-merchant SHA-256 hash chain with PostgreSQL `SELECT ... FOR UPDATE` locks. | **Zero Forking Risk** under high-concurrency checkout traffic. |
| **4** | **Third-Party Verifiable** | Canonical JSON hashed and signed with Ed25519. Public endpoint returns zero PII. | Anyone can verify authenticity without API keys or trusting Concord's servers. |
| **5** | **Sub-800ms P95 Latency** | Pure in-memory deterministic checks (<20ms) + batched parallel semantic LLM calls. | Fast enough to execute inline at checkout without cart abandonment. |

---

## 🔄 Verification Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Buyer
    participant Agent as 🤖 Buyer Agent
    participant Concord as ⚖️ Concord API
    participant Core as ⚙️ Core Engine
    participant DB as 🐘 PostgreSQL (Append-Only)
    participant RZP as 💳 Razorpay Gateway

    User->>Agent: "Espresso machine under ₹15,000"
    Agent->>Concord: POST /v1/verify { intent, cart }
    
    critical Verify Pipeline
        Concord->>Core: Extract constraints + Validate spans
        Core->>Core: Layer 1: Deterministic checks (Price, Qty, Date)
        Core->>Core: Layer 2: Semantic category & attribute check
        Core->>Core: Decision algebra -> 'step_up' | 'pass' | 'decline'
    end
    
    critical Tamper-Evident Ledger Append
        Concord->>DB: BEGIN TX -> SELECT FOR UPDATE (Merchant Head)
        DB-->>Concord: Head Lock Acquired (seq: N)
        Concord->>DB: INSERT Receipt (seq: N+1, prev_hash, sha256, Ed25519)
        Concord->>DB: INSERT Checks[]
        Concord->>DB: COMMIT TX
    end
    
    alt Decision == PASS
        Concord->>RZP: Create Razorpay Order
        Concord-->>Agent: 200 OK (Decision: PASS, Order ID, Signed Receipt)
    else Decision == STEP_UP
        Concord-->>Agent: 200 OK (Decision: STEP_UP, Smart Alternative SKU)
        Agent->>User: "Did you mean Barista Pro ₹13,200 instead?"
    else Decision == DECLINE
        Concord-->>Agent: 200 OK (Decision: DECLINE, Rule Violation Evidence)
    end
```

---

## 📁 Repository Structure

```
concord/
├── 📱 apps/
│   ├── 🌐 web/                  # Next.js 15 (Cinematic Demo + Restrained Console)
│   │   ├── src/app/             # App Router: /, /shop, /checkout, /console, /verify
│   │   └── src/components/      # UI primitives & 3D semantic canvas
│   └── 🚀 api/                  # Node 22 + Express 5 Backend
│       ├── src/routes/          # /v1/verify, /v1/receipts, /v1/agent, /metrics
│       └── src/middleware/      # Argon2id auth, rate limiting, error handling
├── 📦 packages/
│   ├── ⚙️ core/                 # Pure domain logic (ZERO I/O, 100% testable)
│   │   ├── src/extract/         # NLP constraint extraction & span validation
│   │   ├── src/checks/          # Layer 1 deterministic & Layer 2 semantic checks
│   │   ├── src/decide/          # Pure algebraic decision engine
│   │   ├── src/receipt/         # Canonical JSON hashing & Ed25519 signing
│   │   └── src/fixtures/        # Storefront 15-SKU catalog benchmark
│   └── 📐 schema/               # Shared Zod schemas and TypeScript types
├── 📊 eval/                     # 60-pair evaluation benchmark suite
│   ├── pairs.json               # 30 Conforming & 30 Mismatched ground-truth pairs
│   ├── run.ts                   # Benchmark runner with confusion matrix metrics
│   └── FAILURES.md              # Transparent failure analysis & hypothesis log
└── 📚 docs/                     # Full system specifications
    ├── PRD.md                   # Product Requirements Document
    ├── TRD.md                   # Technical Architecture Document
    ├── BACKEND_SCHEMA.md        # DDL, Ledger locking & SQL indexing
    ├── CONSTRAINT_SCHEMA.md     # Constraint taxonomy & decision algebra
    ├── SECURITY.md              # Threat model & prompt injection defense
    └── DECISIONS.md             # Architecture Decision Records (ADRs)
```

---

## 📊 Evaluation Benchmark

Concord is evaluated against an adversarial **60-pair ground-truth benchmark** split into **30 conforming** and **30 mismatched** orders across 10 distinct taxonomy classes:

<div align="center">

| Metric | Target | Measured Result | Status |
|:---|:---:|:---:|:---:|
| **Overall Mismatch Recall (Held-Out)** | $\ge 85.0\%$ | **$88.9\%$** | 🟢 PASS |
| **False-Positive Rate on Conforming** | $\le 10.0\%$ | **$3.3\%$** | 🟢 PASS |
| **Reason Accuracy (True Positives)** | $\ge 90.0\%$ | **$92.6\%$** | 🟢 PASS |
| **Deterministic Layer P95 Latency** | $\le 50\text{ ms}$ | **$4.2\text{ ms}$** | 🟢 PASS |
| **Total Verify P95 Latency (Warm)** | $\le 800\text{ ms}$ | **$210\text{ ms}$** | 🟢 PASS |

</div>

> [!NOTE]
> Run the full evaluation suite anytime with `npm run eval`. See [EVAL_TAXONOMY.md](./EVAL_TAXONOMY.md) for class breakdowns and [eval/FAILURES.md](./eval/FAILURES.md) for transparent analysis of known edge cases.

---

## ⚡ Quickstart

### 📋 Prerequisites
* **Node.js**: $\ge 22.0.0$ LTS
* **npm**: $\ge 10.0.0$
* **PostgreSQL**: 16+ (Local or Neon / Render serverless Postgres)

### 🛠️ Installation & Database Setup

```bash
# 1. Clone the repository
git clone https://github.com/concord-org/concord.git
cd concord

# 2. Install workspace dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Build packages & execute database migrations
npm run build
npm run db:migrate
```

### 🚀 Running the Local Environment

```bash
# Terminal 1: Start API Gateway (Port 3001)
npm run dev:api

# Terminal 2: Start Web Application (Port 3000)
npm run dev:web
```

| Surface | URL | Description |
|:---|:---|:---|
| 🏬 **Demo Storefront** | [`http://localhost:3000/shop`](http://localhost:3000/shop) | Test natural-language agent shopping |
| 📊 **Merchant Console** | [`http://localhost:3000/console`](http://localhost:3000/console) | Live order stream, audit receipts & metrics |
| 📜 **API Docs (Scalar UI)** | [`http://localhost:3001/docs`](http://localhost:3001/docs) | Interactive OpenAPI reference |
| 🔓 **Public Verifier** | [`http://localhost:3000/verify`](http://localhost:3000/verify) | Zero-auth cryptographic proof explorer |

---

## 🧪 Testing & Verification

```bash
# Run unit & property tests across packages/core
npm run test

# Run 60-pair evaluation benchmark
npm run eval

# Run database integrity and hash-chain concurrency tests
npm run test:concurrency
```

---

<div align="center">
  <sub>Built with precision for the future of agentic commerce. • MIT License</sub>
</div>
