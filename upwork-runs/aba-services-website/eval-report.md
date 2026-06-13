# Eval Report: aba-services-website

**Date:** 2026-06-10
**Verdict:** PASS

---

## Hard Gates

| # | Gate | Result | Evidence |
|---|------|--------|----------|
| HG1 | Requirement coverage (all `must` reqs in cover letter AND demo/deck) | PASS | R1-R5 all `must`: R1 (professional ABA site) = entire demo + cover letter opener + deck slide 1 hero shot + one-pager hero. R2 (visually appealing) = hero + services strip + warm palette in demo + deck slide 3 req table + one-pager. R3 (user-friendly) = anchor nav, accessible form, FAQ accordion in demo; called out in cover letter ("clear hero, plain language") and deck slide 3. R4 (communicate services) = services explorer cards with expand/collapse in demo; deck slide 2 "click first" and slide 3. R5 (design + dev integrated) = cover letter closing paragraph + deck slide 3 ("One artifact, one developer, one timeline") + one-pager "How I would scope the real build." R6 is `must: false` (nice-to-have); addressed anyway via SVG logo, hero illustration, and icons in demo. |
| HG2 | Demo builds and loads with no first-paint console errors | PASS | run.log records `demo-builder: ok | build PASS (594ms); 4 files touched`. JS brace balance is exact (42/42). Both asset references (./assets/styles.css, ./assets/app.js) resolve against the actual files in `public/demos/aba-services-website/assets/`. No external scripts that could 404. No build-report.md file, but run.log constitutes the self-test record. |
| HG3 | Demo URL resolves locally (path exists) | PASS | `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/demos/aba-services-website/index.html` confirmed present. |
| HG4 | Demo link in BOTH cover letter and deck | PASS | Cover letter contains `https://michaelwegter.com/work-samples/aba-services-website` and raw fallback `https://michaelwegter.com/demos/aba-services-website/`. Deck contains the same URL on slides 1, 2, and 8. |
| HG5 | No em/en dashes (U+2013, U+2014) in cover letter, one-pager, or deck | PASS | Python Unicode scan of cover-letter.md and one-pager.html returned no hits. python-pptx full-text scan of all 8 slides returned no hits. Demo index.html also clean. |
| HG6 | One-pager on-brand (dark palette + Space Grotesk / Inter / JetBrains Mono) | PASS | All eight design tokens checked (--mustard, --cyan-vivid, --bg-root, --bg-surface, --text-primary, Space Grotesk, Inter, JetBrains Mono) are present in one-pager.html inline styles. Demo styles.css also imports all three fonts and uses #e8b820, #12b4c8, #1a1822. |

---

## Soft Scores

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Cover letter specificity | 5 | Opens with the client's actual UX problem (10-second scan, warm + real), names the demo by clinic name (Bright Path ABA), references specific interactive elements (services cards, intake form validation, FAQ), answers both application questions explicitly, closes with concrete next-step questions. Zero generic filler. |
| Conciseness / skimmability | 5 | 315 words, five short paragraphs, each with a single job. Client can skim to the demo link in under 10 seconds. |
| Demo quality | 5 | Full single-page mock clinic site with hero trust strip, interactive services explorer (expand/collapse with age ranges), BCBA team strip, FAQ accordion, and inline-validated HIPAA-aware intake form. This is precisely the artifact the client imagined owning. The JS is clean, self-contained, and functional. |
| Deck polish | 5 | 8 slides: title + live demo link, demo walkthrough with two specific CTAs, requirements table mapping all R-numbers, HIPAA guidance slide, post-build scope, frameworks/credentials, kickoff questions, CTA close. On-brand dark palette throughout, no dashes, URL on three slides. |
| Persuasiveness | 5 | The live demo is front and center in the first line of the cover letter, the first CTA of the deck, and the hero of the one-pager. Requirement coverage is explicit with a labeled table. HIPAA awareness addresses a real concern the client likely has not articulated. Kickoff questions signal owner-level thinking, not order-taking. |

**Average soft score: 5.0 / 5.0**

---

## Fix List

None. All hard gates pass and all soft scores are at ceiling.

---

## Notes

- No `build-report.md` file was produced by this run; the run.log entry for demo-builder is the only self-test record. Future runs should write `build-report.md` explicitly so the evaluator has a dedicated artifact to check.
- `proposalDeckUrl` and `proposalPageUrl` in `workSamples.js` are both `null`. This is acceptable for a pre-deploy state; they should be filled in after the site is redeployed and the `/work-samples/aba-services-website` route is live.
