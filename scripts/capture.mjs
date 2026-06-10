#!/usr/bin/env node
/**
 * capture.mjs - deterministic screenshot + screen-recording for a demo.
 *
 * Usage:
 *   node scripts/capture.mjs --url http://localhost:5050 --slug my-demo \
 *        --out upwork-runs/my-demo/proposal/media [--flow path/to/flow.json] [--smoke]
 *
 * Produces in --out:
 *   hero.png        full hero view (above the fold)
 *   page.png        full-page screenshot
 *   step-1.png ...  one still per flow step
 *   demo.webm       short recording of the flow (if recording is supported)
 *   demo.gif        gif version (only if ffmpeg is available)
 *
 * --smoke : just load the page, assert no console errors, exit non-zero on error.
 *           Used by the demo-builder for a quick health check.
 *
 * Flow file (optional) - an array of steps the recorder performs:
 *   [
 *     { "action": "wait",   "ms": 600 },
 *     { "action": "click",  "selector": "#start" },
 *     { "action": "fill",   "selector": "#name", "value": "Demo" },
 *     { "action": "shot",   "name": "after-fill" },
 *     { "action": "scroll", "to": "#results" }
 *   ]
 *
 * Requires Playwright. If missing:
 *   npm i -D playwright && npx playwright install chromium
 */

import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

function arg(name, def = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}

const url = arg("url");
const slug = arg("slug", "demo");
const out = arg("out", `upwork-runs/${slug}/proposal/media`);
const flowPath = arg("flow");
const smoke = !!arg("smoke", false);

if (!url) {
  console.error("capture: --url is required");
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "capture: Playwright not installed. Run:\n" +
      "  npm i -D playwright && npx playwright install chromium"
  );
  process.exit(3);
}

mkdirSync(out, { recursive: true });

const consoleErrors = [];

const launchOpts = { args: ["--no-sandbox"] };
const browser = await chromium.launch(launchOpts);
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  recordVideo: smoke ? undefined : { dir: out, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(String(e)));

let exitCode = 0;
try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(800);

  if (smoke) {
    if (consoleErrors.length) {
      console.error("capture(smoke): console errors:\n" + consoleErrors.join("\n"));
      exitCode = 1;
    } else {
      console.log("capture(smoke): ok, no console errors");
    }
  } else {
    // Hero (above the fold) + full page.
    await page.screenshot({ path: path.join(out, "hero.png") });
    await page.screenshot({ path: path.join(out, "page.png"), fullPage: true });

    // Run the flow if provided, capturing a still after each "shot" step.
    let stepN = 0;
    if (flowPath && existsSync(flowPath)) {
      const steps = JSON.parse(readFileSync(flowPath, "utf8"));
      for (const s of steps) {
        try {
          if (s.action === "wait") await page.waitForTimeout(s.ms ?? 500);
          else if (s.action === "click") await page.click(s.selector, { timeout: 5000 });
          else if (s.action === "fill") await page.fill(s.selector, s.value ?? "", { timeout: 5000 });
          else if (s.action === "scroll")
            await page.locator(s.to).scrollIntoViewIfNeeded({ timeout: 5000 });
          else if (s.action === "shot") {
            stepN += 1;
            await page.screenshot({ path: path.join(out, `step-${stepN}.png`) });
          }
        } catch (e) {
          console.warn(`capture: flow step failed (${JSON.stringify(s)}): ${e.message}`);
        }
      }
    } else {
      // No flow: take a couple of scripted stills so the deck has variety.
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(out, "step-1.png") });
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(out, "step-2.png") });
    }
    console.log(`capture: screenshots written to ${out}`);
  }
} catch (e) {
  console.error("capture: error", e.message);
  exitCode = smoke ? 1 : 4;
} finally {
  await context.close(); // finalizes the video file
  await browser.close();
}

// Try to convert the recording to a gif (best effort; needs ffmpeg).
if (!smoke && exitCode === 0) {
  try {
    const { readdirSync, renameSync } = await import("node:fs");
    const vids = readdirSync(out).filter((f) => f.endsWith(".webm"));
    if (vids.length) {
      const webm = path.join(out, "demo.webm");
      renameSync(path.join(out, vids[0]), webm);
      try {
        execFileSync(
          "ffmpeg",
          ["-y", "-i", webm, "-vf", "fps=12,scale=900:-1:flags=lanczos", path.join(out, "demo.gif")],
          { stdio: "ignore" }
        );
        console.log("capture: demo.gif created");
      } catch {
        console.log("capture: ffmpeg not available, kept demo.webm only");
      }
    }
  } catch (e) {
    console.warn("capture: post-processing skipped:", e.message);
  }
}

process.exit(exitCode);
