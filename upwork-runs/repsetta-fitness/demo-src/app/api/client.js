// Repsetta API client.
//
// Production web export talks to the real Flask backend on Michael's server.
// Every call is wrapped in try/catch with a graceful fallback to bundled seed
// data so the iframed demo never blanks out or throws if the backend is offline
// or pre-deploy.
//
// For LOCAL self-test, set API_BASE to http://localhost:5005 to hit the
// standalone mock Flask server and prove real round-trips.

import { EXERCISES, TODAY_PROGRAM, PAST_WORKOUTS, PROGRESS } from "./mockSeed";

// Production default. The committed web export ships this and talks to the real
// Flask backend when served from michaelwegter.com (where CORS is allow-listed).
export const API_BASE = "https://api.michaelwegter.com";

const DEMO_USER = "demo";
const TIMEOUT_MS = 6000;

// Decide whether to attempt the network at all.
//
// We only hit the network when we KNOW the request can succeed without throwing
// an uncatchable browser-level network/CORS error on first paint:
//   - production: served from michaelwegter.com (origin is CORS-allow-listed)
//   - self-test : an explicit override base is set via window.__REPSETTA_API_BASE__
// Anywhere else (a bare localhost preview, an offline iframe, pre-deploy) we use
// bundled seed data so the demo never logs a console error or blanks out.
function resolveBase() {
  if (typeof window !== "undefined") {
    const override = window.__REPSETTA_API_BASE__;
    if (override) return override;
    const host = window.location && window.location.hostname;
    if (host === "michaelwegter.com" || host === "www.michaelwegter.com") {
      return API_BASE;
    }
    return null; // unknown origin -> seed-data fallback, no network attempt
  }
  return null;
}

// In-memory copies so the mock-fallback path still reflects sessions the user
// saves during a single demo visit, even with no backend.
let localWorkouts = PAST_WORKOUTS.map((w) => ({ ...w }));

async function req(path, options = {}) {
  const base = resolveBase();
  if (!base) throw new Error("network disabled");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/repsetta${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function volumeOf(sets) {
  return sets.reduce((sum, s) => sum + Number(s.reps) * Number(s.weight), 0);
}

export async function getExercises() {
  try {
    const data = await req("/exercises");
    return data.exercises || data;
  } catch {
    return EXERCISES;
  }
}

export async function getTodayProgram() {
  try {
    return await req("/program/today");
  } catch {
    return TODAY_PROGRAM;
  }
}

export async function getWorkouts() {
  try {
    const data = await req(`/workouts?user=${DEMO_USER}`);
    return data.workouts || data;
  } catch {
    return localWorkouts.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  }
}

export async function saveWorkout(workout) {
  const payload = { ...workout, user: DEMO_USER };
  try {
    const data = await req("/workouts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.workout || data;
  } catch {
    const saved = {
      id: `local-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      name: workout.name || "Workout",
      sets: workout.sets,
    };
    localWorkouts = [saved, ...localWorkouts];
    return saved;
  }
}

export async function getProgress() {
  try {
    return await req(`/progress?user=${DEMO_USER}`);
  } catch {
    const sorted = localWorkouts.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const trend = sorted.map((w) => ({ date: w.date, volume: volumeOf(w.sets) }));
    return {
      totalWorkouts: localWorkouts.length,
      totalVolume: trend.reduce((s, t) => s + t.volume, 0),
      currentStreak: PROGRESS.currentStreak,
      trend,
    };
  }
}
