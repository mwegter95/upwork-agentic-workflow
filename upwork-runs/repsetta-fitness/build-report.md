# Build Report — Repsetta (repsetta-fitness)

## What was built

A real React Native app (Expo SDK 51 + react-native-web + NativeWind v4),
exported to static web and embedded in the site's `/work-samples` route. Three
screens, navigated by local React state (no Expo Router, so no subpath 404s):

- **Today (Home, entry point):** fetches today's guided program (Push Day A) and
  renders the target exercises with a Start Session CTA that seeds the logger.
- **Log Workout (HERO):** pick an exercise from the catalog, add sets with reps +
  weight, each logged set auto-starts a live rest timer (setInterval countdown
  with an SVG progress ring, pause/+15s/skip, Web Audio cue at zero), then Save
  persists the session to the backend.
- **Progress:** workout history list + summary stat cards (workouts, streak,
  total volume) + a volume-per-session bar chart drawn with react-native-svg (no
  chart lib).

Styled with NativeWind v4 (Tailwind v3) using the site design tokens: mustard
accent (#e8b820), dark surfaces (#121118 / #1e1c26), text #f2ede4, mono labels.
It reads as part of michaelwegter.com.

## Hero feature status

PASS. Pick exercise -> log sets (reps + weight) -> live rest timer -> Save ->
persisted to backend -> appears in Progress. Verified end-to-end via a headless
Playwright run against the local Flask server: the POST created workout id 5 in
SQLite, then the app fetched /progress, with zero page errors.

## Local preview

- Demo (built, committed-to-site path):
  `/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/demos/repsetta-fitness/`
- Serve + open:
  `cd ../michaelwegter.com/public && python3 -m http.server 8099`
  then `http://localhost:8099/demos/repsetta-fitness/`
- App source (not committed to the site):
  `upwork-runs/repsetta-fitness/demo-src/`
- Local mock backend (Stage A): `upwork-runs/repsetta-fitness/mock-backend/`
  run with `/Users/michaelwegter/miniconda3/bin/python app.py` (port 5005).

## Build status + time

- `npx expo export --platform web`: SUCCESS. Warm export ~3.4s (cold first
  export ~ under 1 min after deps installed). Output: 1 JS bundle (~562 kB) +
  1 compiled Tailwind CSS (10.8 kB) + index.html. Well within the 3-min cap.
- `experiments.baseUrl = "/demos/repsetta-fitness"` set in app.json; all asset
  paths in index.html are correctly prefixed and resolve 200 under the subpath.
- `npm run build` for michaelwegter.com: PASS (~0.7s, 44 modules). The demo
  ships verbatim into `dist/demos/repsetta-fitness/`.

## API client behavior

`demo-src/app/api/client.js`:
- Committed default `API_BASE = "https://api.michaelwegter.com"`.
- Network is attempted ONLY when the page is served from michaelwegter.com (the
  CORS allow-listed origin) OR when `window.__REPSETTA_API_BASE__` is set (used
  for self-test against local Flask). Any other origin (bare localhost preview,
  offline iframe, pre-deploy) uses bundled seed data from `mockSeed.js`. This
  guarantees no console / network errors on first paint regardless of backend
  state, and a real round-trip in production where the endpoint and CORS exist.
- Every fetch is also wrapped in try/catch with a seed-data fallback.

## Files changed / added

### michaelwegter.com (committed to the site repo by the orchestrator later)
- `public/demos/repsetta-fitness/` (new) — exported static demo (index.html,
  favicon.ico, metadata.json, `_expo/static/js|css/...`).
- `src/data/workSamples.js` (edited) — added entry id:3 (see below).

### Demo app source (NOT committed to the site)
`upwork-runs/repsetta-fitness/demo-src/` — 10 app source files plus Expo
boilerplate config:
- `App.jsx` (root + tab nav shell)
- `app/screens/HomeScreen.jsx`, `WorkoutLogScreen.jsx` (hero), `ProgressScreen.jsx`
- `app/components/RestTimer.jsx`, `ExercisePicker.jsx`, `SetRow.jsx`, `Charts.jsx`
- `app/api/client.js`, `app/api/mockSeed.js`
- config: `app.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`,
  `global.css`, `index.js`, `package.json`

### Local mock backend (Stage A, NOT committed anywhere)
- `upwork-runs/repsetta-fitness/mock-backend/app.py` — standalone Flask server,
  mirrors the production blueprint, uses a LOCAL sqlite file
  `mock-backend/repsetta.db` (mw.db is never touched).

## mw-backend files staged but UNCOMMITTED (do not push here)

These two edits are written into the mw-backend repo but left uncommitted on
purpose. The orchestrator pushes at the very end and notifies Michael to restart
the Surface server.
- `../mw-backend/repsetta_blueprint.py` (NEW) — production blueprint, clones
  spotify_blueprint structure. Owns a new `repsetta_workouts` table in
  `data/mw.db` via CREATE TABLE IF NOT EXISTS, seeds demo history on first call.
  Does not touch auth, the schema, or any existing table/blueprint. Imports
  cleanly (verified).
- `../mw-backend/server.py` (EDITED, ~line 265) — added two lines:
  `from repsetta_blueprint import repsetta_bp` /
  `app.register_blueprint(repsetta_bp)`, next to the apple_music registration.

Note on CORS: research stated mw-backend CORS was globally open. It is actually
an allow-list (`_CORS_ORIGINS`, server.py ~line 64) that already includes
`https://michaelwegter.com`. The deployed demo origin is therefore allow-listed
and production fetches will succeed with no CORS errors. No CORS change needed.

ACTION REQUIRED AFTER PUSH: restart the waitress server on the Surface so the new
blueprint is registered, before live `/work-samples/repsetta-fitness` validation.

## Registry entry added (workSamples.js)

```
id: 3, slug: "repsetta-fitness", title: "Repsetta",
category: "Productivity", status: "live",
href: import.meta.env.BASE_URL + "demos/repsetta-fitness/",
color: "#12b4c8", icon: "🏋️", frameStyle: "walnut",
client: "Repsetta (Upwork)",
builtFor: "Hybrid Mobile App Developer for Fitness Startup (Upwork)",
date: "2026-06-12",
proposalDeckUrl: "demos/repsetta-fitness/proposal/deck.pdf" (placeholder),
proposalPageUrl: "demos/repsetta-fitness/proposal/one-pager.pdf" (placeholder)
```

## Self-test results

1. **Expo export succeeds:** PASS. Warm export ~3.4s. Asset paths correctly
   prefixed with `/demos/repsetta-fitness/`.
2. **Loads under subpath, no console errors on first paint:** PASS. Served the
   site `public/` dir; index.html, JS bundle, and CSS all return 200 under the
   subpath. Playwright smoke run: "ok, no console errors". Visible text confirms
   the Today screen renders real content (Push Day A program, exercises, tab bar).
3. **Real round-trip through local Flask:** PASS. With the mock server on port
   5005, a Playwright-driven hero flow (add exercise -> fill weight/reps -> Log
   -> Save) produced a POST that persisted to SQLite (workout id 5) and a
   follow-up /progress fetch, zero page errors. Raw curl round-trip also
   confirmed: GET exercises/program/workouts/progress + POST workouts all 200.
4. **Graceful fallback with backend offline:** PASS. At a non-production origin
   the client uses bundled seed data; the app renders the full program with zero
   console errors and never shows a blank screen.

## Failures / issues encountered (all resolved)

- NativeWind `^4.0.36` resolved to 4.2.5, whose css-interop babel requires
  `react-native-worklets/plugin` (absent on SDK 51) and broke the export. Fixed
  by pinning `nativewind` to exactly `4.0.36` (css-interop 0.0.36).
- The NativeWind metro transform writes compiled CSS to
  `node_modules/.cache/nativewind/`, which must pre-exist. Created it before
  export. (On a fresh `npm install` this dir must be created again before the
  first export.)
- Needed `@expo/metro-runtime` for web export; added to dependencies.

No outstanding failures.
