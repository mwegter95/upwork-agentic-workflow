# eval-report2.md - Card Shopper (improve pass, terminal-enabled)

Re-score of ONLY what the finish-and-polish pass changed. The first run
(`eval-report.md`) already scored VERDICT: pass with three terminal follow-ups
flagged as PASS-static or PENDING. This run had a terminal and a real browser, so
those follow-ups are now resolved with real evidence. Unchanged gates (G1, G4, G5)
and all soft scores carry forward from `eval-report.md` and are not re-litigated.

## Gates re-scored this pass

| Gate | Was | Now | Evidence (this pass) |
|------|-----|-----|----------------------|
| G2 Demo builds + loads with no console errors | PASS (static) | PASS | Demo served on localhost and driven with Playwright. 22 of 22 functional assertions passed with ZERO console errors / page errors on first paint (`deploy-test2.out`). NOTE: first-run static check missed that the demo loaded React/react-dom/htm from unpkg.com, which is blocked by Zscaler and white-screened the page; fixed by vendoring all three into assets/vendor/ so the demo is now truly zero-CDN. |
| G3 `npm run build` passes + `workSamples.js` valid | PASS (static) | PASS | `npm run build` actually run in michaelwegter.com: vite v6.4.2, 46 modules, built in ~5s, no errors. workSamples.js id-10 entry now has `screenshot: import.meta.env.BASE_URL + "work-samples/card-shopper.png"` (was null) and the PNG exists at public/work-samples/card-shopper.png. |
| G6 Pushed to main (both repos as applicable) | PENDING (terminal) | PASS | michaelwegter.com pushed: origin/main = ce88e4a (rebased over a concurrent remote commit, author pinned mwegter95). No mw-backend change (frontend-only mock CollX + mock Stripe), so no second repo push required. upwork-agentic-workflow run dir also pushed. Live URLs NOT polled (unreachable in this environment); deploy confirmed by the successful push per the wrapper contract. |

Carried forward unchanged: G1 (22 of 22 requirements covered), G4 (demo link in
cover letter + deck), G5 (bespoke felt/navy/gold design, no em/en dashes).

## What the polish pass added (and re-verified)

- Two real blockers a rendering-capable run caught and fixed:
  1. Card art was random Picsum stock photos mislabeled as named cards
     (Umbreon VMAX showed book pages, etc.). Replaced with fully CSS-drawn
     category-tinted holo card faces. Re-captured; cards now read as deliberate
     collectibles.
  2. Light-panel contrast: offer amount, AI-upload review fields, filters, and
     drop-builder inputs rendered ivory-on-ivory (invisible). Added panel-scoped
     dark-on-light overrides. Visually confirmed legible.
- Screenshot gallery embedded into BOTH proposal artifacts from real captures:
  one-pager.html (`#gallery` section, 6 shots + recording note) and deck.html
  (new slide 09 "Inside the prototype", 6 shots; CTA/contact renumbered 10/11).
  Screenshots render from proposal/media/*.png (relative paths verified present).
- Recording referenced: card-shopper-hero-flow.webm in both artifacts.
- Dash check re-run over the whole proposal dir (Python scan for U+2013 / U+2014):
  NO matches. G5 holds.

## Prioritized fix list

Empty. All three first-run terminal follow-ups are resolved:
- build + localhost console pass -> done (22/22, zero console errors)
- push michaelwegter.com to main -> done (origin/main ce88e4a)
- capture + wire card-shopper.png screenshot -> done (registry + gallery)

## handoff
- produced: re-score flipping G2/G3 to full PASS (real build + localhost run) and
  G6 to PASS (confirmed push); two blocker fixes (Picsum art, contrast) plus the
  embedded screenshot gallery verified.
- decisions: unchanged gates and soft scores carried from eval-report.md, not
  re-scored; frontend-only so single applicable repo push.
- next needs: none; run is done for this environment.
- risks: live site/API unverifiable here; trusted via successful push.

VERDICT: pass
