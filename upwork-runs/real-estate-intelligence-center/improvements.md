### deploy-test
- [adherence] Test filled the textarea before clicking Run — the prompt should note that demo input fields may be blank on load and the hero flow must fill them first, otherwise run returns early silently.
- [reuse] Playwright import path is rediscovered every run (`find node_modules/.bin/playwright`); bake the `upwork-agentic-workflow/node_modules/playwright/index.mjs` path as a constant in the deploy-test prompt to save two lookup steps.

### demo-builder
- [adherence] Researcher provided exact canned response objects — embed them as a named const block rather than inline in the CANNED array to make per-engine rotation logic more readable and testable.
- [tokens] Output schema string literals (e.g. "string - the post body text") in schema objects waste context in LLM system prompts; move schema to a compact JSON comment or separate schema file and pass just the keys to the model.
- [reuse] Post-build em/en dash pass (perl -i) is needed every run because the canned responses and comment strings introduce them; enforce via a pre-write linting step or strip them at write time rather than a post-build fix script.
