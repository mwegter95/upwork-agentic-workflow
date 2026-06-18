### deploy-test
- [adherence] Initial selectors assumed aria-label/id on buttons; actual demo uses semantic class names (.btn-transport, .song-chip). Prompt should require a DOM inspection pass before writing final selectors, or use text-content matching as primary fallback.
- [reuse] Playwright is installed in the workflow repo's node_modules but tests are written as loose .mjs files; a shared test scaffold in scripts/pw-test-template.mjs would avoid re-writing boilerplate each run.

### proposal-writer
- [adherence] Em dashes slipped into HTML title and alt text attributes; a pre-write grep for literal U+2014/U+2013 should be mandatory before saving any deliverable.
- [tokens] Reading all four upstream handoff tails is enough; opened full files unnecessarily -- the handoff blocks had the needed info for cover letter framing.

### demo-builder
- [adherence] When inserting new array items into existing JS files, always read the exact array boundaries first and use Write (full rewrite) rather than Edit for structural changes -- Edit caused song 3 to land outside the SONGS array.
- [tokens] The demo-src files were already fully built from a prior partial run; next time, scan for existing source files before re-reading the full researcher spec to avoid reading 560 lines when 50 would suffice.
