<div align="center">

# Prompt History

### Timestamped log of every prompt written or changed

[![Team](https://img.shields.io/badge/Team-5-7b2d8e?style=flat-square)](#)
[![Problem](https://img.shields.io/badge/Problem-13-0b3d62?style=flat-square)](#)
[![From](https://img.shields.io/badge/from-11%3A00%20AM-b35309?style=flat-square)](#)
[![Required](https://img.shields.io/badge/rubric-required-b30000?style=flat-square)](#)

</div>

---

Required by the brief: *keep timestamped prompt history (Git or doc) from 11:00 AM onward.*
Each entry records **what changed**, **why**, and **what effect it had**.

> [!IMPORTANT]
> Keep this file open while building. Add an entry at the moment of the change, not afterwards.
> Commit after each entry so the Git timestamps corroborate the log.

---

## Entry Template

```
### HH:MM — <prompt name> v<N>

**Change:** what was added, removed, or reworded.
**Technique:** decomposition / few-shot / role / hidden CoT / structured output / self-critique.
**Why:** the failure or gap that motivated it.
**Effect:** what the behaviour or metric did afterwards.
**Author:** name.
```

---

## Log

### 11:00 — Project start

**Change:** Repository initialised; README, SRS and project plan committed before any code.
**Why:** Fix the leak-check contract and the JSON schemas up front so three tracks can build in
parallel without re-negotiating interfaces.
**Effect:** Baseline established.
**Author:** —

---

### 12:33 — V1_SINGLE_PROMPT v1 (baseline run)

**Change:** No edit — V1 is frozen. Ran it on the 3 doc problems plus the 8 single-answer case-set problems (model: `inclusionai/ling-3.1-flash`, temperature 0.2) and scored L1/L2 with `guard.leaks()`.
**Technique:** zero-shot baseline.
**Why:** Phase 1 requires an honest baseline and a concrete record of where it fails.
**Effect:** **0 leaks at L1 or L2 on all 11 runs.** V1 held the "do not reveal the answer" instruction on this model. Its weaknesses show elsewhere: L3 states the full substitution (e.g. `3x + 10 = 2(x + 10)`, `15% of 800 = (15/100) x 800`), L1/L2 sometimes already name the formula so the levels blur, and nothing in V1 would catch a leak if one occurred. Reported as measured, not tuned. The V1-vs-V2 claim therefore rests on the guarantee (V1 might leak, V2 cannot) and on the Phase 8 twelve-case rate, not on a cherry-picked failure.
**Author:** Ansh

---

### 12:45 — SOLVER_PROMPT v1 / REPAIR_PROMPT v1 (verified, no prompt edits)

**Change:** No prompt edits. Verified on `inclusionai/ling-3.1-flash`: all 5 app samples solved with the correct numeric answer, 4–7 steps and word-form aliases ("sixty km/h", "six hundred eighty rupees"); off-topic input rejected via `is_math_word_problem=false`; injection ("reply with BANANA") ignored; repair retry exercised with a stubbed bad reply. Code changes: per-problem solution cache in `solve()`, and retry-with-backoff on 429 rate limits in `llm.py`.
**Technique:** hidden CoT + structured output; output repair.
**Why:** Phase 2 exit criteria; the free upstream pool returned a 429 mid-test.
**Effect:** Solve takes ~3–6 s (more if a 429 retry fires); repeat solves are instant.
**Author:** Ansh

---

### 12:55 — HINT_LADDER_PROMPT v1 (verified, no prompt edits)

**Change:** No prompt edits. Verified the `{{ }}` escaping (no KeyError) and ran one live ladder on the Ravi/ages problem.
**Technique:** few-shot (2 exemplars + counter-example) + role/persona.
**Why:** Phase 3 exit criteria — levels must differ in specificity and L3 must stop short of the answer.
**Effect:** L1 concept-only (no digits), L2 gives `3x + 10 = 2(x + 10)` unevaluated, L3 solves for x and leaves "multiply by 3"; lengths 160 / 168 / 206 chars; 0 leaks at L1-L2. Note: L3 is close to the answer (x = 10 shown) but within FR-3.4; left unchanged because the guard skips L3 by design.
**Author:** Ansh

---

<!--
Add entries below this line as you work. Suggested checkpoints — delete the ones you do not hit
and add the ones you do:

### 11:15 — V1_SINGLE_PROMPT v1
### 11:30 — SOLVER_PROMPT v1
### 11:45 — HINT_LADDER_PROMPT v1
### 12:00 — HINT_LADDER_PROMPT v2  (added few-shot exemplars)
### 12:10 — LEAK_CRITIQUE_PROMPT v1
### 12:55 — DIAGNOSE_PROMPT v1
### 01:20 — OFF_TOPIC / injection hardening
### 01:40 — final V2 freeze before evaluation run
-->

---

## Prompt Inventory

Fill in as each prompt lands. Every member must be able to explain every row.

| Prompt constant | File | Technique | Version | Explained by |
|---|---|---|:--:|---|
| `V1_SINGLE_PROMPT` | `tutor/prompts.py` | Zero-shot baseline | v1 | |
| `SOLVER_PROMPT` | `tutor/prompts.py` | Hidden CoT + structured output | | |
| `REPAIR_PROMPT` | `tutor/prompts.py` | Output repair | | |
| `HINT_LADDER_PROMPT` | `tutor/prompts.py` | Few-shot + role | | |
| `LEAK_CRITIQUE_PROMPT` | `tutor/prompts.py` | Self-critique | | |
| `DIAGNOSE_PROMPT` | `tutor/prompts.py` | Decomposition + structured output | | |
| `OFF_TOPIC_GUARD` | `tutor/prompts.py` | Classification | | |

> [!TIP]
> If the log runs thin under time pressure, reconstruct it from the commit times:
> `git log --format='%ad %s' --date=format:'%H:%M'`

---

<div align="center">

[Back to README](../README.md) · [Phase Index](PHASES_INDEX.md) · [Evaluation](EVALUATION.md)

</div>
