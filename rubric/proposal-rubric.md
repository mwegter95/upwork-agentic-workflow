# Proposal rubric

The evaluator scores every run against this. Hard gates are pass/fail and any
single failure blocks the run (the orchestrator re-runs the owning phase, capped
at 2 retries). Soft scores are 1 to 5; the package should average >= 4 with
nothing below 3.

## Hard gates (pass/fail)

| # | Gate | How to check | Owning phase if it fails |
|---|------|--------------|--------------------------|
| H1 | **Requirement coverage** | Every `must` requirement in `brief.json` maps to a place it is satisfied in the cover letter AND in the demo or deck. | proposal-writer (coverage) or demo-builder (missing feature) |
| H2 | **Demo builds + loads** | `build-report.md` shows `npm run build` passed and the demo served 200 with no first-paint console errors. | demo-builder |
| H3 | **Demo URL resolves** | `node scripts/link-check.mjs <url>` on the local preview (pre-deploy) or live `/work-samples/<slug>` (post-deploy) returns 200-399. | demo-builder / deploy |
| H4 | **Demo link present** | The demo link appears in both `cover-letter.md` and the deck. | proposal-writer |
| H5 | **No em/en dashes** | `grep -nP "[\x{2013}\x{2014}]"` finds nothing in `cover-letter.md` or `one-pager.html`. | proposal-writer |
| H6 | **On-brand** | One-pager uses the design tokens (dark palette + Space Grotesk / Inter / JetBrains Mono), not default styling. | proposal-writer |

## Soft scores (1 to 5)

| Dimension | 5 looks like |
|-----------|--------------|
| **Cover letter specificity** | Names their problem and context, references the real demo, zero generic filler or buzzwords. |
| **Conciseness** | Skimmable, short, respects the client's time. The demo carries the persuasion. |
| **Demo quality** | The hero feature actually impresses for THIS client and clearly maps to their #1 need. |
| **Deck polish** | On-brand, clean, the live demo is front and center. |
| **Persuasiveness** | If you were the client, you would click the demo and shortlist Michael. |

## Scoring output

The evaluator writes `eval-report.md`: a hard-gate table with evidence, the soft
scores with one-line justifications, and a prioritized **fix list** where each
item names the single phase to re-run and the exact change. Empty fix list ==
ready to deploy.

## Notes for the judge
- Be concrete in the fix list. "Cover letter is generic" is useless; "R3
  (offline sync) is never addressed in the cover letter; proposal-writer should
  add a sentence tying it to the demo's local-storage queue" is actionable.
- Prefer re-running one phase over re-running many. Identify the true root cause.
- Do not rewrite artifacts yourself. You judge; the owning phase fixes.
