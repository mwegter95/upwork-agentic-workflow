# Plan: grocapitus-investor-tools

## 1. Demo concept (chosen): D1 — Rental Cash Flow & Cap Rate Calculator (refined)

**Choice: D1**, refined to lead with a clean real-time results panel and a small
"deal verdict" layer that mirrors how an investor educator would frame outputs.

**Why it wins this client.** Grocapitus runs on investor *education*. D1 hits the
single most universal decision a new investor makes: "does this rental cash flow,
and is it a good deal?" It needs no prior knowledge of an advanced playbook (D2's
BRRRR) and no schedule-heavy table (D3's amortization), so it reads as instantly
useful to the broadest slice of their community. It is also the fastest concept to
get to genuine polish inside a 10-20 hr/week reality, which is itself the pitch:
brief prompt -> working, tasteful tool, fast. D2 and D3 are stronger niche flexes
but narrower and heavier; D1 is the cheapest concept that still clearly wins, and
its metrics (cap rate, cash-on-cash, monthly cash flow) are exactly the vocabulary
an education-first firm wants in front of investors.

## 2. Prototype vs full: FULL (lean full)

- **Decision: full.** It is a pure client-side calculator; none of the three
  fallback rules in CLAUDE.md trip (no risky backend, fits the caps, not a
  throwaway visual). The demo computes real numbers and reacts live.
- **Backend: NOT needed.** No mw-backend blueprint, no endpoints. All math is
  deterministic and runs in the browser. Frontend-only is cheaper and safer, and
  matches the client's "lightweight, client-side, AI-built web app" framing.
- **Form:** self-contained static app (single `index.html` + local `assets/`,
  vanilla JS, no bundler) built into
  `../michaelwegter.com/public/demos/grocapitus-investor-tools/`.

## 3. Hero feature (1) + supporting (2)

**Hero — Live investor-metrics engine.** As the user edits property inputs
(purchase price, down payment %, interest rate, rent, taxes, insurance, vacancy,
maintenance, management, HOA/other), the tool instantly recomputes and displays:
monthly cash flow, cap rate, cash-on-cash return, NOI, and total cash needed to
close. This maps to the client's #1 need: a genuinely useful, data-driven tool an
investor can act on. No submit button — every keystroke updates.

**Supporting 1 — Deal verdict + visual breakdown.** A color-coded verdict chip
(e.g. "cash-flow positive / thin / negative") using the site's palette, plus a
simple revenue-vs-expense bar/donut so the numbers are legible at a glance. This
is the "taste, not a toy" signal the brief asks for.

**Supporting 2 — Sensitivity slider.** One slider (rent OR interest rate) that
sweeps the key metric live so investors can see how a small change flips the deal.
Demonstrates interactive modeling without the weight of D2/D3.

## 4. Out of scope (deliberately NOT building)

- No backend, no auth, no database, no API calls, no mw-backend changes.
- No amortization schedule / month-by-month table (that is D3; not built).
- No BRRRR / refinance modeling (that is D2; not built).
- No tax-deduction or depreciation estimates (liability + scope creep).
- No saving/loading deals, no accounts, no localStorage persistence.
- No multi-property comparison view or portfolio rollup.
- No address lookup, MLS/Zillow integration, or real listing data.
- No PDF export / sharing.
- No charting library dependency if a hand-rolled CSS bar/donut suffices.
- No contact info anywhere in the demo or proposal (per Michael's note).

## 5. Requirement -> feature traceability (R1-R11)

| Req | Text (short) | Where addressed |
|-----|--------------|-----------------|
| R1  | Experience with vibe-coding tools | Proposal narrative + portfolio screenshots (Stage, Life Dashboard, Growyard, SSUT) prove a track record of AI-built apps; new demo itself was AI-built |
| R2  | Concept/prompt -> working prototype | **Demo** (the calculator is the proof) + deck "prompt-to-prototype" talking point |
| R3  | Lightweight functional apps under CEO direction | **Demo** is intentionally lightweight + cover letter on working under direction |
| R4  | All code written by AI tools | Cover letter + deck: explicit note the demo and portfolio apps were vibe-coded (no fabrication, just the workflow) |
| R5  | Iterate quickly, ship early | Cover letter narrative; portfolio breadth (multiple shipped apps) is the evidence |
| R6  | Document process so team can learn | Deck/one-pager: short "prompt log / process" section describing how the demo was built |
| R7  | Log hours via WebWork | Cover letter: explicit one-line confirmation (addressed in proposal narrative, not demoed) |
| R8  | Works independently, async comms | Cover letter (addressed in proposal narrative, not demoed) |
| R9  | Currently enrolled (preferred) | Cover letter: do NOT fabricate; reframe as self-directed/continuous-learning, addressed in narrative only |
| R10 | Curiosity about real estate investing | **Demo** (real investor metrics + verdict) is the strongest proof; reinforced in cover letter |
| R11 | Reliable internet / workspace (must) | Cover letter one-liner (addressed in proposal narrative, not demoed) |

**Demo covers:** R2, R3, R10 directly; supports R1, R4. **Portfolio screenshots
cover:** R1, R5. **Narrative-only:** R6, R7, R8, R9, R11.

## 6. Portfolio apps in the proposal + media sourcing

Four AI-built apps appear as proof of vibe-coding range (guidance for the
media-capture and proposal-writer phases):

- **Stage** — use existing site media (screenshots/video already on
  michaelwegter.com). No new capture.
- **Spotify Super User Tools (SSUT)** — use existing site media. No new capture.
- **Growyard** — Playwright capture needed (no existing media).
- **Life Dashboard** — Playwright capture needed (no existing media).

Capture phase: target 1-2 clean hero screenshots each for Growyard and Life
Dashboard, sized for deck/one-pager. Pull Stage + SSUT assets from the existing
site rather than re-capturing.

## 7. File budget (cap ~12)

Inside `../michaelwegter.com/public/demos/grocapitus-investor-tools/`:

1. `index.html` — markup + inputs + results panel
2. `assets/app.js` — calculation engine, live binding, sensitivity slider
3. `assets/styles.css` — design-token styling (mustard accent, dark surfaces)
4. (optional) `assets/calc.js` — pure metric functions split from UI if app.js grows

Plus registry/route wiring on the site (separate from the demo folder):

5. `../michaelwegter.com/src/data/workSamples.js` — add the entry
6. (verify only) `/work-samples/:slug` route + `AppFrame` reuse — no new file

Estimated touched files: ~5-6, well under the 12 cap.
