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

> [!NOTE]
> Every timestamp below is corroborated by a Git commit. Verify with:
> `git log --reverse --format='%ad  %s' --date=format:'%H:%M'`

---

## Log

### 11:00 — Project start

**Change:** Repository initialised; README, SRS and project plan committed before any code.
**Why:** Fix the leak-check contract and the JSON schemas up front so three tracks can build in
parallel without re-negotiating interfaces.
**Effect:** Baseline established.

---

### 11:50 — All six prompts drafted

**Change:** `V1_SINGLE_PROMPT`, `SOLVER_PROMPT`, `REPAIR_PROMPT`, `HINT_LADDER_PROMPT`,
`LEAK_CRITIQUE_PROMPT`, `DIAGNOSE_PROMPT` written in full with per-rule rationale.
**Technique:** zero-shot baseline, hidden CoT + structured output, few-shot + role, self-critique,
decomposition.
**Why:** Prompts are the deliverable in this hackathon, so they were specified before the code
that calls them.
**Effect:** Nine phase documents; each prompt carries a table justifying every line.

---

### 12:04 — Phase 0 adapter built

**Change:** `tutor/llm.py` with a single `complete()` entry point.
**Why:** So no other module imports a vendor SDK, and swapping providers is a one-file change.
**Effect:** Proved its worth within the hour — the provider changed twice afterwards and no
prompt or pipeline code had to change.

---

### 12:05 – 12:11 — Provider switch: Gemini → xAI Grok

**Change:** Google SDK replaced with the `openai` client against `https://api.x.ai/v1`.
**Why:** Team decision.
**Effect:** Adapter-only change. A follow-up at 12:11 corrected `LLM_MODEL` from `grok-4`, which
does not exist, to `grok-4.7` — caught by checking the published model list rather than assuming.

---

### 12:27 — Provider switch: Grok → OpenRouter

**Change:** Base URL `https://openrouter.ai/api/v1`, model `inclusionai/ling-3.1-flash`.
**Why:** Free tier — OpenRouter lists this model at $0/token for both prompt and completion.
**Effect:** Working. **`response_format` had to be removed**: the model rejects it with a 400,
*"does not support structured-outputs"*.

> [!WARNING]
> This is the single most important entry in the log. With no structured-output enforcement, the
> phrase *"return ONLY a JSON object"* in every prompt from Phase 2 onward became the **only**
> thing producing parseable output — backed by tolerant parsing and the Phase 2 repair retry.
> That wording is now load-bearing and must not be edited out.

---

### 12:30 — Reasoning disabled

**Change:** `extra_body={"reasoning": {"enabled": False}}`; empty or truncated replies now raise
rather than returning `""`.
**Why:** `ling-3.1-flash` is a reasoning model and thinking tokens count against `max_tokens`,
which was returning empty completions.
**Effect:** Replies became reliable. The step-by-step work we actually want is in the prompts, not
in hidden thinking — so nothing was lost.

---

### 12:30 – 12:33 — Phases 1–8 implemented

**Change:** `prompts.py`, `solver.py`, `hints.py`, `guard.py`, `diagnose.py`, `app.py`,
`eval/cases.json`, `eval/run_eval.py`, `tests/test_guard.py`.
**Effect:** 12 guard assertions pass without an API key — the answer-suppression guarantee is
deliberately independent of the model.

---

### 12:40 — Retry on transient failures

**Change:** `complete()` retries 429/5xx and empty replies up to 5 times with exponential backoff
and jitter.
**Why:** The first live pipeline run hit a 429 immediately — the free pool is shared and the
upstream provider rate-limits in bursts.
**Effect:** The same run completed on retry. Without this the demo would die on a transient error.

---

### 12:42 — `diagnose()` null-field fix

**Change:** `d.get(k) or ""` instead of `d.get(k, "")`.
**Why:** The model returns an explicit `null` for `targeted_hint` when the working is correct, and
`dict.get(k, default)` only substitutes when the key is *absent*, not when it is null.
**Effect:** Found by a live test on the correct-working case. Fixed before it reached the UI.

---

## Prompt Inventory

Every member must be able to explain every row.

| Prompt constant | File | Technique | Explained by |
|---|---|---|---|
| `V1_SINGLE_PROMPT` | `tutor/prompts.py` | Zero-shot baseline | |
| `V1_DIAGNOSE_PROMPT` | `tutor/prompts.py` | Zero-shot baseline for the stretch metric | |
| `SOLVER_PROMPT` | `tutor/prompts.py` | Hidden CoT + structured output | |
| `REPAIR_PROMPT` | `tutor/prompts.py` | Output repair | |
| `HINT_LADDER_PROMPT` | `tutor/prompts.py` | Few-shot + role | |
| `LEAK_CRITIQUE_PROMPT` | `tutor/prompts.py` | Self-critique | |
| `DIAGNOSE_PROMPT` | `tutor/prompts.py` | Decomposition + comparative reasoning | |

---

<div align="center">

[Back to README](../README.md) · [Phase Index](PHASES_INDEX.md) · [Evaluation](EVALUATION.md)

</div>
