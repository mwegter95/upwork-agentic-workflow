
### planner
- [adherence] Intake silently dropped Michael's explicit "Next.js" + "true PHP routed through Python" stack; intake prompt should preserve explicit stack asks verbatim so planner doesn't have to re-assert them.

### demo-builder
- [adherence] researcher pinned a Poly Haven texture URL that 404'd and an npm @imgly import that Next SWC can't bundle (onnxruntime parse error); researcher should CORS-check asset URLs and prefer CDN `+esm`/webpackIgnore for WASM-heavy libs instead of a bare npm import.
- [reuse] Playwright self-test needs the site public dir served (python http.server 8899); make that serve+kill a declared setup helper instead of re-scripting it per run.

### demo-builder3
- [adherence] For 3D garment demos, author the final draped mesh deterministically (tools/sculpt.mjs pattern) instead of running cloth dynamics; the sim path burned ~10 iterations on physics triage before pivoting.
- [reuse] Sandbox headless rendering needs one-time setup (playwright headless-shell via resumable node downloader + libXdamage in ~/lib, swiftshader flags); make it a declared prerequisite instead of rediscovering per run.
- [tokens] Screenshot harness must launch one browser per view with retry (tools/shot.mjs); shared-context swiftshader crashes otherwise waste debugging rounds.
