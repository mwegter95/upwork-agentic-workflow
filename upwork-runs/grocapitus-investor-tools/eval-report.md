# Eval report: grocapitus-investor-tools

**Overall verdict: PASS with one advisory fix**

---

## Hard gates

| # | Gate | Result | Evidence |
|---|------|--------|----------|
| H1 | Requirement coverage | PASS | All 8 `must` requirements (R1-R8, R11) mapped; R1 via portfolio+demo, R2 via demo, R3 via demo+cover letter, R4 via cover+deck, R5 via portfolio breadth, R6 via deck process section, R7 via cover letter one-liner, R8 via cover letter one-liner, R11 via cover letter one-liner. R9 is preferred-only and handled honestly (no fabrication). See traceability table in `plan.md` and requirement-coverage table in `one-pager.html`. |
| H2 | Demo builds + loads | PASS | `build-report.md` records `npm run build` PASS (Vite 6.4.2, ~0.7 s, 44 modules). HTTP 200 on all three demo files in local preview. No obvious first-paint console-error risk: all element IDs in `index.html` match `app.js` refs; no missing assets; `render()` is called unconditionally on init. |
| H3 | Demo URL resolves | PASS (pre-deploy) | All three files exist at the correct paths under `public/demos/grocapitus-investor-tools/`: `index.html`, `assets/app.js`, `assets/styles.css`. `index.html` references `./assets/app.js` and `./assets/styles.css` with correct relative paths. Post-deploy `/work-samples/grocapitus-investor-tools` is pending deploy. |
| H4 | Demo link present | PASS | `cover-letter.md` line 3: `https://michaelwegter.com/work-samples/grocapitus-investor-tools`. Deck text (extracted via python-pptx): `michaelwegter.com/work-samples/grocapitus-investor-tools` appears on both the hero slide and the final slide. |
| H5 | No em/en dashes | PASS* | `grep -nP "[\x{2013}\x{2014}]"` finds zero matches in `cover-letter.md` and `one-pager.html`. Deck slide XML: zero matches. **Advisory:** `assets/app.js` line 61 contains U+2014 as a UI fallback glyph (`return '—'` in `pct()` for non-finite values). This character is rendered in the browser on screen if a cap-rate or CoC input is non-finite. CLAUDE.md says "no em dashes anywhere"; the rubric's H5 command only names the two text deliverables. Treated as an advisory, not a hard block, but should be fixed. |
| H6 | On-brand | PASS | `styles.css` declares all design tokens verbatim (`--mustard:#e8b820`, `--bg-root:#121118`, `--font-display:'Space Grotesk'`, `--font-body:'Inter'`, `--font-mono:'JetBrains Mono'`). `one-pager.html` embeds the same tokens in a `:root` block and loads the three Google Fonts. Demo uses dark surface palette throughout. |

---

## Soft scores

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Cover letter specificity | 5 | Opens by calling out the client's exact workflow ("take a rough prompt ... hand your investor community a working, tasteful tool a few hours later, all of it built by directing AI"). Names the demo, describes every feature by name (cap rate, cash-on-cash, deal-verdict chip, rent sensitivity slider), addresses WebWork/async/workspace in a single focused paragraph. Zero generic filler. |
| Conciseness | 5 | Three tight paragraphs. Each carries load: demo intro, process fit, why me. The one-pager and deck carry the visual evidence so the letter stays lean. Skimmable in under 60 seconds. |
| Demo quality | 5 | Calculator computes NOI ($13,337), cap rate (3.81%), monthly P&I ($1,863), monthly cash flow (-$751), and CoC (-11.7%) to within rounding of the research targets. Live-on-keystroke, no submit button. Color-coded verdict chip, revenue-vs-expense bar, rent sensitivity slider with break-even hint, and 1%/50% rule hints all ship. Directly addresses the client's #1 need (investor education tool). |
| Deck polish | 4 | On-brand dark palette, all three fonts, mono eyebrows, requirement-coverage table, portfolio grid with screenshots. Demo URL appears on two slides. Minor deduction: no embedded screenshot of the actual calculator inside the deck (just text + URL); the `one-pager.html` has the screenshot but the `.pptx` slides reference the live URL rather than a static preview image. Not a blocker, but a visual-polish miss. |
| Persuasiveness | 5 | "I built one of yours first" is the ideal opening move for a vibe-coding brief. The demo is functional and immediately verifiable. The cover letter, deck, and one-pager all reinforce the same narrative thread (prompt to working tool, fast, documented, under CEO direction). The honest handling of the enrollment question (R9) builds trust rather than deflecting it. |

**Soft score average: 4.8 / 5. No dimension below 3.**

---

## Math sanity check

Default inputs (purchase $350k, 20% down, 7%, 30 yr, $2,200 rent, 8% vacancy, 9% mgmt, 5% repairs, 5% capex, $4,375 tax, $1,750 ins):

| Metric | Expected | Computed | Match |
|--------|----------|----------|-------|
| NOI | ~$13,337 | $13,337 | YES |
| Cap rate | ~3.8% | 3.81% | YES |
| Monthly P&I | ~$1,863 | $1,863 | YES |
| Monthly cash flow | ~-$751 | -$751 | YES |
| CoC | ~-11.7% | -11.7% | YES |

All internally consistent. Negative default triggers the "Negative Cash Flow" verdict as designed.

---

## No-contact-info check

- `cover-letter.md`: no email, phone, or personal contact detail found.
- `one-pager.html`: no email, phone, or personal contact detail found.
- `deck.pptx`: no email or phone found (URL patterns in deck are all `michaelwegter.com/work-samples/...`).
- `demo/index.html` and `demo/assets/`: no "built by" credit, no contact info.

---

## Fix list

**Priority 1 (advisory, demo-builder) — Remove the em dash from `assets/app.js` line 61.**

The `pct()` helper returns the literal character U+2014 (`'—'`) when its argument is not finite. CLAUDE.md prohibits em dashes "anywhere." While this character only appears in the rendered UI under degenerate input (e.g. purchase price set to 0), it is a live em dash in browser output. Replace with `'N/A'` or `'--'`.

File: `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/demos/grocapitus-investor-tools/assets/app.js`, line 61.
Owning phase: **demo-builder**.

**Priority 2 (optional, proposal-writer) — Add a calculator screenshot to the deck.**

The `.pptx` "Live Demo" slide references the URL but contains no embedded image of the calculator. The `one-pager.html` already has the screenshot (`media/hero.png`). Embedding it in the deck slide would bring visual impact in line with the one-pager. This is a polish issue, not a gate failure.
Owning phase: **proposal-writer** (rebuild deck slide with embedded screenshot) or **media-capture** (confirm `media/hero.png` is suitable for deck embed).

---

## Verdict

**PASS.** All 6 hard gates pass. Soft average is 4.8. One advisory fix (Priority 1) should be applied before deploy: remove U+2014 from `assets/app.js` line 61. It does not block the run but violates the "no em dashes anywhere" hard rule in CLAUDE.md. After that single-line fix, the package is ready to deploy.
