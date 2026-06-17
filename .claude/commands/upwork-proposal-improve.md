---
description: Improve an existing proposal/demo run with new requirements — minimal, token-frugal incremental edits (versioned outputs)
argument-hint: "[run slug, then] your improvement ideas / new requirements"
---

# Upwork Proposal Engine — Improve Pass

You are the orchestrator for an INCREMENTAL improvement of an existing run. The
prior run already produced everything (plan, research, working demo, live backend,
proposal, deck). Your job is NOT to rebuild — it is to apply the user's new
requirements as the smallest set of changes, reusing all existing work.

First read `CLAUDE.md`, especially the **"Improve mode"** section — it is the
contract for this command.

## Input

`$ARGUMENTS` holds the improvement ideas / new requirements (and may begin with a
run slug). If empty, ask which run to improve and what to change, then stop.

## Locate the base run

1. Determine the `slug`: if `$ARGUMENTS` names one (or a run dir), use it; else
   use the most recent dir under `upwork-runs/` and state which you picked.
2. Confirm the run exists and read ONLY what you need: the relevant artifacts'
   `## handoff` blocks first, opening a full file only when a change requires it.
   Do not re-read the whole run.

## Decide the minimal blast radius

From the new requirements, pick the FEWEST phases that must change. Examples:

- Wording / framing / pricing in the proposal → `proposal-writer` only.
- Demo copy/styling tweak → `demo-builder` (small edit) → `deploy` → `deploy-test`.
- New/changed demo feature or data → `planner` (diff only) → `researcher` (only
  if a genuinely new fact is needed) → `demo-builder` → `deploy` → `deploy-test`
  → `proposal-writer` (only if the pitch changes).
- New backend behavior → `demo-builder` (edit the service + run it on the Surface
  via `scripts/surface_run.py` / `surface_register_service.py`) → `deploy` →
  `deploy-test`.

Skip every phase the change does not touch; log `skipped (unaffected)` for it.
Do not run the full pipeline.

## Run the chosen phases (incrementally, versioned)

For each phase you must run, dispatch its subagent with: the slug, the paths to
read, the NEW requirements, and the instruction to write a **versioned** output
(if `plan.md` exists, write the update as `plan2.md`; `deploy.out` → `deploy2.out`,
etc. — increment the highest existing version). Pass paths, never contents. Each
subagent must:

- Read the existing artifact + its `## handoff` block, then make the SMALLEST
  change that satisfies the new requirement — Edit files in place (never rewrite a
  whole file for a small change).
- Keep the live site + backend working: redeploy/retest only what changed.
- Be extremely token-frugal: no re-exploration, no restating context, no
  regenerating unchanged content. End with a short `## handoff` block describing
  only what changed.

## Close out

Append to `run.log`: `improve | <phases run> | <what changed>`. Return a 4–6 line
summary: what the new requirements were, which phases ran (and which were
skipped), the new versioned files, and the live URLs re-verified. Keep it terse.
