
### deploy-test
- [adherence] Test script treated GH Pages SPA 404 as a hard error — prompt should explicitly say "HTTP 404 on SPA routes is expected; pass if page title and iframe src are correct."
- [reuse] Playwright not pre-imported in project; each run re-resolves Python vs Node playwright — add a check or note in CLAUDE.md that Python playwright is the reliable path on this machine.

### demo-builder
- [adherence] The researcher.out was written as an exhaustive build-prep doc (all snippets inline) but builder still had to read the full file — future researcher output could split "handoff" from "full spec" so builder reads only the delta when it's clear the handoff covers everything needed.
- [tokens] The admin.js and style.css are large; a terse per-section template in the handoff (e.g., "KB editor: CRUD table + toggle-expand rows") would let builder confirm scope without re-reading full researcher spec.

### media-capture
- [reuse] WASM model init (5-15s) blocks textarea interaction in headless — deploy-test handoff could recommend minimum wait time (~12s) and textarea enable-check for media-capture script to reuse.
- [tokens] Playwright video path() API handling needs try-catch + file existence check; script had 7+ error paths for interactive failures that could collapse into one "skip-if-disabled" pattern.

### proposal-writer
- [adherence] The CLAUDE.md says one-pager and deck should use the demo's bespoke design language, not the portfolio theme — the existing ABA run's one-pager used portfolio colors, which would be wrong; add a one-line reminder in the brief.json design_direction that the one-pager/deck palette should mirror the demo's palette (hex values).
- [reuse] Screenshot paths in one-pager are relative (media/); if the evaluator or client opens the HTML directly from a different CWD it will 404; base64-embed the screenshots or note this caveat in the handoff.
