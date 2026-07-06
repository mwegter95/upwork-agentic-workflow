# CLAUDE.md — Upwork Proposal Engine conventions

This file is the shared memory for every agent in this workflow. It exists so no
agent ever has to re-explore the repos to relearn the same facts. Read it once,
trust it, and only open source files when you need a detail that is not here.

If you discover a fact that future runs will need, append it here rather than
re-deriving it next time. Specialist detail lives in `reference/` playbooks (see
pointers below) so steps that never need it don't pay for it.

---

## Repo map (paths are relative to this folder)

```
upwork-agentic-workflow/   <- you are here (the workflow lives here)
../michaelwegter.com/      <- the portfolio site (Vite + React 18 + react-router, GH Pages)
../mw-backend/             <- Flask API served at https://api.michaelwegter.com
```

All three are sibling folders inside `~/Desktop/Projects/`.

---

## michaelwegter.com — the site

- **Stack:** Vite 6 + React 18 + react-router-dom 6. Plain CSS with custom
  properties (no Tailwind, no CSS-in-JS). Tests via Vitest + Testing Library.
- **Deploy:** push to `main` triggers `.github/workflows/deploy.yml`, which runs
  `npm run build` and publishes `dist/` to GitHub Pages. Custom domain
  `michaelwegter.com` (see `public/CNAME`). There is no manual deploy step — a
  merged push IS the deploy.
- **Routing:** `BrowserRouter`. SPA deep links survive on GH Pages via
  `public/404.html`. Routes live in `src/App.jsx`.
- **Anything in `public/` ships verbatim** to the site root in `dist/`. This is
  how demos get hosted (see "Demo hosting" below).
- **GitHub Pages 404 on `/work-samples/<slug>` is EXPECTED, not a defect.** The
  deep link has no physical file, so curl/HTTP returns 404; the `public/404.html`
  SPA shim renders it in a browser. Verify liveness via the real static path
  `/demos/<slug>/` (a true 200) or a browser/Playwright load. Never flag the
  deep-link 404 as a failure or retry curl against it.

### Existing work-sample pattern (the model to copy)

The `/apps` section already does exactly what `/work-samples` needs to do, so
clone its mechanics:

- `src/data/apps.js` — array of app objects. Cards, deep-dives, and the iframe
  route all read from this one registry.
- `src/pages/Apps.jsx` — renders the gallery (`MacDesktop`) + deep-dive readmes.
- `src/components/AppFrame.jsx` — full-viewport iframe shell used by the
  `/apps/:slug` route. It already handles loading state, an auth bridge, and
  content-height messaging. **Reuse it for `/work-samples/:slug` unchanged.**
- `src/components/Navbar.jsx` — top nav. Add a "Work Samples" link next to
  "Apps", "Experience", "Resume".

### App / work-sample registry schema

```js
{
  id: <number>,            // unique, sequential
  slug: "kebab-case",      // -> /work-samples/<slug>  and  /demos/<slug>/
  title: "Display Name",
  description: "One or two sentences, plain language.",
  category: "Utility" | "Creative" | "Productivity" | "Music" | "Data" | ...,
  status: "live",
  href: <demo URL>,        // for demos built here: import.meta.env.BASE_URL + "demos/<slug>/"
  color: "#rrggbb",        // pick from the palette below
  icon: "🧩",              // single emoji
  frameStyle: "baroque" | "walnut",
  tags: ["React", "Dashboard", ...],   // see "Work-sample tags" below
  screenshot: import.meta.env.BASE_URL + "work-samples/<slug>.png" | null,
}
```

`workSamples.js` adds these fields on top: `client`, `postingSummary`,
`builtFor`, `date` (ISO), `proposalDeckUrl`, `proposalPageUrl`.

### Work-sample tags (filterable on the /work-samples gallery)

