### image-analyzer
- [tokens] Playwright and curl both blocked by Anubis on unsplash.com; prompt should note that Unsplash metadata retrieval requires an authenticated API key (UNSPLASH_ACCESS_KEY env var) or a pre-cached provenance JSON file written by the demo builder, saving the multi-attempt dead-end.
- [adherence] When builder intentionally uses cityscape images as "view context" gallery fillers (sky1/sky2/sky3), the brief's requirement that "images should be of properties" is technically violated; builder should be instructed to use only residential images even in gallery secondary positions, or explicitly flag skyline-filler as accepted deviation.
- [reuse] The image-views/ download step (image-view.mjs) re-runs Playwright 25 times per run; if images can be cached across runs for the same Unsplash IDs, this would save significant time.

### image-fixer
- [tokens] LoremFlickr multi-keyword comma queries return a single fallback image (all same MD5); prompt should warn that only single-keyword LoremFlickr queries reliably return distinct, keyword-matched images, saving 2 wasted download attempts.
- [adherence] Brief requires "images of properties, houses, condos etc." but builder intentionally placed cityscape gallery images -- prompt should instruct builder to flag intentional non-property gallery images in a dedicated comment so fixer knows they are deliberate choices vs. oversights.

### image-eval
- [adherence] Prompt instructs "VISUALLY verify from pixels" but environment has no vision; env-constraint override (metadata method) should be stated more prominently in the prompt's first paragraph to avoid confusion on re-reads.
- [tokens] MD5 verification of LoremFlickr images is cheap and high-value; prompt should explicitly request MD5 cross-check against fixer's recorded values as a mandatory step, so no tokens are spent debating whether to do it.

### deploy-test
- [tokens] Initial test script wasted 2 runs guessing selectors; a DOM-dump-first pass before scripting (as the prompt requires) would have saved 1 full Playwright run.
- [adherence] Serving demo from subdirectory vs. `public/` root caused MIME errors on first run; prompt should explicitly state that the demo must be served from the repo `public/` root to match asset paths.
- [reuse] Python http.server should be a documented prerequisite step or wrapper script so deploy-test doesn't need to discover the correct serve command by trial and error each run.

### proposal-writer
- [tokens] The build-deck.py title slide had leftover draft code (theme_color=None, duplicate rect/image blocks) from iterative editing; prompt should instruct writer to test-run build-deck.py in a dry-run pass before finalizing, surfacing errors before the main write step.
- [adherence] pptx has no native transparency for shape fills, so the title slide hero image is hidden behind a solid overlay; prompt should note this limitation and recommend placing the hero image on slide 4 (demo slide) instead of the title, where it can be shown unobscured.

### final-ceo
- [adherence] DoD item 7 names `eval-report.md`, but the pipeline emits `build-ceo.out`/`image-eval.out`/`plan-eval.out`; either rename the gate file or update the DoD so the final CEO is not forced to reconcile a filename mismatch.
- [tokens] Playwright resolves only inside the `upwork-agentic-workflow` folder; scripts written to `/tmp` fail with ERR_MODULE_NOT_FOUND — prompt should say to place check scripts in the workflow dir to avoid the wasted first attempt.
