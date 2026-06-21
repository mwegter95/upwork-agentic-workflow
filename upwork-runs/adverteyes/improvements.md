### planner
- [adherence] When research is returned, patch the existing planner.out in place with Edit calls rather than a full rewrite — the file was 231 lines with ~8 localized changes; surgical edits would have been cheaper.
- [tokens] The "Research questions" section in the initial plan was good but could include explicit placeholder tokens (e.g., `__PALETTE_HEX__`) so the researcher knows exactly where to substitute values without reading surrounding prose.

### pre-researcher
- [adherence] Planner should include a "design direction placeholder" section in plan.md with explicit `__RESEARCH_REQUIRED__` markers so the researcher knows exactly which tokens to replace, rather than hunting through prose.
- [tokens] WebFetch on competitor brand sites returned limited CSS detail; future prompts should direct the researcher to fetch the site's CSS/stylesheet URL directly for hex values rather than relying on HTML-to-markdown conversion.

### researcher
- [adherence] When a build-ceo.out exists (loop-back case), the researcher prompt should explicitly direct the step to read it first — the existing handoff chain (plan-ceo → researcher) does not mention it, so the researcher risks missing key directives from the CEO's punch list.
- [reuse] The styles.css and scaffold files in demo-src/ are already complete from the prior demo-builder attempt; the researcher output should explicitly flag these as "do not regenerate" so demo-builder doesn't overwrite them with fresh versions.

### demo-builder
- [adherence] `better-sqlite3` fails on Node 22+ Windows (gyp native compile); researcher should specify `node:sqlite` built-in or a pure-JS alternative in the backend scaffold so Surface build never requires a mid-run fix script.
- [reuse] Surface build fix (node:sqlite swap) should be baked into the original `surface_build.py` as the default — the separate fix script is wasted work that a one-line package.json change prevents.
- [tokens] With all 15 source files already authored by a prior run, demo-builder spent tokens reading each file to confirm completeness; a single `wc -l` or glob+size check would suffice to confirm existence vs. emptiness without reading content.

### demo-builder3
- [adherence] Improve-pass prompt should explicitly state whether the Surface backend needs to be re-run (build + register) to avoid the step re-checking status unnecessarily when nothing changed.
- [tokens] Reading all 8 page files to understand current state cost significant tokens; the previous pass's handoff block should enumerate which pages were already "complete" vs "improvable" so the next pass only reads the improvable ones.

### deploy-test
- [adherence] The deploy step should write a structured deploy.out (push hashes, live URL checks) so deploy-test can skip re-testing already-confirmed live URLs; "(step completed)" with no push evidence forces full re-verification from scratch.
- [reuse] Local demo testing requires serving from the site root (not the demo subdirectory) due to Vite's absolute `/demos/<slug>/` asset paths — bake this into the test script template so the path-correction is not re-derived each run.
- [adherence] Demo auth should include a local/mock fallback path (localStorage seed token or bypass query param) so the frontend can be validated independently of the backend bridge, preventing all features from being untestable when the API is down.

### build-ceo
- [adherence] demo-builder produced a full working app across two loops but never wrote demo-builder.out — its prompt should hard-gate completion on emitting that file + handoff, since build-ceo and downstream steps have no provenance without it.
- [reuse] Any backend route that fetches a third-party API with node-fetch v2 should default to `Accept-Encoding: gzip, deflate` (brotli is unsupported and throws "Invalid response body") — worth baking into the backend template/checklist so this 502 isn't rediscovered per run.

### build-ceo
- [adherence] demo-builder should verify backend endpoints by hitting the live SERVICE (not just `npm run build` + UI), since frontend mock-fallbacks silently mask 502s on hero endpoints.
- [adherence] Prompt demo-builder to avoid manual `Accept-Encoding` headers with node-fetch (gzip "Invalid response body" bug) and prefer Node 22+ global fetch.

### planner2
- [adherence] Improve-pass planner should read deploy-test.out before any other artifact to immediately surface the root cause without reading all prior handoffs in sequence.
- [reuse] Auth offline-fallback pattern (DEMO_USERS map + base64 pseudo-token) is reusable across any demo that requires login — bake it into the demo-src template so it ships by default instead of being retrofitted in an improve pass.

### build-ceo
- [adherence] Improve-pass demo-builder treated the backend as out-of-scope and made "no backend changes" two passes running, leaving a prior CEO BLOCKER unfixed — improve prompts should carry forward unresolved CEO blockers as mandatory, not just apply new feature requests.
- [adherence] Frontend silent mock-fallback under a "Live" label let a broken hero feature look fine in the UI; demo-builder prompt should forbid labeling fallback/mock data as "live" without a visible offline badge.