The gallery has a tag filter: tags are grouped into sections (Frontend, Backend,
Data & Infra, AI, Auth & Security, Type & Features) defined by `tagSections` in
`../michaelwegter.com/src/data/workSamples.js`. Every registry entry carries a
`tags: [...]` array used to filter the cards.

Rules for the `tags` you put on a new entry:
- List the demo's ACTUAL stack (languages, frameworks, libraries it really uses,
  e.g. `React`, `Node.js`, `Flask`, `PostgreSQL`, `Tailwind CSS`, `Leaflet`)
  PLUS app-style/feature descriptors (e.g. `Dashboard`, `Landing Page`,
  `E-commerce`, `CRM`, `Maps`, `Full-Stack`, `Auth`-style tags like `JWT Auth`).
- Prefer an existing tag from `tagSections`. Only introduce a NEW tag when no
  current one fits, and when you do, ALSO add it to the correct section in
  `tagSections` (same edit) so the filter shows it. Keep tag labels canonical
  (match casing exactly: `Node.js`, `Next.js`, `JWT Auth`, `Data Viz`).
- 4 to 10 tags is the right range. Be accurate, not exhaustive.

### Work-sample card screenshot

Each card shows a hero still from `public/work-samples/<slug>.png` (16:9, scaled
to cover, top-aligned). The demo-builder captures it at build time (see its prompt)
and sets `screenshot: import.meta.env.BASE_URL + "work-samples/<slug>.png"`. If no
capture is produced, set `screenshot: null` and the card renders without an image.

### Demo design — do NOT copy michaelwegter.com's look

**Each demo gets its own design system, fit for the client's industry and the
style the posting asks for.** Do not reuse michaelwegter.com's tokens (the dark
"gallery-wall" theme, mustard/cyan palette, Space Grotesk / Inter / JetBrains
Mono). That look is the portfolio site's personality, not the client's. A
fintech tool, a pediatric clinic site, and a streetwear shop should look nothing
alike, and nothing like this portfolio.

How the design is decided:
- **researcher** gathers the client's real brand (their site/logo/colors if they
  exist) and the visual conventions of their industry and any competitors.
- **planner** defines a bespoke design direction for the demo: palette (with hex
  values), typography (real font families appropriate to the vibe), mood/tone,
  and layout style, derived from the brief + research + any requested style.
- **demo-builder** implements that design direction faithfully. Pull fonts from
  Google Fonts as needed; choose colors that fit the industry; match the
  requested aesthetic.

