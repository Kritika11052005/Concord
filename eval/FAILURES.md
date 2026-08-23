# 📋 Evaluation Failure Analysis Log — Concord

<div align="center">

| **Suite Run** | **Total Evaluated** | **Interventions Caught** | **False Passes (Misses)** | **Success Rate** |
|:---:|:---:|:---:|:---:|:---:|
| `2026-08-23T15:01:11Z` | **60 Pairs** | **27 Caught** | **3 Misses** | 🟢 **95.0% Overall Accuracy** |

---

</div>

> [!NOTE]
> **Engineering Transparency Policy**:
> Concord ships with its benchmark misses documented openly. Rather than overfitting thresholds to artificially force a 100% score on the benchmark, known failure classes are cataloged here with actionable architectural hypotheses.

---

## 🔍 Documented Benchmark Misses

<div align="center">

| Pair ID | Class | Split | Observed Decision | Expected Decision | Root Cause Analysis & Remediation Plan |
|:---:|:---:|:---:|:---:|:---:|:---|
| `M1-004` | **M1** *(Category Drift)* | `dev` | 🟢 `pass` | 🟡 `step_up` / 🔴 `decline` | **Sub-type Synonym Ambiguity**: Cart contains membrane gaming keyboard when user requested mechanical. *Remediation*: Expand attribute extraction prompt with keyboard switch mechanism tokens. |
| `M3-004` | **M3** *(Quantity Drift)* | `held_out` | 🟢 `pass` | 🟡 `step_up` / 🔴 `decline` | **Singular Indefinite Article Drift**: User asked for *"a keyboard"* (implied qty 1), but agent carted qty 2 within total price cap. *Remediation*: Enhance linguistic scope parser for indefinite articles (*"a"*, *"an"*, *"one"*). |
| `M3-005` | **M3** *(Quantity Drift)* | `held_out` | 🟢 `pass` | 🟡 `step_up` / 🔴 `decline` | **Default Quantity Assumption**: User requested *"1 backpack"*, cart contained qty 2. Evaluator scoped check at `total` rather than `per_line`. *Remediation*: Default unmarked single-item intents to `per_line` scope. |

</div>

---

<div align="center">
  <sub>Concord Failure Log • Transparent Engineering Baseline</sub>
</div>
