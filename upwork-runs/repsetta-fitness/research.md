# Research — repsetta-fitness

## 1. Repsetta — Domain / Client Context

### Found (from web search)
- No public web presence, app store listing, social media, or news coverage was
  found for a company or product named "Repsetta" as of June 2026. The brand is
  not indexed by any search engine as a live product. The Upwork posting is the
  only known artifact.
- The client signals in brief.json confirm: early-stage startup, mobile-first,
  long-term partner search, budget-conscious ($50-85/hr posted). No product URL
  or app store link was provided in the posting.
- The name structure ("Reps" + likely "Setta" = Italian/Finnish for "set" or a
  portmanteau of "set" + "etta" suffix) strongly implies a strength-training /
  workout tracking product.

### Inferred (label clearly as inference, not confirmed facts)
Based on the competitive landscape of similar-named apps (RepCount, Reps & Sets,
RepFit, RepStack) and the posting's emphasis on fitness UX + hybrid mobile, the
most probable Repsetta feature set is:

1. **Set/rep/weight logging** -- core capture loop per exercise, per workout
   session. Standard in every competitor. Demo hero feature maps directly here.
2. **Exercise library / catalog** -- user selects from a list or searches for
   exercises by name/muscle group. Required to populate the logger.
3. **Rest timer between sets** -- ubiquitous in lifting apps; critical for UX
   differentiation. The plan already picks this as the hero UX moment.
4. **Workout programs / guided sessions** -- pre-built program templates (e.g.
   Push/Pull/Legs) that seed the logger with target exercises and target sets.
   Differentiates from simple free-form loggers.
5. **Progress dashboard / history** -- past workout list, personal records per
   lift, total volume over time, streak tracking. Table-stakes retention feature.
6. **User account / profile** -- auth, body stats, goals. NOT in the demo scope
   (hardcoded demo user per plan), but exists in any real product.

