### demo-builder
- [adherence] researcher.out's outDir was 3 levels up (`../../../`) but the correct depth from demo-src is 4 levels — the path calculation should be verified by every run against the actual repo structure rather than assumed from the researcher's suggestion.
- [tokens] The seed data array had to be duplicated in both seedLeads.js (frontend) and clientfinder_blueprint.py (Python) — a note in researcher.out to generate the JS file from the Python dict would save a full re-write of 50 objects.
- [reuse] The Pillow PNG generation for placeholder.png is a one-off — make it a reusable `scripts/gen_placeholder.py` in the workflow repo so future runs don't rewrite the same PIL code.

### deploy-test
- [adherence] Modal content checks should use case-insensitive matching (`.toLowerCase().includes(...)`) — demo section labels are mixed-case in DOM textContent ("Technical Audit Scores"), not uppercase as assumed.
- [adherence] Test should click `[title="View details"]` (the eye icon button) not the row body for drill-down; row click selects checkbox — prompt should specify to inspect the actions column for the trigger.
- [reuse] GH Pages SPA 404 should be tested by checking for iframe presence, not HTTP status — the 404 is the redirect mechanism, not a real error; document this in the test prompt to avoid false failures.

### build-ceo
- [adherence] demo-builder reported workSamples.js registration in its summary but never wrote it; add an explicit self-check that greps the registry for the slug before reporting BUILT.
