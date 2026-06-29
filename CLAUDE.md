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

## Changing the backend: `git push` is the default; the runner is only for host work

There are TWO different ways to affect the backend. Most of the time you want the
first one — reach for the runner only when git genuinely can't do the job.

1. **Committed code in `../mw-backend`** — Flask blueprints, the bridge
   blueprints, `server.py`, `requirements.txt`. Deploy these the normal, reliable
   way: edit/add the file in `../mw-backend`, then `git add` + `git commit` +
   `git push` to `main` **from this Mac**. The Surface's `run-server.ps1`
   auto-deploy polls origin, pulls `--ff-only`, and **restarts Flask within
   ~20–30s** — then verify the live endpoint. Pushing is the expected, routine
   action here. Do NOT try to recreate, hot-patch, or copy committed Flask code
   onto the Surface through `/run/exec`; just commit and push and wait ~30s.

2. **Host-level work that is NOT in the repo** — installing Node/Postgres,
   building or starting a separate long-running service (e.g. a Node app), running
   DB migrations or seeds, and (re)starting / health-checking that service. This
   can't be git-deployed, so use the `/run/exec` runner (`scripts/surface_run.py`,
   `scripts/surface_register_service.py`).

So: a Flask blueprint or bridge = path 1 (push, wait ~30s, verify). A new Node
service = both — build/run it on the Surface via path 2, and its small Flask
bridge is committed via path 1. When a backend change isn't taking effect, prefer
re-checking the push/auto-deploy (path 1) over fighting `/run/exec`.

### Verifying Flask is actually running (not a managed service)

The correct Flask `/health` response is `{"ok": true, "status": "ok"}` or similar
Flask-shaped JSON. **If you see `{"service": "adverteyes-api"}` or any other
non-Flask response from `https://api.michaelwegter.com/health`, Flask is DOWN and
a managed service has grabbed port 5050.** Do not attempt to use `/run/exec` in
this state — it won't work.

To recover: push any mw-backend commit. The auto-deploy watcher restarts Flask,
and Flask's startup code now kills whatever is on port 5050 before binding. The
Surface will be healthy within ~30s of the push.

The `/run/exec` runner is only usable when Flask is healthy. Check
`https://api.michaelwegter.com/run/health` — if it returns
`{"ok": true, "enabled": true}` the runner is up. If it 403s or 404s, Flask is
down; push to recover first.

### Port conflicts from long-running Surface scripts

When a script run via `/run/exec` times out, it now kills the entire process tree
(including any services it spawned). This prevents demo backends from accumulating
on the Surface and squatting ports. If you start a service via the runner without
registering it in `services.json`, it will be killed on the next timeout — always
register services with `scripts/surface_register_service.py` so `run-server.ps1`
owns and restarts them.

### Node service scaffold gotchas (bake these in, do not rediscover per run)

The Surface is Windows on Node 22+. Two issues have cost mid-run fix scripts on
multiple runs — set them as defaults in any Node backend scaffold:

- **SQLite:** `better-sqlite3` fails to install (gyp native compile breaks on
  Node 22+ Windows). Use the built-in `node:sqlite` (or a pure-JS store) instead.
- **HTTP fetch:** do NOT set a manual `Accept-Encoding` header with `node-fetch`
  v2 (brotli is unsupported and throws "Invalid response body", surfacing as a
  502 on the bridged endpoint). Prefer Node 22+ global `fetch`.

### Cloudflare tunnel config is sacred — NEVER touch it

`~/.cloudflared/config.yml` on the Surface is owned exclusively by `run-server.ps1`.
**Deploy scripts, demo-builder scripts, and runner scripts MUST NOT modify this
file.** The tunnel ALWAYS routes 100% of traffic to Flask (:5050). Managed demo
services are exposed via Flask bridge blueprints (`/demos/<slug>/...`), not via
separate tunnel ingress rules.

`run-server.ps1` now enforces this automatically: `Normalize-TunnelConfig` runs at
startup and every 10 seconds, detects any ingress rule pointing to a non-Flask port
or any path-based routing, rewrites the config to Flask-only, and restarts the
tunnel within ~10s. This self-heals any accidental config corruption.

The only correct ingress in `~/.cloudflared/config.yml` is:
```yaml
ingress:
  - hostname: api.michaelwegter.com
    service: http://localhost:5050
  - service: http_status:404
```

## Surface runner — build and deploy real backends end-to-end, on your own

When a project needs a real backend beyond a Flask blueprint (a Node/Express
service, a worker, a real database), **you are expected to stand the whole thing
up yourself and get it live, with no human help.** You can: install runtimes,
build the service, start it so it stays running, write and register its Flask
bridge, push it, and verify the public endpoint responds. Do not stop at "the
backend is built" or leave steps for the user — a project that warrants a real
backend is not done until that backend is actually answering requests at
`https://api.michaelwegter.com/<prefix>/...`. (For simpler demos, a single Flask
blueprint or realistic mock data is still fine — use this when it genuinely helps.)

You run commands ON the Surface (the Windows machine hosting mw-backend) via:

