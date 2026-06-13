# Build Plan — Repsetta (Hybrid Mobile App Developer for Fitness Startup)

Slug: `repsetta-fitness`

## 1. Demo concept (chosen)

**D1 — Workout Logger with Set/Rep Tracking and Rest Timer**, expanded into a
small but complete React Native fitness app.

D1 wins because it nails the exact thing a fitness startup hiring a mobile dev
wants to see: the core capture loop of their product. Logging exercises, sets,
reps, and weight with a live rest timer is the literal heartbeat of any workout
app, and it is the most input-dense, state-heavy screen in the domain. Pulling
it off in a real React Native + NativeWind app with a real backend round-trip
proves (a) hybrid framework depth (R4), (b) Android/iOS-from-one-codebase
capability (R2, R3, R5), (c) clean fitness UX (R15, implicit UX need), and (d)
backend integration (implicit API need) all in one artifact. D2 and D3 are good
but narrower: D2 is mostly a player UI, D3 is mostly read-only charts. We fold
the strongest slices of both (a guided "today's program" entry point and a small
progress view) in as supporting features, so D1 absorbs their value without their
full cost.

## 2. Prototype vs full

**Call: LEAN FULL.** A real, working Expo / react-native-web app with real flows
and a real backend round-trip. No prototype rule trips:

- Rule 1 (backend cannot be safely stubbed): does not trip. The backend is small
  and mw-backend can expose it cheaply (see section on staged backend). During
  the build the app talks to a local Flask server mirroring the mw-backend
  blueprint structure, so there is zero integration risk before the real push.
- Rule 2 (build breaks caps): does not trip if we keep dependencies minimal
  (see File budget + cap risks). Mitigation noted below.
- Rule 3 (inherently throwaway/visual): does not trip. This is a functional app,
  not a mockup.

**Why this is the CLAUDE.md "bundler when complexity warrants" path (explicit):**
The CLAUDE.md default is a single `index.html` + assets with no build step. That
default does NOT apply here because Michael's hard requirement is a REAL React
Native app styled with NativeWind. React Native + NativeWind cannot run as a
hand-written static file; it requires a bundler and a web-export step. Therefore
we take the documented bundler path:

- Build with **Expo + react-native-web + NativeWind**.
- `expo export --platform web`.
- Copy the export output into `../michaelwegter.com/public/demos/repsetta-fitness/`.
- Set the Expo web `baseUrl` / public path to `/demos/repsetta-fitness/` so
  assets resolve under the subpath when iframed.
- Keep the demo's own source under
  `upwork-runs/repsetta-fitness/demo-src/` (NOT committed to the site repo;
  only the exported static output ships).
- The site embeds it unchanged via `AppFrame` at `/work-samples/repsetta-fitness`
  with `href: import.meta.env.BASE_URL + "demos/repsetta-fitness/"`.

**mw-backend needed: YES, staged.** Frontend-only is the cheaper default, but
Michael has greenlit real backend wiring to prove API-integration capability
(an implicit requirement and a success signal). The staging plan (section 8)
keeps it safe.

## 3. Hero feature (1)

**Log a workout: pick exercises -> enter sets/reps/weight -> live rest timer,
persisted to the backend.**

This maps to the client's #1 demonstrable need: the core fitness capture loop in
a real hybrid app. The flow:

1. Start a workout (empty session or seeded from "today's program").
2. Add exercises from an exercise list fetched from the backend.
3. For each exercise, log sets with reps + weight; tapping "log set" appends a
   set row and auto-starts the **rest timer** (visual countdown ring, start/skip/
   add-time controls, audio/haptic-style cue on web).
4. Finish workout -> POST the full session to the backend; it appears in history.

## 4. Supporting features (at most 2)

- **(a) Today's program (guided session entry):** a single seeded program
  ("Push Day" etc.) fetched from the backend that pre-populates the workout
  logger with target exercises and target sets/reps. This folds in D2's value as
  an entry point to the hero flow, not a separate screen.
- **(b) Progress / history view:** a list of past workouts plus a few summary
  stats (total workouts, total volume = sum of weight x reps, current streak)
  and one simple bar/line trend rendered with lightweight SVG (no heavy chart
  lib). This folds in D3's value. Read-only, backed by `GET /repsetta/progress`.

