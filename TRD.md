# 🛠️ Technical Requirements Document (TRD) — Concord

<div align="center">

| **Specification** | **Version** | **Target Architecture** | **Companion Spec** |
|:---:|:---:|:---:|:---:|
| `TRD-CONCORD` | `v1.0.0` | Node 22 ESM Monorepo + PostgreSQL 16 | [PRD.md](./PRD.md) |

---

</div>

## 🏗️ 1. Monorepo Architecture

Concord is structured as an npm workspaces monorepo separating pure computational domain logic from I/O boundaries and presentation layers:

```mermaid
graph TD
    subgraph Web["📱 apps/web (Next.js 15 App Router)"]
        Landing["/ • Cinematic Landing & 3D Visualizer"]
        Shop["/shop • Demo Storefront (15 SKUs)"]
        Console["/console • Merchant Ops Dashboard"]
        VerifyUI["/verify/:id • Public Cryptographic Verifier"]
    end

    subgraph API["🚀 apps/api (Express 5 + Node 22 LTS)"]
        VRoute["/v1/verify • Verification Gateway"]
        RRoute["/v1/receipts • Append-Only Ledger Read"]
        ARoute["/v1/agent • Demo Buyer Agent Runner"]
        DocRoute["/docs • Scalar OpenAPI Spec UI"]
    end

    subgraph Packages["📦 packages/"]
        Core["⚙️ packages/core<br/>• Pure Domain Logic (Zero I/O)<br/>• Constraint Extraction & Checks<br/>• Pure Decision Engine<br/>• Ed25519 Canonical Signer"]
        Schema["📐 packages/schema<br/>• Shared Zod Schemas<br/>• Generated TypeScript Types"]
    end

    subgraph Data["🐘 Persistence Layer"]
        Postgres[("PostgreSQL 16<br/>• Row-Lock Hash Chaining<br/>• Append-Only Receipts & Checks<br/>• Drizzle ORM")]
    end

    Web -->|HTTP / JSON| API
    API --> Schema
    API --> Core
    API --> Postgres
    Core --> Schema

    classDef webStyle fill:#2563eb,stroke:#1d4ed8,color:#ffffff;
    classDef apiStyle fill:#059669,stroke:#047857,color:#ffffff;
    classDef coreStyle fill:#7c3aed,stroke:#6d28d9,color:#ffffff;
    classDef dbStyle fill:#d97706,stroke:#b45309,color:#ffffff;

    class Web webStyle;
    class API apiStyle;
    class Core,Schema coreStyle;
    class Postgres dbStyle;
```

> [!IMPORTANT]
> **The Pure Core Rule**: `packages/core` contains **zero I/O, zero database drivers, zero network imports, and zero framework bindings**. Everything in it is a pure function. All external effects (LLMs, payment gateways, clocks, cryptography keys) are passed via injected dependency interfaces.

---

## 💻 2. Technology Stack Matrix

<div align="center">

| Domain | Technology | Version | Rationale & Responsibility |
|:---|:---|:---:|:---|
| **Runtime** | `Node.js` | `22.x LTS` | Native ESM support, high-performance `fetch`, stable crypto APIs |
| **Language** | `TypeScript` | `5.6+` | Strict type safety (`strict: true`), end-to-end schema synchronization |
| **Monorepo** | `npm workspaces` | `10.x` | Zero overhead dependency orchestration and local package linking |
| **Backend API** | `Express` | `5.0+` | Minimalist HTTP routing, predictable middleware lifecycle, low overhead |
| **ORM / Query** | `Drizzle ORM` | `0.33+` | Thin, zero-overhead type-safe SQL queries with automated Drizzle Kit migrations |
| **Database** | `PostgreSQL` | `16+` | Strict transactional guarantees (`SELECT FOR UPDATE`), JSONB document storage |
| **Validation** | `Zod` | `3.23+` | Boundary validation for requests, responses, and LLM structured outputs |
| **API Docs** | `Scalar` + `zod-to-openapi` | Latest | Single source of truth OpenAPI generation directly from Zod schemas |
| **Frontend** | `Next.js` | `15.x` | Modern App Router, server-rendered dashboards, streaming responses |
| **Styling** | `Tailwind CSS` | `v4.0` | High-performance CSS engine with custom utility design tokens |
| **3D & Visuals** | `Three.js` + `R3F` / `GSAP` | Latest | Hardware-accelerated semantic visualizer for hash chain verification |
| **Testing** | `Vitest` | `2.x` | Sub-second unit testing for `core`, isolated integration tests with DB |

</div>

---

## ⚡ 3. End-to-End Request Lifecycle

The diagram below traces the execution lifecycle of a single `POST /v1/verify` call:

