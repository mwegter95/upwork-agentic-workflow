### plan-eval
- [adherence] Rubric axis "testing approach" is weak for richness=10 runs when no test script plan exists in the plan; the prompt should specify a minimum bar (e.g., at least one Playwright assertion list) to give this axis teeth.
- [reuse] WebLLM CDN-vs-bundler incompatibility is a recurring gotcha; add a standard note to CLAUDE.md or the planner prompt that CDN ESM imports must live in a web worker, never in an Angular TypeScript service file.

### demo-builder
- [reuse] Angular's default `ng new` base-href is `/` — add `--base-href /demos/<slug>/` to the scaffold command in researcher.out so demo-builder never has to do a second build pass to fix it.
- [adherence] The `app.component.html` Angular boilerplate is never purged even when `app.component.ts` uses an inline template; researcher/planner should note to delete or ignore the HTML file to avoid future confusion.

### planner
- [adherence] The "≤12 files" cap conflicts with Angular's multi-file component conventions; the prompt should clarify the cap applies to meaningfully hand-crafted files, not generated scaffold boilerplate, to avoid ambiguity every run.
- [tokens] brief.json was fully read when only the handoff block of intake.out was needed first; prompt should reinforce "read handoff, then open brief.json only if gaps remain" to save ~300 tokens.

### deploy-test
- [adherence] Test script initially checked `Array.isArray(data)` on publications but the API returns a paginated dict — prompt should say "verify response shape matches blueprint definition, not assume array".
- [reuse] Publications endpoint shape (paginated vs. array) was only discoverable by reading the blueprint — prompt should require deploy-test to grep endpoint handlers for return type before writing assertions.
- [tokens] Re-running Playwright 3 times to debug one console error cost ~3 tool calls; prompt could say "capture all network 404s in first run before diagnosing console errors" to collapse debugging into one pass.