## 5. Out of scope (explicit — deliberately NOT building)

- No real auth provider / login (a hardcoded demo user id is sent to the backend;
  no signup, no OAuth, no JWT UI). Auth is addressed in the cover letter, not
  demoed.
- No social feed, friends, sharing, or comments.
- No payments, subscriptions, or paywall.
- No Apple Health / Google Fit / HealthKit / wearable integration.
- No native-only modules that break web export (no react-native-reanimated heavy
  setups, no native camera/video, no push notifications, no native audio engine).
  Rest-timer "audio cue" uses a web-safe approach.
- No exercise video library / form-cue videos (D2's heavier half).
- No advanced analytics, PR detection beyond the simple stats above, or
  multi-week periodization.
- No offline-first sync / conflict resolution; the demo assumes the local/real
  backend is reachable, with a graceful in-memory fallback if a fetch fails.
- No iOS/Android store submission; cross-platform is asserted via the shared
  codebase and addressed in the deck/cover letter, not by shipping native binaries.

## 6. Tech approach

- **Framework:** Expo (managed) + react-native-web + NativeWind (Tailwind for
  RN). Single codebase; web export is the artifact the site iframes; the same
  source compiles to iOS/Android (the cross-platform proof point).
- **Navigation:** keep it minimal. A lightweight tab/stack with at most 3
  screens (Today/Log, Progress, History) using a single nav lib already pulled
  in by Expo, or simple local state switching if that avoids a dependency. Prefer
  fewer dependencies to protect the 3-minute export budget.
- **State:** React state + a small context for the active workout session and a
  thin `api.js` client. No Redux, no heavy state lib.
- **Charts:** hand-rolled SVG (react-native-svg, which Expo already supports) or
  simple View-based bars. No charting library.
- **Scaffold to clone:** there is no existing RN app in the repo to clone, so
  scaffold a minimal Expo app fresh and keep it tiny. For the BACKEND, clone the
  structure of `mw-backend/spotify_blueprint.py` (per CLAUDE.md) as the template
  for the new `repsetta_blueprint.py`.
- **Design tokens:** apply the CLAUDE.md palette via Tailwind theme config so the
  demo visually belongs to michaelwegter.com (mustard accent on dark surfaces,
  mono eyebrows, Space Grotesk / Inter / JetBrains Mono).

## 7. File budget (cap ~12 app source files)

Demo app source under `upwork-runs/repsetta-fitness/demo-src/` (the app's own
code; the Expo scaffold's generated config files do not count against the cap):

1. `app/App.jsx` (or `app/_layout` entry) — root + nav shell.
2. `app/screens/WorkoutLogScreen.jsx` — HERO: log workout + rest timer.
3. `app/screens/ProgressScreen.jsx` — supporting (b): stats + trend.
4. `app/screens/HistoryScreen.jsx` — supporting: past-workout list (may merge
   into Progress to save a file).
5. `app/components/RestTimer.jsx` — countdown ring + controls.
6. `app/components/ExercisePicker.jsx` — add-exercise list/modal.
7. `app/components/SetRow.jsx` — reps/weight input row.
8. `app/components/StatCard.jsx` + `TrendChart.jsx` — small SVG stat/trend
   (combine into one file if needed).
9. `app/data/api.js` — backend client (base URL swap: local Flask -> mw-backend).
10. `app/data/mockSeed.js` — local fallback data (exercises, seeded program).
11. `tailwind.config.js` — design tokens.
12. `app.json` / `metro`/`babel` config tweaks for web export + NativeWind.

Plus required Expo scaffold files (package.json, babel.config.js, etc.) which are
boilerplate, not counted but kept minimal.

Backend (separate budget, small): `repsetta_blueprint.py` (local copy during
build, then appended to mw-backend) + one-line registration in `server.py`.

## 8. Backend plan — two stages

**Stage A (build time, on the Mac): simulated/local backend.**
A small standalone Flask server runnable on Michael's Mac that mirrors the
mw-backend blueprint structure (clone `spotify_blueprint.py`'s shape). The app's
`api.js` points its base URL at `http://localhost:<port>` during development.
This lets the full app be built and validated end-to-end with no dependency on
the Surface machine. If even that server is not running, `api.js` falls back to
`mockSeed.js` so the demo never hard-fails.

**Stage B (end of run, on mw-backend): append, push, notify, validate.**
Only after the app is fully working against Stage A do we add the blueprint to
the real mw-backend repo, register it in `server.py`, push, and then **NOTIFY
Michael to restart the server on his Surface** before live `/work-samples`
validation. Switch `api.js` base URL to `https://api.michaelwegter.com`.

**Endpoints the new `repsetta` blueprint exposes (kept small):**

- `GET /repsetta/exercises` — exercise catalog (name, muscle group, equipment).
- `GET /repsetta/program/today` — the seeded "today's program" (target exercises
  + target sets/reps) for the guided-session supporting feature.
- `GET /repsetta/workouts` — list past workouts for the demo user (History).
- `POST /repsetta/workouts` — persist a completed workout session (HERO write).
- `GET /repsetta/progress` — aggregated stats (total workouts, total volume,
  streak, trend series) for the Progress view.

Demo user is a fixed id passed as a query param / header; no auth UI. Data stored
in the existing SQLite DB via a new table the blueprint owns (do not touch auth,
existing tables, or existing blueprints, per CLAUDE.md).

## 9. Requirement -> feature traceability matrix

| Req | Text | Where addressed |
| --- | --- | --- |
| R1  | Experience in Health & Wellness domain (nice-to-have) | Demo (fitness app) + cover letter (honest framing: engineering depth + genuine domain fit, no fabricated certs) |
| R2  | Mobile App Development expertise (must) | Demo: real Expo/React Native app |
| R3  | Android App Development expertise (must) | Demo (single RN codebase targets Android) + deck talking point on cross-platform |
| R4  | React Native and/or Flutter (must) | Demo: built in React Native + NativeWind; deck names the stack |
| R5  | iOS Development experience (nice-to-have) | Demo (same codebase targets iOS) + deck |
| R6  | Apache Cordova experience (nice-to-have) | Cover letter / proposal narrative (Cordova vs modern RN tradeoff), not demoed |
| R7  | Available <30 hrs/week (must) | Cover letter (availability statement) |
| R8  | Commit 6+ months (must) | Cover letter (long-term engagement statement) |
| R9  | Located in Las Vegas / Twin Cities, US-only (must) | Cover letter ONLY — honest acknowledgement, no fabrication; pivot to engineering depth + live demo. Not demoed. |
| R10 | Proposal Q: experience in Health & Wellness | Cover letter / proposal answer |
| R11 | Proposal Q: what interests you | Cover letter / proposal answer |
| R12 | Proposal Q: recent similar experience | Cover letter / proposal answer (references this live demo by name + link) |
| R13 | Proposal Q: certifications | Cover letter / proposal answer (honest: no formal fitness certs; emphasize engineering + relevant work) |
| R14 | Proposal Q: frameworks worked with | Cover letter + deck (React Native, Expo, NativeWind, Flask backend, etc.) |
| R15 | Build high-quality, user-friendly apps (must) | Demo: polished NativeWind UI, rest timer UX, design tokens |

Implicit needs coverage: single-codebase iOS+Android -> demo + deck; backend API
integration -> demo (live mw-backend round-trip); fitness product sense ->
hero + supporting features; clean UX -> design tokens; autonomy/long-term ->
cover letter; communication -> cover letter + deck quality.

Nothing in the brief is left unmapped.

## 10. Cap risks + mitigations

- **Expo web export can exceed the 3-minute build timeout.** Mitigation: keep
  dependencies minimal (no charting lib, no heavy animation lib, prefer
  react-native-svg which Expo bundles; avoid extra nav libs if simple state
  switching suffices). Pre-warm the Expo/Metro cache before the timed export.
- **Subpath asset resolution under `/demos/repsetta-fitness/`.** Mitigation: set
  Expo web `baseUrl`/public path explicitly and validate the export loads with no
  console errors when served from the subpath.
- **Backend availability during build.** Mitigation: Stage A local Flask +
  `mockSeed.js` fallback means the demo is never blocked on the Surface machine.
