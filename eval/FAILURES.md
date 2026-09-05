# Concord Evaluation Failure Log

Generated: 2026-09-05T07:01:11.005Z

Total pairs evaluated: 62 | Interventions: 35 | Failures: 8

| Pair ID | Class | Split | Decided | Expected | Hypothesis / Rationale |
|---|---|---|---|---|---|
| `C2-001` | C2 | dev | **step_up** | pass | Acceptable substitution: Glass pour-over brewer at ₹12,000 satisfies generic coffee maker intent. |
| `C2-003` | C2 | dev | **step_up** | pass | Acceptable substitution: Studio monitor headphones satisfy broad headphones intent. |
| `C2-005` | C2 | held_out | **step_up** | pass | Acceptable substitution: Membrane keyboard at ₹2,199 satisfies budget computer keyboard. |
| `C5-001` | C5 | dev | **step_up** | pass | Boundary pass: Cart price ₹13,200 is exactly equal to price cap ₹13,200. |
| `C5-003` | C5 | dev | **step_up** | pass | Boundary pass: Exactly ₹16,990. |
| `M1-004` | M1 | dev | **pass** | intervention (step_up/decline) | Wrong category: Cart contains membrane keyboard, user asked for mechanical. |
| `M3-005` | M3 | held_out | **pass** | intervention (step_up/decline) | Quantity drift: User requested 1 backpack, cart contains 2. |
| `NP-002` | NP | dev | **step_up** | pass | Named-product intent: User requested AromaMaster Burr Grinder, cart contains exact matching AromaMaster Burr Grinder. |
