### planner
- [reuse] SEO analyzer backend and auth routes already exist in server.py — add a CLAUDE.md note that any SEO-focused proposal should check server.py for existing /seo/* and /auth/* routes before planning new blueprints.
- [tokens] Reading the full maryland bridge blueprint was necessary but predictable — the handoff from orchestrator should pre-note the exact file path and port used in prior WP runs so planner doesn't need to re-read it.

### deploy-test
- [adherence] The SEO analyzer form has a confirm-password field (`#registerPassword2`) and a name field (`#registerName`) — document these field IDs in CLAUDE.md or the app's own README so deploy-test doesn't spend 5+ iterations discovering them via trial-and-error.
- [reuse] The Playwright test kept re-deriving the correct register-form field IDs (3 iterations of failures); store canonical auth field IDs in the deploy.out handoff so deploy-test can read them directly.
- [tokens] Running 5+ separate Playwright scripts to discover form structure wasted tokens; a single script that inspects the DOM first (print all input IDs) before attempting to fill would collapse all discovery into one pass.

### demo-builder
- [reuse] WP-CLI is not installed in the `wordpress:6.x` Docker image — the first exec always fails; add a WP-CLI install step to the Surface setup script (surface_setup_panhandle.py) so it is baked in during container setup, not discovered mid-run.
- [adherence] The prior run left the demo in a broken state (WP not installed) without writing to demo-builder.out; the output file should be written incrementally (setup / install / seed) so a re-run can detect partial progress and skip completed phases instead of re-running everything.
- [tokens] Reading the full surface_setup_panhandle.py (1024 lines) to confirm DB credentials cost significant context; store key infrastructure facts (container name, port, DB creds, WP admin creds) in a `state.json` at run start and read only that file on resume.
