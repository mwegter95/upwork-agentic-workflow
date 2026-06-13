# Eval Report -- Repsetta (repsetta-fitness)

Date: 2026-06-12

---

## Hard Gates

| # | Gate | Result | Evidence |
|---|------|--------|----------|
| H1 | Requirement coverage | PASS | All 10 `must` requirements (R2, R3, R4, R7, R8, R9, R10, R11, R12, R13, R14, R15) addressed in cover letter and/or demo/deck. Mapping below. |
| H2 | Demo builds + loads | PASS | build-report.md: Expo export SUCCESS, site `npm run build` PASS (44 modules, ~0.7s). Self-test: Playwright smoke run confirms Today screen renders, no console errors on first paint. |
| H3 | Demo URL resolves (local) | PASS (pending deploy) | Files exist at `public/demos/repsetta-fitness/` with correct index.html and asset bundles (`_expo/static/js/web`, `_expo/static/css/global.css.web-*.css`). Asset paths correctly prefixed with `/demos/repsetta-fitness/`. Live `/work-samples/repsetta-fitness` is pending deploy -- not a fail per eval instructions. |
| H4 | Demo link present | PASS | Cover letter line 3: `https://michaelwegter.com/work-samples/repsetta-fitness`. Deck slide 1, slide 4, and slide 7 all reference `michaelwegter.com/work-samples/repsetta-fitness`. |
| H5 | No em/en dashes | PASS | `grep -nP "[\x{2013}\x{2014}]"` returned exit 1 (no matches) on cover-letter.md and one-pager.html. python-pptx scan of deck text: no matches. Zero violations across all three artifacts. |
| H6 | On-brand | PASS | one-pager.html defines all CLAUDE.md tokens in `:root` (--mustard #e8b820, --cyan-vivid, --bg-root #121118, --bg-surface, --bg-card, etc.) and loads Space Grotesk, Inter, and JetBrains Mono from Google Fonts. Dark palette applied throughout. Demo styled with NativeWind using the same mustard/dark-surface/mono-label token set per build-report. |

---

## Requirement Coverage Map (Gate H1 detail)

| Req | Must | Satisfied in cover letter | Satisfied in demo or deck |
|-----|------|--------------------------|--------------------------|
| R2 | yes | Yes -- "React Native, Expo, and NativeWind, which the demo runs on" | Demo (real RN app) + deck slide 5 |
| R3 | yes | Yes -- "I am comfortable on Android and iOS" + codebase targets Android | Demo single codebase + deck slide 5 |
| R4 | yes | Yes -- "React Native, Expo, and NativeWind" explicitly named | Demo built in RN + NativeWind; deck slide 5 |
| R7 | yes | Yes -- "I can commit comfortably under 30 hours a week" | Deck slide 3 and slide 7 |
| R8 | yes | Yes -- "for the long haul (6+ months)" | Deck slide 3 and slide 7 |
| R9 | yes | Yes -- addressed upfront and honestly, no fabrication | Deck slide 5 requirement coverage row |
| R10 | yes | Yes -- health and wellness answer in paragraph 3 | Deck slide 5 "Health & wellness domain" row |
| R11 | yes | Yes -- "the product genuinely interests me because the capture loop is a fun, high-craft UX problem" | Deck slide 2 (The Problem) contextualizes fit |
| R12 | yes | Yes -- references live demo + U.S. Bank 2.5 yr solo dev role as recent similar experience | Deck slide 6 (Why Michael) |
| R13 | yes | Yes -- "I do not hold a formal fitness certification. What I bring instead is engineering depth and a working app" | Deck slide 5 certifications row |
| R14 | yes | Yes -- frameworks listed: React Native, Expo, NativeWind, Flask, React, Angular, .NET, Python | Deck slide 5, slide 6 |
| R15 | yes | Yes -- "polished NativeWind UI, rest timer UX" | Demo (live polished UI) + deck slide 5 |

---

## Em/En Dash Scan

- cover-letter.md: 0 violations
- one-pager.html: 0 violations
- deck.pptx (all slide text): 0 violations

---

## Soft Scores

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Cover letter specificity | 5 | Opens by naming Repsetta's exact problem ("the workout capture loop"), immediately links the live demo by name and URL, walks through what to click, explains what the demo proves, and answers all five proposal questions inline. Zero generic filler. |
| Conciseness / skimmability | 4 | Five tight paragraphs, each with a clear purpose. Bold topic headers aid skimming. Slightly long in the third paragraph (frameworks list) but never padded. |
| Demo quality | 5 | Full Expo + React Native + NativeWind app with three screens directly matching the client's core need: guided program entry point, set/rep/weight logger with live rest timer, and a progress view with bar chart. Real Flask backend round-trip. Exactly the "core capture loop" they are hiring for. |
| Deck polish | 5 | Seven slides, on-brand dark theme, mono eyebrows, mustard accents, requirement coverage table, proof cards with real numbers, and demo link on slides 1, 4, and 7. No filler slides. |
| Persuasiveness | 5 | The "I built it before saying a word about it" opening is strong and immediately validated by a real URL. Honest location disclosure defuses the hard gate risk rather than hiding it. Every major objection (certs, location, frameworks, long-term availability) gets a direct answer. Strong. |

**Average: 4.8 / 5** (all dimensions >= 4)

---

## Fix List

None. All hard gates pass and all soft scores are at or above threshold.

The package is ready to deploy.