**Competitor reference URLs** (show what Repsetta likely competes with):
- [RepCount (2M+ users)](https://www.repcountapp.com/)
- [Reps & Sets (iCloud sync, Watch app)](https://repsandsetsapp.com/)
- [RepFit (App Store)](https://apps.apple.com/us/app/repfit-workout-gym-tracker/id6754660547)
- [RepStack (progressive overload)](https://apps.apple.com/us/app/repstack-gym-workout-tracker/id6759228538)

**Positioning note for the cover letter / deck:** Repsetta is entering a crowded
space where the competitive differentiator is usually (a) social/community layer,
(b) AI-driven progressive overload, or (c) coach-athlete workflow. The demo
should look polished enough to suggest awareness of this landscape.

---

## 2. Expo Web Subpath Export -- Confirmed Recipe

Source: [Expo Publish Websites docs](https://docs.expo.dev/guides/publishing-websites/) |
[Expo app.json config](https://docs.expo.dev/versions/latest/config/app/) |
[Expo Router v3 changelog](https://expo.dev/changelog/2024-01-23-router-3)

### The working recipe (production-only, as of SDK 51+)

1. **app.json** -- set `experiments.baseUrl` to `/demos/repsetta-fitness`:
   ```json
   {
     "expo": {
       "experiments": {
         "baseUrl": "/demos/repsetta-fitness"
       }
     }
   }
   ```
   This prefixes ALL bundled asset URLs with the subpath so they resolve
   correctly when served from `https://michaelwegter.com/demos/repsetta-fitness/`.

2. **Export command:**
   ```
   npx expo export --platform web
   ```
   Output lands in `dist/`. Copy `dist/*` into
   `../michaelwegter.com/public/demos/repsetta-fitness/`.

3. **SPA / iframe routing gotcha:** `experiments.baseUrl` is production-only --
   it has no effect during `expo start`. The iframe at
   `/work-samples/repsetta-fitness` will load `index.html` from the subpath, and
   that file will contain correct asset paths. However, direct-URL refresh of a
   deep route inside the Expo app (e.g. `/demos/repsetta-fitness/progress`)
   returns 404 on GH Pages because GH Pages doesn't know to serve index.html for
   that path. Mitigation already in CLAUDE.md: `public/404.html` on the main site
   handles this. For the Expo sub-app, keep navigation to local state switching
   (no Expo Router deep links), which avoids the refresh problem entirely.
   Confirmed by: [GitHub issue #33400](https://github.com/expo/expo/issues/33400)
   (baseUrl dropped on refresh in single-mode).

4. **Asset import rule:** images/fonts imported via `require()` or `import`
   resolve automatically. Any hardcoded URL string (e.g. a font CDN href) must
   manually prepend `process.env.EXPO_PUBLIC_BASE_URL` or just avoid subpath-
   sensitive absolute URLs. Prefer `require()` for all local assets.

---

## 3. NativeWind v4 -- Essential Setup for Expo Managed + Web

Source: [NativeWind installation docs](https://www.nativewind.dev/docs/getting-started/installation) |
[DEV Community complete guide](https://dev.to/arinvolkov/the-complete-guide-to-implementing-nativewind-styling-in-react-native-expo-47ch)

**Packages to install (pin these):**
```
npm install nativewind@^4.0.0 tailwindcss@^3.4.0
npm install --save-dev react-native-reanimated react-native-safe-area-context
```
Note: NativeWind v4 requires Tailwind CSS v3 (NOT v4). Do not install
tailwindcss@^4 -- it will break NativeWind.

**tailwind.config.js** (minimal, add design tokens here):
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        mustard:       "#e8b820",
        "cyan-vivid":  "#12b4c8",
        "hot-pink":    "#f0186e",
        "parrot-red":  "#e83828",
        "parrot-green":"#6ed46a",
        "sky-blue":    "#3a8fcc",
        "bg-root":     "#121118",
        "bg-surface":  "#191720",
        "bg-card":     "#1e1c26",
        "bg-card-hover":"#24222e",
        "text-primary":"#f2ede4",
        "text-secondary":"#8a8898",
        "text-muted":  "#4a4858",
      },
      fontFamily: {
        display: ["Space Grotesk", "System"],
        body:    ["Inter", "System"],
        mono:    ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
```

**global.css** (at project root, NOT inside app/):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**babel.config.js:**
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: ["nativewind/babel"],
  };
};
```

**metro.config.js:**
```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

**App entry** -- import global.css at the very top of App.jsx (before any
component imports):
```js
import "./global.css";
```

**Web-specific gotcha:** NativeWind v4 on web compiles Tailwind classes to real
CSS at build time. The `expo export --platform web` step runs the Tailwind CSS
processor automatically via metro. No separate `npx tailwindcss` CLI step is
needed. The `withNativeWind` metro wrapper handles it.

---

## 4. mw-backend -- Blueprint Clone Target

**File to clone:** `/Users/michaelwegter/Desktop/Projects/mw-backend/spotify_blueprint.py`

**Blueprint registration pattern** (from server.py lines 258-264):
```python
# At the bottom of server.py, after all inline routes:
from repsetta_blueprint import repsetta_bp
app.register_blueprint(repsetta_bp)
```

**Blueprint header pattern** (clone from spotify_blueprint.py lines 38-43):
```python
repsetta_bp = Blueprint(
    "repsetta",
    __name__,
    url_prefix="/repsetta",
)
```

**CORS:** Already open for `https://michaelwegter.com` via the global
`_CORS_ORIGINS` list at server.py lines 64-74. No per-blueprint CORS config
needed; the global `CORS(app, ...)` at line 187 covers all blueprints.

**Storage decision: use a new SQLite table, NOT a JSON file.**
- The existing `data/mw.db` SQLite DB is already used by all other features.
- A JSON file stored in `data/` would work for a demo but is fragile under
  concurrent requests and ignored by the existing backup/migration pattern.
- Per plan.md and CLAUDE.md: create a new table owned by `repsetta_blueprint.py`
  (e.g. `repsetta_workouts`, `repsetta_exercises`), do NOT alter existing tables.
- The blueprint should call `sqlite3.connect(DATA_DIR / "mw.db")` and run a
  `CREATE TABLE IF NOT EXISTS` on first request (same pattern as other blueprints).
- DATA_DIR resolves to `Path(__file__).parent / "data"` (from server.py line 45).

---

## 5. michaelwegter.com -- Registry and Scaffold Confirmation

**workSamples.js EXISTS** at:
`/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/data/workSamples.js`

It already has 2 entries (id 1 and id 2). The new repsetta-fitness entry should
use `id: 3`.

**AppFrame.jsx** at:
`/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/components/AppFrame.jsx`
Already imports from both `apps` and `workSamples` and resolves by `id` OR
`slug`. The `/work-samples/:slug` route will find the entry by slug. No changes
to AppFrame are needed.

**WorkSamples.jsx** exists at:
`/Users/michaelwegter/Desktop/Projects/michaelwegter.com/src/pages/WorkSamples.jsx`
It reads from `workSamples` array. Adding the entry to workSamples.js is
sufficient to surface it in the gallery.

**href pattern** (confirmed from workSamples.js line 35/56):
```js
href: import.meta.env.BASE_URL + "demos/repsetta-fitness/",
```

---

## 6. Sample / Seed Data for the Demo

The builder can paste this into `app/data/mockSeed.js` as the local fallback:

```js
export const EXERCISES = [
  { id: 1, name: "Barbell Bench Press",   muscle: "Chest",     equipment: "Barbell" },
  { id: 2, name: "Incline Dumbbell Press",muscle: "Chest",     equipment: "Dumbbell" },
  { id: 3, name: "Overhead Press",        muscle: "Shoulders", equipment: "Barbell" },
  { id: 4, name: "Lateral Raise",         muscle: "Shoulders", equipment: "Dumbbell" },
  { id: 5, name: "Tricep Pushdown",       muscle: "Triceps",   equipment: "Cable" },
  { id: 6, name: "Skull Crusher",         muscle: "Triceps",   equipment: "EZ Bar" },
];

export const TODAY_PROGRAM = {
  name: "Push Day A",
  exercises: [
    { exerciseId: 1, targetSets: 4, targetReps: 8,  targetWeight: 135 },
    { exerciseId: 3, targetSets: 3, targetReps: 10, targetWeight: 95  },
    { exerciseId: 5, targetSets: 3, targetReps: 12, targetWeight: 50  },
  ],
};

export const PAST_WORKOUTS = [
  {
    id: "w1", date: "2026-06-10", name: "Push Day A",
    sets: [
      { exerciseId: 1, reps: 8, weight: 135 },
      { exerciseId: 1, reps: 8, weight: 135 },
      { exerciseId: 1, reps: 7, weight: 135 },
      { exerciseId: 3, reps: 10, weight: 95 },
      { exerciseId: 3, reps: 9,  weight: 95 },
      { exerciseId: 5, reps: 12, weight: 50 },
    ],
  },
  {
    id: "w2", date: "2026-06-08", name: "Push Day A",
    sets: [
      { exerciseId: 1, reps: 8, weight: 130 },
      { exerciseId: 1, reps: 7, weight: 130 },
      { exerciseId: 3, reps: 10, weight: 90 },
      { exerciseId: 5, reps: 12, weight: 45 },
    ],
  },
  {
    id: "w3", date: "2026-06-05", name: "Push Day A",
    sets: [
      { exerciseId: 1, reps: 8, weight: 125 },
      { exerciseId: 3, reps: 9, weight: 85  },
      { exerciseId: 5, reps: 10, weight: 45 },
    ],
  },
];

export const PROGRESS = {
  totalWorkouts: 3,
  totalVolume: 18240,  // lbs (sum of weight * reps across all sets)
  currentStreak: 3,
  trend: [
    { date: "2026-06-05", volume: 3750 },
    { date: "2026-06-08", volume: 5830 },
    { date: "2026-06-10", volume: 8660 },
  ],
};
```

---

## 7. Open Risks for the Builder

1. **NativeWind v4 + Expo web export interaction.** The `withNativeWind` metro
   wrapper generates CSS at build time. During `expo start --web` (dev mode),
   hot reload sometimes drops Tailwind class resolution requiring a full refresh.
   Acceptable for the export build; just confirm classes render after `expo export`.

2. **experiments.baseUrl is production-only.** The local dev server (`expo start`)
   ignores `experiments.baseUrl`. All asset paths in dev will be absolute from
   root. This means local dev looks fine but the exported app must be served FROM
   the `/demos/repsetta-fitness/` path to validate. Use `npx serve
   ../michaelwegter.com/public` and navigate to `/demos/repsetta-fitness/` for
   final validation, not the Expo dev server.

3. **react-native-reanimated on web.** The plan explicitly avoids heavy
   reanimated usage, which is correct. If `react-native-reanimated` is installed
   (NativeWind peer dep) but not used for custom animations, it should not cause
   issues. Do NOT use `Animated` from reanimated for the rest timer; use
   React state + `setInterval` with a CSS/SVG approach for the countdown ring.

4. **Expo build time.** `expo export --platform web` for a minimal managed app
   typically runs in 60-120 seconds with warm cache. Cold first run may take 3-4
   minutes. Pre-run `npm install` and `expo start --web` once to warm the Metro
   cache before the timed export.

5. **mw-backend restart required.** After Stage B (appending the blueprint), the
   builder MUST notify Michael to restart the waitress server on the Surface before
   live validation. The local Stage A Flask server is the fallback if the Surface
   is not available.

6. **Location gate (R9).** Not a build risk but a cover-letter risk. No
   fabrication; acknowledge honestly and pivot to engineering depth. The live demo
   is the reframe.
