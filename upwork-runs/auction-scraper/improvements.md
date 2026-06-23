### planner
- [tokens] Planner runs twice (pre-research draft + post-research integration); the first pass wrote a full 220-line plan with candidate tables when only a short "research needed + questions" output was required — prompt could say "if no research.out exists, write only the research questions list (under 30 lines) and stop."
- [adherence] The SSE architecture in the first draft used a single streaming GET endpoint; the corrected design (POST /scrape + GET /stream/<job_id>) should be specified in the prompt so demo-builder gets it right from the first pass.

### pre-researcher
- [tokens] WebFetch blocks on many auction sites due to bot-detection; the step wasted 6+ fetches hitting 403/404 — prompt should note "if robots.txt returns 403, assume Playwright-only and move on; do not retry alternate URLs for the same site."
- [adherence] The prompt says "answer the planner's specific research questions" but doesn't specify to cap fetches per site — adding a "max 2 fetches per candidate, then move on" rule would prevent the retry spiral.

### plan-ceo
- [adherence] Planner §11 hardcoded `github.com/michaelwegter` (404); the real gh account is `mwegter95` — prompt could tell planner/demo-builder to resolve the actual account via `gh auth status` before writing a profile URL.

### demo-builder
- [reuse] Playwright browser install on the Surface should be a one-time setup step registered in CLAUDE.md (or a pre-flight check in the runner bootstrap), not rediscovered per run when `playwright_available: false` is returned.
- [tokens] researcher.out §2 DOM ID table was the only input needed; future runs should scope the read to just the handoff block + that section rather than reading the full researcher.out file sequentially.

### deploy-test
- [reuse] Playwright is installed in `upwork-agentic-workflow/node_modules` but the test script must use the absolute module path (`/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/node_modules/playwright/index.mjs`) — bake this path into the step prompt to avoid the 2-attempt resolution loop.
- [adherence] The step prompt says "log in if there is auth" but doesn't clarify how to determine whether a demo has auth; add a note to check deploy.out for "credentials" or "login" keywords first before attempting login.

### final-ceo
- [adherence] Add an explicit em/en-dash auto-scan (cover/one-pager/deck) to the proposal-writer step's self-check so the CEO doesn't catch leftover dashes; one slipped into one-pager.html.
