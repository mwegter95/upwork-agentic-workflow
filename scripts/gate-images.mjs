// gate-images.mjs — zero-token image gate for the studio engine.
//
// Called by the "image-gate" check node (see claude-workflow-studio overlays).
// Env: RUN_DIR = the run directory (upwork-runs/<slug>). Convention: exit 0 =
// PASS = run the image QA section; exit 1 = FAIL = skip it (no images).
//
// Decision:
//   - manifest missing/unreadable  -> PASS (safe default: let the analyzer look)
//   - manifest is a non-empty array -> PASS (there are images to QA)
//   - manifest is [] (affirmatively no raster images) -> FAIL (skip the section)

import { readFileSync } from "node:fs";
import { join } from "node:path";

const runDir = process.env.RUN_DIR;
if (!runDir) {
  console.log("gate-images: no RUN_DIR — passing through to the analyzer");
  process.exit(0);
}

const manifestPath = join(runDir, "image-manifest.json");
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (e) {
  console.log(`gate-images: ${manifestPath} missing/unreadable (${e.code || e.message}) — passing through to the analyzer`);
  process.exit(0);
}

if (Array.isArray(manifest) && manifest.length === 0) {
  console.log("gate-images: manifest is affirmatively empty — no raster images, skipping the image QA section");
  process.exit(1);
}

const count = Array.isArray(manifest) ? manifest.length : "?";
console.log(`gate-images: ${count} image(s) in manifest — running the image QA section`);
process.exit(0);
