### image-analyzer
- [tokens] Pillow is not pre-installed; pip install ran every time — make Pillow a prerequisite or cache it so this step does not pay install cost on each run.
- [adherence] For demos with zero raster images the manifest-building (grep/code scan) phase is sufficient; the prompt could specify to skip screenshot crops when the manifest is already conclusively empty, saving vision token cost.
- [reuse] The `Read` tool renders JPEG bytes as raw binary, not decoded pixels; a PIL-based crop-to-JPEG pipeline was needed as a workaround — prompt should note this and suggest the crop approach as the standard method for viewing screenshots.

### deploy-test
- [tokens] DOM inspection pass wasted 2 full script runs before correcting selectors; prompt should require a DOM dump pass BEFORE writing the test script to avoid blind selector guessing
- [adherence] Role login used `button` locator — prompt should explicitly note that RBAC demos often use div/card click patterns, not buttons, and to grep source for onClick before scripting
- [reuse] `npx serve` start + Playwright browser launch repeated across 3 script files; a shared setup module or prerequisite server step would save ~30s of redundant spin-up

### proposal-writer
- [adherence] Em/en dashes in markdown headings and HTML title elements are easy to miss; prompt should explicitly call out that heading and title strings are just as prohibited as body prose, not only inline content.
- [tokens] The one-pager kicker used &mdash; on first write; adding a pre-write reminder to draft with commas/colons in place of dashes (rather than fixing post-hoc) would eliminate the fix round-trip.
- [reuse] python-pptx is not pre-installed; pip3 install ran at step start each time -- make it a prerequisite or add it to the workflow environment so the install cost is not paid per run.

### final-ceo
- [adherence] media-capture produced 4 identical near-empty PNGs (same MD5, wrong serve root); the capture step should assert distinct MD5s and a min file size per frame before handoff.
- [reuse] Playwright lives in upwork-agentic-workflow/node_modules; local-verify scripts must run with that dir as cwd, a /tmp script fails to resolve the import.

### proposal-writer (re-run)
- [reuse] Capture scripts must be .mjs (not .js) when the workspace package.json has "type":"module"; prompt should note this to avoid a require() crash on first run.
- [adherence] The media-capture step should be required to verify distinct MD5s and min size before marking handoff complete, so the writer never inherits duplicate frames and gets looped back unnecessarily.


### prompt-optimizer
- [reuse] Several runs repeat the same Pillow/python-pptx "pip install at step start" lesson; these are environment prerequisites, not prompt fixes, so a setup/image manifest should own them and stop surfacing them as per-run improvements.