```mermaid
sequenceDiagram
    autonumber
    participant Client as 🤖 Buyer Agent
    participant Gateway as 🚪 Express Gateway
    participant Auth as 🔐 Auth & Rate Limiter
    participant Extractor as 🔤 NLP Extractor (Core)
    participant L1 as 🛡️ Layer 1: Deterministic (Core)
    participant L2 as 🧠 Layer 2: Semantic (Core)
    participant Decide as ⚖️ Decision Engine (Core)
    participant Ledger as 🐘 Postgres Append TX

    Client->>Gateway: POST /v1/verify { intent_text, cart }
    Gateway->>Auth: Verify API Key (Argon2id) & Rate Limits
    Auth-->>Gateway: Key Validated (Merchant ID)
    
    Gateway->>Extractor: extract(intent_text)
    alt Cache Hit (SHA-256)
        Extractor-->>Gateway: Return Cached ConstraintSet
    else Cache Miss
        Extractor->>Extractor: Constrained LLM Call + Zod Parse
        Extractor->>Extractor: Validate source_spans against raw text
        Extractor-->>Gateway: Return ConstraintSet
    end

    par Parallel Evaluation
        Gateway->>L1: evaluateDeterministic(cart, constraints)
        L1-->>Gateway: CheckResult[] (Price, Qty, Date, Brand, Refund)
    and
        Gateway->>L2: evaluateSemantic(cart.lines, intent, residue)
        L2-->>Gateway: CheckResult[] (Category & Attributes + Platt Calibration)
    end

    Gateway->>Decide: decide(allChecks, strictnessThreshold)
    Decide-->>Gateway: Decision: 'pass' | 'step_up' | 'decline'

    Gateway->>Ledger: BEGIN TRANSACTION
    Ledger->>Ledger: SELECT * FROM merchants WHERE id = $1 FOR UPDATE
    Ledger->>Ledger: Compute canonical SHA-256 hash & Ed25519 signature
    Ledger->>Ledger: INSERT INTO receipts & INSERT INTO checks[]
    Ledger->>Ledger: UPDATE merchants SET chain_head_id = $id, chain_length += 1
    Ledger->>Gateway: COMMIT TRANSACTION

    Gateway-->>Client: 200 OK { decision, receipt_id, sequence_number, hash, signature, step_up_proposal }
```

---

## 🎨 4. The Two Visual Registers

To balance cinematic product presentation with institutional operations reliability, the frontend architecture implements **two distinct design registers**:

```mermaid
flowchart LR
    subgraph Cinematic["🎬 Cinematic Surfaces (/ & /shop)"]
        direction TB
        C1["• Dynamic 3D canvas (Three.js / R3F)"]
        C2["• Scroll-driven GSAP sequences"]
        C3["• Rich gradients & fluid micro-animations"]
        C4["• Interactive live shopping agent terminal"]
    end

    subgraph Restrained["💼 Restrained Surfaces (/console & /verify)"]
        direction TB
        R1["• High-density operational data tables"]
        R2["• Monospace formatting for hashes & amounts"]
        R3["• Zero decorative 3D or scroll animations"]
        R4["• Sub-100ms instant view transitions"]
    end

    style Cinematic fill:#1e1b4b,stroke:#6366f1,color:#ffffff
    style Restrained fill:#18181b,stroke:#52525b,color:#ffffff
```

> [!TIP]
> **Accessibility & Performance Constraints**:
> * Full support for `prefers-reduced-motion`: all 3D and GSAP animations gracefully collapse to high-contrast static SVGs.
> * WebGL fallback: systems lacking GPU acceleration render clean structural diagrams without layout shifts.
> * Console payload budget: the `/console` bundle excludes Three.js and GSAP entirely for lightning-fast operational loads.

---

## 🔒 5. Core Engineering Principles

```mermaid
mindmap
  root((Concord Core Rules))
    Pure Domain
      Zero IO in core
      100 percent branch coverage
      Mock-free unit testing
    Fail-Closed
      LLM timeout to step_up
      Parse failure to step_up
      Never pass on ambiguity
    Hash Chaining
      Postgres row locks
      Unique seq constraints
      Zero fork guarantee
    Security First
      Layer 1 ignores prose
      Delimited XML sandbox
      Argon2id key hashing
```

* **1. Modularity**: `packages/core` exports pure functions only. External services enter through dependency injection.
* **2. Deterministic Arithmetic**: Prices, dates, and quantities are never trusted to probabilistic models.
* **3. Append-Only Ledger**: Database grants strictly forbid `UPDATE` or `DELETE` on receipts and checks.
* **4. Reproducible Evaluation**: Prompt changes automatically bump `PROMPT_VERSION` and invalidate extraction cache.

---

<div align="center">
  <sub>Concord Technical Specification • Node 22 & TypeScript 5.6</sub>
</div>