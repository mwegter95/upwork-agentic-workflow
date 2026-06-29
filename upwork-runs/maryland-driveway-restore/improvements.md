
### plan-ceo
- [adherence] plan-eval treated "real WordPress" as impossible on GitHub Pages and missed that the Surface runner (Option 3) explicitly enables it; eval prompt should remind it to weigh explicit user implementation directions against the chosen host, not just GitHub Pages constraints.

### demo-builder
- [adherence] Cloudflare's 524 timeout (~100s) blocks docker image pulls via the runner; CLAUDE.md should note that large Docker pulls must be registered as services (run-server.ps1 owns the pull+start) rather than blocking inside a runner script.
- [reuse] WordPress-behind-reverse-proxy sub-path redirect loop is a reusable known issue: bake the `redirect_canonical` filter (suppress redirect when REQUEST_URI is `/`) into CLAUDE.md as a standard WP Docker setup step for any sub-path proxy deployment.
- [tokens] Sending PHP template content embedded in Python strings caused Windows charmap encoding errors on first attempt; the prompt should warn explicitly that all runner scripts must use only ASCII characters (no box-drawing chars, no Unicode in comments).

### researcher
- [adherence] When a pre-researcher step already ran (pre-researcher.out exists), the researcher prompt should explicitly say "do not re-derive domain/competitor/pricing/imagery — those are already in pre-researcher.out; focus only on build-prep (scaffold, Docker, WP-CLI commands, theme code)" to avoid potential overlap.
- [tokens] The Surface port assignment and service registration could be a reusable scaffold snippet baked into CLAUDE.md for WP Docker runs, rather than re-derived per proposal.

### demo-builder (v2)
- [reuse] WP sub-path bridge requires 3 filters for admin login to work end-to-end: `wp_redirect` (fixes outer URL + embedded redirect_to param), `login_redirect` (fixes post-submit destination), and `login_url` (fixes login URL in auth_redirect); `wp_redirect` alone is insufficient.

### build-ceo
- [adherence] demo-builder should self-test sub-pages (not just `/`) THROUGH the bridge/canonical Host, since WP canonical redirects only surface on non-root paths and the homepage passes while everything else breaks.
- [reuse] Bake "WP bridge must forward the canonical Host header (not strip it) + X-Forwarded-Proto:https" into the WordPress bridge template/CLAUDE.md so this defect isn't rediscovered per WP run.

### deploy
- [adherence] Bridge template should strip `accept-encoding` from hop-by-hop set by default; stripping `content-encoding` without stripping `accept-encoding` causes gzip body passthrough with no encoding header — browser receives binary garbage. Bake this into bridge_blueprint_template.py.
- [reuse] The auto-deploy watcher needs two git pushes (blueprint + gzip fix) before it settles; future runs should validate the bridge response body (not just HTTP status) immediately after the first push to catch encoding issues before a second deploy cycle.

### demo-builder (v4 — fix pass)
- [reuse] Reverse-proxy bridges must use a no-redirect opener (never urllib.request.urlopen default); bake `_NoRedirect` handler into bridge_blueprint_template.py — any redirect-following proxy will silently discard WP auth cookies from 302 responses, breaking login end-to-end.
- [adherence] Deploy-test failures should always be reproduced locally first (run the .cjs file) before touching code — the playwright script was already in the run dir; running it immediately would have saved diagnostic steps.

### deploy-test
- [adherence] CSS palette check should fetch the external stylesheet directly (via curl/requests), not search the HTML body; inline CSS is rare in WP themes and the body-search will always false-neg when styles are in an external file.
- [tokens] Design cue verification is cheaper via a one-line curl + grep on the CSS href extracted from the HTML than loading the full page in Playwright; extract the CSS URL, curl it, grep for color vars.

### demo-builder (v3)
- [reuse] WP functions.php must never use `?>` closing tag — bake this as a hard rule into researcher/CLAUDE.md for all WP theme builds to prevent the PHP source-code leak defect from recurring.
- [adherence] When containers are already running (prior run state), check all theme files AND PHP output quality before declaring the build complete; prior run may have left broken files in the Docker volume.
- [tokens] Reading full file bodies to check content presence wasted tokens on 8000-byte buffer hits; the prompt should specify to check `len(body)` first and use a large enough buffer (50000+) to avoid false MISSING reports.

### media-capture
- [reuse] Playwright keyboard press should use `page.keyboard.press('Escape')` not `page.press('Escape')` — bake this into a reusable media-capture template for future runs to avoid the syntax fix iteration.

### proposal-writer
- [reuse] python-pptx was not pre-installed; add it to a shared prerequisites list (or check+install at step start) so the step doesn't have to pip install mid-run.
- [adherence] PPTX deck was pre-scripted (build-deck.py) by demo-builder but not executed; proposal-writer should check for build scripts and run them rather than regenerating a deck from scratch.
- [tokens] Em-dash scan should be run on all prose deliverables before writing the output file; scanning after writing forced extra edit cycles on one-pager.html.

### final-ceo
- [adherence] deploy-test flagged `demo_admin` as a "stale hash, untested" but the proposal-writer advertised it anyway; deploy-test should test the exact credential the writer prints (or the writer should advertise the credential deploy-test verified) so final-ceo doesn't have to re-test the login itself.