### build-ceo
- [adherence] demo-builder shipped ~40 em/en dashes in demo UI strings through 4 passes uncaught — add an explicit "grep demo-src/src for —/– before declaring build done" check to the demo-builder prompt so this hard gate (DoD #5) is enforced at build time, not at CEO/eval.

### demo-builder5
- [tokens] Reading all page files top-to-bottom to plan improvements cost ~4k tokens; future improve passes should use wc -l + grep for specific patterns (alert(), missing features) rather than full reads of already-understood components.
- [adherence] AlertsContext.setMaintenanceUnits is called from Dashboard useEffect without useCallback wrapping, which can cause unnecessary re-renders if AlertsContext re-renders — the improve prompt should flag context setter stability as a requirement for context-based side effects.
- [reuse] The CSV download helper (downloadCSV function) is general-purpose and should be extracted to a utils.ts file so future pages can import it without re-defining it per component.

### build-ceo
- [adherence] demo-builder ignored the prior CEO's explicit dash-sweep loop instruction and added MORE dashes; the demo-builder prompt should treat an open CEO blocker as a must-clear gate before adding new scope.
- [adherence] Add a cheap pre-build CI-style check to demo-builder: `grep -ro $'[–—]' demo-src/src | wc -l` must be 0 before it reports done, so DoD#5 can't regress silently.

### demo-builder6
- [reuse] The em/en dash sweep Python script is now proven pattern; bake it as a standard pre-build step in the demo-builder prompt so it runs before `npm run build` every time rather than as a late-pass fix.
- [tokens] Reading all 9 page files fully to plan improvements cost significant tokens; future improve passes should grep for specific anti-patterns (native alert/confirm calls, em-dashes, missing toast imports) before reading any file, then read only files that match.
- [adherence] The Campaigns ternary restructure (table vs gantt view) required reading the full component to find the right insertion point; the planner should flag "view toggle needed" as a component-level spec so demo-builder knows the shape before opening the file.

### build-ceo
- [adherence] Make the demo-builder dash sweep explicitly include index.html (title/meta), not just src/**/*.{tsx,ts,css} — three passes missed the `<title>` em dash.

### deploy-test (improve pass)
- [adherence] When the Surface runner returns an Express-style "Cannot POST /run/exec" error instead of a Flask 401/403, a misconfigured Flask blueprint is intercepting the runner; add an early check for this pattern (compare `/health` response shape to expected Flask JSON) so the root cause is identified immediately rather than after exhausting Playwright tests.

### demo-builder7
- [tokens] Reading full Dashboard/Analytics/Weather/Bookings files to find insertion points cost many tokens; handoff from prior demo-builder passes should enumerate key line numbers for the "pending approvals" section, analytics chart insertion point, and fleet card loop so future passes can use targeted Read offsets immediately.
- [reuse] GlobalSearch data (units/campaigns/clients) is fetched on first open and re-fetched each time the modal opens if it was previously closed; cache the fetch in a ref or context-level store so repeated Cmd+K opens within a session skip re-fetching.

### demo-builder8
- [tokens] Weather page 24hr charts already existed from a prior pass; a `wc -l` check on the file before reading revealed this, saving ~2k tokens. Future passes should always check file sizes before reading to identify already-rich pages.
- [reuse] The ThemeContext pattern (localStorage + data-theme attribute) is fully reusable across any demo that needs dark/light toggle; extract it as a scaffold template file so future demo-builder passes don't have to write it from scratch.
- [adherence] Recharts SVG internal text uses hardcoded `fill` colors; the light-mode CSS vars swap `--text-muted` but Recharts does not honor CSS vars on SVG unless passed as props, meaning chart axis labels stay dark-theme color in light mode. Future improve passes should fix this by reading the theme context in each chart component and passing explicit fill values.

### demo-builder9
- [tokens] Checking all page files to find insertion points required reading up to 8 files; the prior pass's handoff should enumerate "top 3 improvement opportunities" with file+line so next pass targets immediately without full reads.
- [adherence] Improvement runs should explicitly state whether the backend is confirmed live at run start (curl /health) so demo-builder doesn't re-test it redundantly; save that check for deploy step.

### build-ceo
- [adherence] Weather has a known mock fallback that hides a 502 backend failure behind a green UI; demo-builder/deploy-test prompts should require asserting non-empty live data (not just page load) for any endpoint with a mock catch.

### build-ceo
- [adherence] demo-builder repeatedly re-tests only /health + login and reports "backend healthy" while a hero route (/weather) stays 502 — its prompt should require exercising every hero endpoint (not just health/auth) before writing its handoff.

### deploy-test (improve pass 2)
- [adherence] The 401 interceptor + unauthenticated context provider pattern is a common React pitfall; deploy-test prompt should explicitly call out "check for infinite API call loops (> 10 identical requests in first 5s)" as a named test case so it is caught immediately rather than discovered mid-investigation.
- [reuse] Using `page.route()` to inject auth headers lets deploy-test independently verify "is the app functional when auth works?" separate from "does the auth flow work?" — add this two-phase approach (auth flow test + route-bypass functional test) to the deploy-test prompt as the standard pattern.

### final-ceo
- [adherence] proposal-writer claimed the em-dash fix was done but only touched the footer entity; its prompt should require a repo-wide grep for em/en dashes (literal + &mdash;/&ndash;) across ALL deliverable files before reporting done.