The proposal **one-pager and deck** should also be tailored to the client (lean
on the demo's design language), not styled like this portfolio.

The ONLY thing that keeps michaelwegter.com's styling is the `/work-samples`
gallery card + `workSamples.js` registry entry (that is the portfolio's own
chrome around the embedded demo) — that is handled by the site's components, not
by the demo's CSS, so you do not need the site palette anywhere in a demo.

---

## Demo hosting — the deployment model for this workflow

Demos built by this workflow are **same-origin static apps**, not separate
GitHub Pages repos. This is simpler, avoids cross-origin auth headaches, and
auto-deploys with the main site.

- Build the demo into `../michaelwegter.com/public/demos/<slug>/`.
- It is then served at `https://michaelwegter.com/demos/<slug>/` and iframed by
  the `/work-samples/<slug>` route via `AppFrame` with
  `href: import.meta.env.BASE_URL + "demos/<slug>/"`.
- **Default demo form:** a self-contained app — a single `index.html` plus
  local `assets/` (vanilla JS, or React/htm via CDN). No build step, no bundler
  config, zero deploy friction. Prefer this for most demos ("lean full" still
  fits here: a self-contained app can be fully functional).
- **When complexity warrants a bundler:** scaffold a small Vite app, set
  `base: '/demos/<slug>/'`, `npm run build`, and copy `dist/*` into
  `../michaelwegter.com/public/demos/<slug>/`. Keep the demo's own source under
  `upwork-runs/<slug>/demo-src/` (not committed to the site).

### Prototype vs full (the decision rule — lean full)

Build a full, functional demo by default. Fall back to a lighter prototype only
if ANY of these trip, and record which one in `plan.md`:

1. The hero feature needs a backend integration that cannot be safely stubbed
   within the run budget AND mw-backend cannot expose it cheaply.
2. The estimated build breaks the caps below.
3. The concept is inherently throwaway/visual (a mockup communicates it better
   than a half-built app).

A "prototype" here still clicks and demos one real flow with mock data. It is
never just static images.

### Image manifest (feeds the zero-token image gate)

At build time, demo-builder writes `image-manifest.json` in the run directory
(next to `build-report.md`): a JSON array with one entry per UNIQUE raster image
the demo shows — `{ "asset": "<path or URL>", "claim": "<the alt/label/product
name it must depict>", "source": "<stock source + keywords/photo-id>" }`. Write
an empty array `[]` when the demo genuinely shows no raster images (intentional
SVG icons/logos don't count). The engine's image gate reads this file: an
affirmatively empty manifest skips the whole image QA section, so accuracy here
directly saves tokens. image-analyzer starts from this manifest instead of
re-deriving it.

---

## mw-backend — the API

- **Stack:** Flask 3 + flask-cors, JWT auth (PyJWT + bcrypt), SQLite at
  `data/mw.db`, served by waitress. Deployed per `DEPLOYMENT.md` to
  `https://api.michaelwegter.com`. Playwright, BeautifulSoup, spotipy, Pillow,
  Google API client are already installed (see `requirements.txt`).
- **Structure:** `server.py` is the entry point and registers feature
  blueprints (e.g. `spotify_blueprint.py`, `apple_music_blueprint.py`). To add a
  demo endpoint: create `<feature>_blueprint.py`, register it in `server.py`,
  keep CORS open for the site origin, and do NOT touch auth, the DB schema, or
  existing blueprints unless the demo truly needs it.
- **Use the backend whenever a project needs or benefits from it** (auth, a real
  DB, real integrations, server-side compute). If the demo needs login, seed a
  demo/test account and record the credentials so the live test can log in. Keep
  frontend-only with mock data for simple demos that gain nothing from a server.
- **Deploy mechanism in one line:** committed mw-backend code ships by `git
  push` from this Mac; the Surface auto-deploy restarts Flask in ~20–30s. The
  `/run/exec` Surface runner is ONLY for host-level work (separate services,
  installs, Docker) — never for shipping committed Flask code.

**READ `reference/backend-playbook.md` BEFORE any backend work.** It holds the
full operating manual: push-vs-runner decision detail, verifying Flask is really
up (and recovering it), the Surface runner + registering services so they stay
up, the Flask bridge pattern, Node-on-Windows scaffold gotchas, the sacred
Cloudflare tunnel config, and every WordPress-Docker gotcha. This applies to
demo-builder, deploy, deploy-test, and any CEO reviewing backend work. Steps
that don't touch the backend should NOT read it.

### Local-verify scripts (Playwright, capture, screenshots) — fixed conventions
Any step running Node locally (capture, deploy/local test, screenshots, CEO/eval
verification scripts) must:
- Name scripts `.mjs` (this workspace `package.json` has `"type": "module"`; a
  `.js` file using `require()` crashes on first run).
- Run with the `upwork-agentic-workflow` folder as cwd so its local
  `node_modules` Playwright import resolves; a `/tmp` script fails to resolve it.
- Before handing captured frames downstream, assert they are DISTINCT (unique
  MD5s) and non-trivial (`>~50KB`); byte-identical or ~15KB PNGs are blank
  captures (usually a wrong serve root) and get the run looped back.

## Self-improvement (improvements.md + the optimizer step)

Every step should briefly watch its own work and, **only when it noticed
something concrete**, append at most 3 one-line suggestions to
`improvements.md` in the run directory (next to the output files), under a
`### <stepId>` heading, each tagged with one of:

- `[adherence]` — where the prompt was unclear, mis-followed, or produced
  lower-quality output than intended.
- `[tokens]` — where the step wasted tokens (re-reading files, restating context,
  verbose output) and how the prompt could prevent it.
- `[reuse]` — setup that should be cached/declared as a prerequisite instead of
  redone every run (e.g. "Playwright was installed mid-run — make it a setup
  step").

Keep each suggestion to one sentence and skip the file entirely if there is
nothing worth saying — this must stay cheap. The final `prompt-optimizer` step
(with-ceo layout) reads `improvements.md` and applies the safe ones back into the
agent prompts.

## Improve mode (the /upwork-proposal-improve command and the studio "Improve" run)

An improve pass re-runs the SAME run with new requirements instead of starting
fresh. Everything from the first run is already on disk in `upwork-runs/<slug>/`
(and the demo + live backend are deployed). The contract for every agent in an
improve pass:

- **Reuse, don't rebuild.** Read the existing artifact and its `## handoff` block;
  open the full file only when the change requires it. Never regenerate content
  that the new requirement doesn't touch.
- **Smallest possible change.** Edit files in place (use Edit, never rewrite a
  whole file for a small change). Big changes are allowed when truly required, but
  do them as surgically and briefly as possible.
- **Versioned outputs.** Write your output to the next version rather than
  overwriting: `plan.md` → `plan2.md`, `deploy.out` → `deploy2.out`, `<id>.out` →
  `<id>2.out` (increment the highest existing). This preserves history and lets
  later passes diff. (In the studio, the engine assigns these versioned paths for
  you and feeds each step the latest version of its inputs.)
- **Minimal blast radius.** Only the phases the change touches should run; an
  unaffected step writes one line ("unaffected") and passes through. The demo's
  live site + backend must keep working — redeploy/retest only what changed.
- **Token discipline is paramount here.** Everything is in place, so a second run
  should be cheap: no re-exploration, no restating context, no full-file dumps,
  dense output, and a short `## handoff` block covering only what changed.

## Deploy + live test (deploy and deploy-test steps)

- **Deploy = push, both repos.** The `deploy` step commits and pushes
  `michaelwegter.com` (GitHub Pages auto-builds the site) and, if a blueprint was
  added, `mw-backend` (the Surface auto-deploy watcher restarts the API within
  ~30s). No step should SSH to or restart the Surface; pushing is the deploy.
  After pushing, `deploy` verifies the live URLs are up (site 200,
  `api.michaelwegter.com/health` ok — see the backend playbook for what a
  healthy Flask response looks like).
- **deploy-test = exercise the LIVE deployment.** The `deploy-test` step (a check
  node) runs Playwright against the real deployed site and API, including login
  and multi-step workflows, and emits `VERDICT: pass|fail`. A fail loops back to
  `demo-builder` to fix and redeploy. This runs BEFORE `media-capture`, so media
  and the proposal are built on a verified-live demo.
- Recommended order when a project has a backend or a live deployment matters:
  `... -> demo-builder -> deploy -> deploy-test -> media-capture -> ...` (load the
  `with-deploy` layout in the studio).

---

## Feature richness + the CEO (supervisor)

- Every run carries a target **feature richness (1 to 10)** set by a slider in the
  studio and injected into the prompts of the steps that scale or judge ambition.
  Planner and demo-builder must scale ambition to it: 10 = a genuinely
  full-featured, production-quality app with several working features; 5 = a
  solid focused app; 1 = a minimal prototype. Build real functionality to the
  requested level.
- The **CEO** is a `supervisor` node (agent `ceo`), the supervising partner.
  Pair it after planner and after demo-builder. It reviews the work against the
  brief + feature level and either: passes; loops back to its partner with notes
  (back-and-forth until right); or issues `REDIRECT: <stepId>` + `NOTE:` to re-run
  an earlier step out of order with new direction, after which the engine resumes
  at the CEO's position (a detour, the in-between steps are not re-walked). Loops
  and redirects are bounded by the per-node retry cap.
- Use the `with-ceo` layout in the studio for this pattern (`with-ceo-v2` adds
  parallel proposal writers + a targeted proposal-fixer loop).

---

## Token-budget rules (every agent follows these)

These are not suggestions. Blowing the budget is a failure mode the workflow is
explicitly designed to avoid. Each step already runs as its own isolated query
(small context), so spend tokens only on this step's real work.

1. **Output discipline.** Ultra-concise, high-density. No preamble, no filler, no
   restating the instructions, no narrating what you are about to do, no polite
   wrap-ups. Every token should carry technical signal.
2. **Surgical edits.** To change a file, edit only the lines that change (use
   Edit). Never rewrite a whole file for a small change. This is the single
   biggest token waster, do not do it.
3. **Read narrowly, read handoffs first.** Use Grep/Glob + targeted `Read` with
   offsets. Read each upstream output's `## handoff` block first (see below) and
   open the full file only if you actually need more. Never cat a whole large
   file to find one thing.
4. **Disk is memory; pass paths, not contents.** Write to `upwork-runs/<slug>/`.
   Do not paste file contents back into your messages.
5. **Reuse, don't regenerate.** Clone an existing app/blueprint's structure
   instead of writing boilerplate from scratch (but design the UI fresh).
6. **Respect the caps.** Per run: 1 hero feature + at most 2 supporting; demo
   touches at most ~12 files; build timeout 3 min; retries capped per node; web
   research capped at ~6 fetches.
7. **Right-size the model.** It is already set per node (haiku for cheap phases,
   sonnet for mid, opus/inherit for heavy). Do not request more.
8. **Read the specialist playbook only when your step needs it.** Backend /
   Surface / WordPress detail lives in `reference/backend-playbook.md`; only
   backend-touching steps open it.

### Handoff blocks (lightweight provenance + compression)

Every step ends its output file with a compact block:

```
## handoff
- produced: <what this step made, 1 line>
- decisions: <key choices the next step must respect>
- next needs: <what the next step should focus on>
- risks: <anything unresolved>
```

It is the provenance trail (debuggable chain of what each step did) AND it lets
downstream steps act on a few lines instead of re-reading large files. Keep it to
4 to 6 short bullets. Check nodes (eval/CEO) still end with their `VERDICT:` line.

---

## Writing rules (hard)

- **No em dashes and no en dashes anywhere.** Use commas, periods, or rewrite the
  sentence. This applies to the cover letter, deck, one-pager, and all prose.
- Write in Michael's voice. See `reference/brand-voice.md`.
- Address the client's stated requirements explicitly and concretely. No generic
  filler, no buzzword soup. Reference the live demo by name and link.
- **Michael's GitHub handle is `mwegter95`** (github.com/mwegter95). Never write
  `github.com/michaelwegter` — it 404s. Any agent emitting a GitHub URL must use
  `mwegter95` (confirm via `gh auth status` if it has Bash).

---

## Definition of done (hard gates — the evaluator enforces these)

A run is only "done" when ALL of these hold:

1. Every explicit requirement in `brief.json` is addressed in the cover letter
   AND represented in the demo or deck.
2. The demo builds and loads with no console errors on first paint.
3. The demo URL (`/demos/<slug>/`) resolves locally, and after deploy the live
   `/work-samples/<slug>` route returns 200.
4. The demo link appears in both the cover letter and the deck.
5. Demo, one-pager, and deck use a cohesive, bespoke design fit for the client's
   industry and requested style (NOT michaelwegter.com's look), and contain no
   em/en dashes.
6. `eval-report.md` (or, in layouts that use CEO/eval check nodes instead, the
   passing `*-ceo.out` / `*-eval.out` files) exists with a passing score and an
   empty (or accepted) fix list.
