# CLAUDE.md — Upwork Proposal Engine conventions

This file is the shared memory for every agent in this workflow. It exists so no
agent ever has to re-explore the repos to relearn the same facts. Read it once,
trust it, and only open source files when you need a detail that is not here.

If you discover a fact that future runs will need, append it here rather than
re-deriving it next time.

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
}
```

`workSamples.js` adds these fields on top: `client`, `postingSummary`,
`builtFor`, `date` (ISO), `proposalDeckUrl`, `proposalPageUrl`.

### Design tokens (from `src/index.css` `:root`) — use these everywhere

Deck, one-pager, and demo must look like they belong to this site.

```
Palette
  --mustard      #e8b820   (accent / primary)
  --cyan-vivid   #12b4c8
  --hot-pink     #f0186e
  --parrot-red   #e83828
  --parrot-green #6ed46a
  --sky-blue     #3a8fcc
Surfaces (dark theme)
  --bg-root      #121118   --bg-surface #191720   --bg-card #1e1c26   --bg-card-hover #24222e
Borders
  --border-subtle #201e2a  --border-default #2c2a38  --border-active #3a3848
Text
  --text-primary #f2ede4   --text-secondary #8a8898   --text-muted #4a4858
Accent
  --accent = --mustard
Fonts
  --font-display  'Space Grotesk', system-ui, sans-serif   (headings)
  --font-body     'Inter', system-ui, sans-serif           (body)
  --font-mono     'JetBrains Mono', 'Fira Code', monospace  (labels, eyebrows, code)
```

Visual character: dark gallery-wall aesthetic, ornate picture frames around app
cards, mono eyebrows in caps with letter-spacing, generous spacing, restrained
use of the bright palette as accents against the dark surfaces.

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

---

## mw-backend — the API

- **Stack:** Flask 3 + flask-cors, JWT auth (PyJWT + bcrypt), SQLite at
  `data/mw.db`, served by waitress. Deployed per `DEPLOYMENT.md` to
  `https://api.michaelwegter.com`. Playwright, BeautifulSoup, spotipy, Pillow,
  Google API client are already installed (see `requirements.txt`).
- **Structure:** `server.py` is the entry point and registers feature
  blueprints. Existing blueprints: `spotify_blueprint.py`, `apple_music_blueprint.py`.
  Each blueprint is a self-contained set of routes under a URL prefix.
- **To add a demo endpoint:** create `<feature>_blueprint.py` with a Flask
  Blueprint, register it in `server.py`, keep CORS open for the site origin.
  Mirror the structure of `spotify_blueprint.py`. Do NOT touch auth, the DB
  schema, or existing blueprints unless the demo truly needs it.
- **Use the backend whenever a project needs or benefits from it** (auth, a real
  DB, real integrations, server-side compute). Many proposals are stronger with a
  working backend, not just mock data. If the demo needs login, seed a demo/test
  account and record the credentials so the live test can log in. Keep
  frontend-only with mock data for simple demos that gain nothing from a server.

---

## Deploy + live test (deploy and deploy-test steps)

- **Deploy = push, both repos.** The `deploy` step commits and pushes
  `michaelwegter.com` (GitHub Pages auto-builds the site) and, if a blueprint was
  added, `mw-backend` (the Surface Pro runs an auto-deploy watcher that pulls and
  restarts the API within ~30s). No step should SSH to or restart the Surface;
  pushing is the deploy. After pushing, `deploy` verifies the live URLs are up
  (site 200, `api.michaelwegter.com/health` ok).
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
  studio and injected into every step's prompt. Planner and demo-builder must
  scale ambition to it: 10 = a genuinely full-featured, production-quality app
  with several working features; 5 = a solid focused app; 1 = a minimal prototype.
  Build real functionality to the requested level.
- The **CEO** is a `supervisor` node (agent `ceo`), the supervising partner.
  Pair it after planner and after demo-builder. It reviews the work against the
  brief + feature level and either: passes; loops back to its partner with notes
  (back-and-forth until right); or issues `REDIRECT: <stepId>` + `NOTE:` to re-run
  an earlier step out of order with new direction, after which the engine resumes
  at the CEO's position (a detour, the in-between steps are not re-walked). Loops
  and redirects are bounded by the per-node retry cap.
- Use the `with-ceo` layout in the studio for this pattern.

---

## Token-budget rules (every agent follows these)

These are not suggestions. Blowing the budget is a failure mode the workflow is
explicitly designed to avoid.

1. **Isolate heavy work.** Reading repos, browsing, building, capturing, and
   writing docs each happen inside a subagent. Return a short summary, not the
   raw material.
2. **Disk is memory.** Write intermediates to `upwork-runs/<slug>/`. Pass file
   paths between phases, never file contents.
3. **Read narrowly.** Use Grep/Glob then targeted `Read` with offsets. Never cat
   a whole large file to find one thing. This CLAUDE.md already contains most of
   what you would have gone looking for.
4. **Reuse, don't regenerate.** Clone the simplest existing app/blueprint as a
   scaffold instead of writing boilerplate from scratch.
5. **Respect the caps.** Per run: 1 hero feature + at most 2 supporting features;
   demo touches at most ~12 files; build timeout 3 min; reflection retries capped
   at 2; web research capped at ~6 fetches.
6. **Stream to files, not chat.** Deliverables are written to disk, never echoed
   back into the conversation.
7. **Right-size the model.** Cheap phases (intake, media capture, link checks,
   rubric scoring) run on a small model; plan/build/write run on the strong one.
   The model is set per agent in its frontmatter.

---

## Writing rules (hard)

- **No em dashes and no en dashes anywhere.** Use commas, periods, or rewrite the
  sentence. This applies to the cover letter, deck, one-pager, and all prose.
- Write in Michael's voice. See `reference/brand-voice.md`.
- Address the client's stated requirements explicitly and concretely. No generic
  filler, no buzzword soup. Reference the live demo by name and link.

---

## Definition of done (hard gates — the evaluator enforces these)

A run is only "done" when ALL of these hold:

1. Every explicit requirement in `brief.json` is addressed in the cover letter
   AND represented in the demo or deck.
2. The demo builds and loads with no console errors on first paint.
3. The demo URL (`/demos/<slug>/`) resolves locally, and after deploy the live
   `/work-samples/<slug>` route returns 200.
4. The demo link appears in both the cover letter and the deck.
5. Deck, one-pager, and demo use the design tokens above and contain no em/en
   dashes.
6. `eval-report.md` exists with a passing score and an empty (or accepted) fix
   list.
