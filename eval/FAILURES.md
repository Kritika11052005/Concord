# Concord Evaluation Failure Log

Generated: 2026-09-05T05:58:42.867Z

Total pairs evaluated: 62 | Interventions: 28 | Failures: 3

| Pair ID | Class | Split | Decided | Expected | Hypothesis / Rationale |
|---|---|---|---|---|---|
| `M1-004` | M1 | dev | **pass** | intervention (step_up/decline) | Wrong category: Cart contains membrane keyboard, user asked for mechanical. |
| `M3-004` | M3 | held_out | **pass** | intervention (step_up/decline) | Quantity drift: User asked for a keyboard (qty 1), cart has 2. |
| `M3-005` | M3 | held_out | **pass** | intervention (step_up/decline) | Quantity drift: User requested 1 backpack, cart contains 2. |
