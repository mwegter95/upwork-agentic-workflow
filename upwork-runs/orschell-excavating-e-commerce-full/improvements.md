### deploy-test
- [adherence] deploy.out handoff documented wrong test credentials (admin@orschell.com/admin123 vs actual admin@orschellsupply.com/Admin1234!) — deploy step should echo the exact credentials it verified, or deploy-test should read demo-builder.out for credentials rather than trusting deploy.out.
- [reuse] Playwright require() fails in ESM context (package.json type:module) — test script should always be written as .cjs or use dynamic import() to avoid the rename step.

### demo-builder
- [tokens] The build script generation (gen_build_script.py) required two iterations due to Windows npm.cmd discovery — prompt should pre-state "use npm.cmd on Windows subprocess calls" to avoid the retry.
- [reuse] The Surface npm/tsc build pattern is identical across runs — extract it as a shared helper function in the runner script template so demo-builder doesn't re-derive the Windows subprocess invocation each time.

### deploy-test
- [adherence] deploy.out handoff block should include the exact demo credentials shown on the login page, not internal seeding assumptions — downstream test can't log in otherwise.
- [reuse] Cart API uses snake_case `product_id` and route `/cart/items` while deploy.out implied `/cart` with camelCase; document API field names in the handoff to avoid probe loops.
- [tokens] Playwright `button:has-text(...)` CSS selector syntax is unreliable across Playwright versions; default to `page.get_by_text()` or `page.locator('button').filter(has_text=...)` to avoid silent test failures.

### image-analyzer
- [tokens] For e-commerce image QA, API-level verification (curl HEAD + jq product payload) is cheaper than Playwright; when images are served as JSON product data, verify via API before attempting browser automation.

### media-capture
- [tokens] Admin tab buttons have no unique role/class selector (all labeled by emoji + text); iterating through all buttons to match text works but is fragile. Future: have demo-builder add data-testid attributes to tab buttons (e.g., data-testid="tab-products") so media-capture can use direct selectors.
