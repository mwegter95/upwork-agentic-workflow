# Build report: grocapitus-investor-tools

## What was built
A self-contained, vanilla-JS rental property investor calculator. The hero is a
live metrics engine (no submit button): every keystroke recomputes NOI, cap
rate, cash-on-cash, monthly cash flow, and total cash to close. Supporting
features: a color-coded deal-verdict chip with a hand-rolled CSS revenue-vs-
expense bar, and one rent sensitivity slider that sweeps monthly cash flow live.

## Files created / edited
- `public/demos/grocapitus-investor-tools/assets/app.js` — CREATED, ~315 lines.
  Calculation engine (formulas verbatim from research.md), live input binding,
  verdict heuristics, breakdown bar, 1%/50% rule hints, sensitivity slider +
  break-even rent hint. Guards divide-by-zero (purchase_price=0, r==0 branch),
  uses Math.pow.
- `public/demos/grocapitus-investor-tools/index.html` — EDITED, 1 line. Disclaimer
  changed to the exact required phrase "Educational tool only. Not investment
  advice." (kept existing structure; all input IDs already aligned with app.js).
- `public/demos/grocapitus-investor-tools/assets/styles.css` — unchanged (pre-existing,
  ~398 lines; all class/id hooks matched).
- `src/data/workSamples.js` — EDITED. Added id:2 entry, slug
  `grocapitus-investor-tools`, category "Data", color #12b4c8, icon 🏠,
  frameStyle baroque, client "Grocapitus Investments", date 2026-06-11.

Total touched: 3 demo files (1 new, 1 edited) + 1 registry file = under the cap.

## Local preview
- `cd michaelwegter.com/public && python3 -m http.server 8231`
- URL: http://localhost:8231/demos/grocapitus-investor-tools/
- All three files returned HTTP 200.

## Build status
`npm run build` in michaelwegter.com: PASS (vite 6.4.2, built in ~0.7s, 44
modules). Demo copied verbatim into `dist/demos/grocapitus-investor-tools/`.

## Math sanity-check (default inputs)
Node verification produced: NOI $13,337, cap rate 3.8%, monthly P&I $1,863,
monthly cash flow -$751, CoC -11.7%. Matches the expected targets (NOI ~$13,352,
cap 3.8%, P&I $1,863, CF ~-$750). The tiny NOI delta is because management fee is
computed off EGI per the research formula, which is correct. The negative deal
triggers the "Negative Cash Flow" verdict state as intended.

## Backend
None. Frontend-only, no mw-backend changes, no redeploy needed.

## Deviations
None of substance. Disclaimer wording tightened to the exact research-mandated
phrase. No contact info / "built by" credit anywhere.
