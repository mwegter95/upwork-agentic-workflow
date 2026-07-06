# Backend playbook — Surface runner, deploys, Flask recovery, WordPress

Read this ONLY when your step touches the backend: building or deploying a
blueprint or service, verifying the live API, standing up a Node/Docker service,
or a WordPress demo. Steps that never touch mw-backend do not need this file.
(Referenced from CLAUDE.md "mw-backend".)

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

## Verifying Flask is actually running (not a managed service)

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

## Port conflicts from long-running Surface scripts

When a script run via `/run/exec` times out, it now kills the entire process tree
(including any services it spawned). This prevents demo backends from accumulating
on the Surface and squatting ports. If you start a service via the runner without
registering it in `services.json`, it will be killed on the next timeout — always
register services with `scripts/surface_register_service.py` so `run-server.ps1`
owns and restarts them.

## Node service scaffold gotchas (bake these in, do not rediscover per run)

The Surface is Windows on Node 22+. Two issues have cost mid-run fix scripts on
multiple runs — set them as defaults in any Node backend scaffold:

- **SQLite:** `better-sqlite3` fails to install (gyp native compile breaks on
  Node 22+ Windows). Use the built-in `node:sqlite` (or a pure-JS store) instead.
- **HTTP fetch:** do NOT set a manual `Accept-Encoding` header with `node-fetch`
  v2 (brotli is unsupported and throws "Invalid response body", surfacing as a
  502 on the bridged endpoint). Prefer Node 22+ global `fetch`.

## Cloudflare tunnel config is sacred — NEVER touch it

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