```
python scripts/surface_run.py --lang python --file build_step.py   # prefer python on the Surface (Windows)
echo 'print("hi")' | python scripts/surface_run.py --lang python    # from stdin
```

It runs the script on the Surface and returns stdout/stderr + exit code, so you
get real success/failure and can iterate. Authenticated via `RUN_SECRET` in this
repo's `.env`. **Prefer `--lang python`** — the Surface is Windows and `bash` may
not be present. Scripts run in the runner's workspace dir by default, so build
everything there and use relative paths; keep scripts idempotent and check exit
codes.

### Playwright on the Surface (one-time setup, do not rediscover per run)
If a scraper/demo needs Playwright ON the Surface and a step returns
`playwright_available: false`, install the browser binaries once with
`python -m playwright install chromium` via the runner, then proceed. Treat this
as a prerequisite/setup step, not a per-run surprise to debug each time.

### Critical: start a service so it STAYS UP (and survives reboots)
The runner waits for your script to finish, so running `node server.js` directly
just blocks until timeout and is then killed. Do not start services yourself —
**register** them and let the Surface launcher own them. Copy
`scripts/surface_register_service.py`, set `NAME` / `CMD` / `ARGS` / `CWD` /
`PORT`, and send it with `python scripts/surface_run.py --lang python --file <your
copy>`. It records the service in `../mw-backend/data/services.json`;
`run-server.ps1` (always running on the Surface) is the sole launcher, so it
starts the service within ~10s, restarts it if it crashes, and relaunches it on
every reboot. The helper then polls the port and prints `LISTENING`. Build the
service first (install deps, compile) in the runner workspace, then register it.

### Expose it through Flask (the bridge)
api.michaelwegter.com is the tunneled Flask app, so a service on a loopback port is
reached publicly by adding a tiny bridge: copy
`../mw-backend/bridge_blueprint_template.py` to `<feature>_blueprint.py`, set its
`PREFIX` (public path) and `UPSTREAM` (`http://127.0.0.1:<PORT>`), and register it
in `server.py`. It reverse-proxies `/<prefix>/*` to the service — no per-project
proxy code. The bridge is the ONLY mw-backend change; the service itself lives in
the runner workspace, not the repo.

### End-to-end ownership (who does what)
1. **demo-builder** — installs runtimes + builds the service on the Surface (via
   the runner), registers it with `surface_register_service.py` and confirms
   `LISTENING` on `127.0.0.1:<PORT>`, then writes `<feature>_blueprint.py` +
   registers it in `server.py` (does NOT push). Records the service name, port,
   and bridge prefix in the build report.
2. **deploy** — commits & pushes the bridge in `../mw-backend`; the Surface
   auto-deploy restarts Flask within ~30s, bringing the bridge live. Re-confirms
   the service is up (re-send the register helper if not — it is idempotent), then
   verifies `https://api.michaelwegter.com/<prefix>/...` returns real data.
3. **deploy-test** — exercises the live, bridged endpoint as part of the QA flow.

Reboot durability is automatic: because the service lives in
`data/services.json`, `run-server.ps1` relaunches it after a reboot and restarts
it if it crashes. The service files live in the runner workspace; the only repo
change is the bridge blueprint.

## WordPress Docker demos (recurring gotchas — bake these in, do not rediscover)

A "real WordPress site the client can log into" IS achievable here via the Surface
runner: a WP + MySQL Docker container, exposed publicly through a Flask bridge
blueprint at `/demos/<slug>/...`. Do NOT treat GitHub Pages' static-only limits as
the ceiling when the user explicitly asks for a real WP/admin login — weigh the
user's stated implementation direction against the chosen host. Known issues:

- **Large Docker image pulls** exceed Cloudflare's ~100s (524) timeout if done
  inside a blocking runner script. Register the pull+start as a service so
  `run-server.ps1` owns it; do not block on the pull in a `/run/exec` call.
- **All runner scripts must be ASCII-only** (no Unicode/box-drawing in comments or
  embedded PHP) — Windows charmap encoding throws otherwise.
- **functions.php (and any WP PHP) must never use the `?>` closing tag** — a stray
  one leaks PHP source to the page. Hard rule for all WP theme builds.
- **Sub-path reverse proxy → canonical redirect loop:** add a `redirect_canonical`
  filter that suppresses the redirect when `REQUEST_URI` is `/`.
- **Admin login behind a sub-path bridge needs 3 filters**, not just `wp_redirect`:
  `wp_redirect` (outer URL + embedded `redirect_to`), `login_redirect` (post-submit
  destination), and `login_url` (the `auth_redirect` login URL).
- **The bridge must forward the canonical public Host header (not strip it) plus
  `X-Forwarded-Proto: https`**, use a no-redirect opener (never follow 302s — that
  silently drops WP auth cookies), and strip `accept-encoding` on the way out (if
  you strip `content-encoding` but not `accept-encoding`, the browser gets gzipped
  bytes with no encoding header = garbage). These belong in
  `bridge_blueprint_template.py`.
- **Self-test sub-pages through the canonical Host**, not just `/` — canonical
  redirects only break on non-root paths.

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
6. `eval-report.md` exists with a passing score and an empty (or accepted) fix
   list.
