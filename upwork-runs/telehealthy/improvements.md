### deploy-test
- [reuse] Playwright + Chromium installation should be a declared prerequisite (pre-warmed) — confirming browsers are installed adds a cold-start step on every run.
- [adherence] The deploy handoff's "next needs" block should specify the exact button selector/text and timeout values found by the demo-builder, so the test script doesn't need to probe button labels heuristically.

### media-capture
- [reuse] Playwright video recording pattern (newContext with recordVideo option + file rename) should be cached as a template snippet — the API is non-obvious and rediscovery cost is real across runs.
