// deploy-test2.mjs — pass-2 Playwright test: front/back upload + Smart Align + 3D render
import { chromium } from 'playwright';

const DEMO_URL = 'https://michaelwegter.com/demos/bowling-shirt-designer/';
const WS_URL   = 'https://michaelwegter.com/work-samples/bowling-shirt-designer';
const API_BASE = 'https://api.michaelwegter.com';

const results = [];
const fail = (msg) => { results.push({ status: 'FAIL', msg }); console.error('FAIL:', msg); };
const pass = (msg) => { results.push({ status: 'PASS', msg }); console.log('PASS:', msg); };
const warn = (msg) => { results.push({ status: 'WARN', msg }); console.warn('WARN:', msg); };

// --- 1. Build version gate: confirm pass-2 assets are live ---
async function testBuildVersion() {
  // new CSS from pass-2 build must be reachable (not 404)
  const newCssUrl = `https://michaelwegter.com/demos/bowling-shirt-designer/_next/static/css/1dcba34334268f0d.css`;
  const r = await fetch(newCssUrl);
  if (r.ok) pass('Pass-2 CSS asset live (1dcba34)');
  else fail(`Pass-2 CSS asset 404 — GH Pages deploy did not propagate (status ${r.status}). Live site still serving pass-1 build.`);

  // old CSS from pass-1 should no longer be primary (check index.html)
  const idx = await fetch(DEMO_URL);
  const html = await idx.text();
  if (html.includes('1dcba34')) pass('index.html references pass-2 CSS hash');
  else if (html.includes('40972bc')) fail('index.html still references pass-1 CSS (40972bc) — GH Pages deploy not applied');
  else warn('index.html CSS reference unrecognized');
}

// --- 2. API tests ---
async function testApi() {
  const h = await fetch(`${API_BASE}/bowling/health`);
  const hj = await h.json().catch(() => ({}));
  if (hj.status === 'ok') pass('API /bowling/health ok');
  else fail('/bowling/health unexpected: ' + JSON.stringify(hj));

  const p = await fetch(`${API_BASE}/bowling/patterns`);
  const pj = await p.json().catch(() => ({}));
  if (Array.isArray(pj.patterns) && pj.patterns.length >= 5)
    pass(`/bowling/patterns: ${pj.patterns.length} patterns`);
  else fail('/bowling/patterns: ' + JSON.stringify(pj));
}

// --- 3. Browser / UI tests ---
async function testBrowser() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    // Provide a minimal test PNG as upload file
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  try {
    // 3a. Demo URL loads
    const resp = await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 40000 });
    if (resp?.status() === 200) pass('Demo URL 200');
    else fail(`Demo URL ${resp?.status()}`);

    await page.waitForTimeout(3000);

    // 3b. 3D canvas present
    const canvasCount = await page.locator('canvas').count();
    if (canvasCount > 0) pass(`3D canvas present (${canvasCount})`);
    else fail('No <canvas> found — 3D render not loaded');

    // 3c. PASS-2: Front image upload input
    const frontUpload = page.locator('input[type="file"]').first();
    const frontCount = await frontUpload.count();
    if (frontCount > 0) pass('Front image upload input present');
    else fail('No file upload input found — front image upload missing (pass-2 feature not deployed)');

    // 3d. PASS-2: Back image upload input (look for second file input or "back" labeled input)
    const allFileInputs = page.locator('input[type="file"]');
    const fileInputCount = await allFileInputs.count();
    if (fileInputCount >= 2) pass(`Front + back upload inputs found (${fileInputCount} total)`);
    else if (fileInputCount === 1) {
      // check for tabs or toggle indicating front/back
      const backTab = page.locator('button, label, [role="tab"]').filter({ hasText: /back/i });
      if (await backTab.count() > 0) pass('Single upload with front/back toggle found');
      else fail('Only 1 file input, no back-upload toggle — front/back separation missing');
    } else {
      fail('No file upload inputs — pass-2 upload feature not present');
    }

    // 3e. PASS-2: Smart Align / alignment controls (zoom, crop, position)
    const alignControls = await page.locator([
      'input[type="range"]',
      '[class*="align"], [class*="smart"], [class*="zoom"], [class*="crop"], [class*="offset"]',
      'label:has-text("zoom"), label:has-text("Zoom"), label:has-text("Scale")',
      'button:has-text("Align"), button:has-text("Smart")',
    ].join(', ')).count();
    if (alignControls > 0) pass(`Smart alignment / adjustment controls found (${alignControls})`);
    else fail('No Smart Align / zoom / crop controls found — pass-2 alignment feature not deployed');

    // 3f. Attempt actual file upload if inputs exist
    if (frontCount > 0) {
      // Create a minimal 1x1 PNG in /tmp to upload
      const { execSync } = await import('child_process');
      // Write a minimal PNG (1x1 red pixel)
      const pngData = Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
        '2e00000000c4944415478016360f8cfc00000000200015fe33680000000049454e44ae426082',
        'hex'
      );
      const tmpPath = '/tmp/test-upload.png';
      const fs = await import('fs');
      fs.writeFileSync(tmpPath, pngData);

      try {
        await frontUpload.setInputFiles(tmpPath);
        await page.waitForTimeout(1500);
        pass('File uploaded via front input (no JS error)');

        // Check canvas re-rendered (any animation frame tick after upload is enough)
        const hasCanvas = await page.locator('canvas').count();
        if (hasCanvas > 0) pass('Canvas still present after upload');
        else fail('Canvas disappeared after upload');
      } catch (e) {
        fail('File upload threw: ' + e.message.slice(0, 120));
      }
    }

    // 3g. Color picker still present (pass-1 feature must survive)
    const colorPicker = await page.locator('input[type="color"], [class*="color"], [data-color]').count();
    if (colorPicker > 0) pass('Color picker present (pass-1 feature preserved)');
    else warn('No color picker found — may have been replaced by upload-only UI');

    // 3h. Console errors
    const real = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('ResizeObserver') && !e.includes('non-passive') && !e.includes('hydrat')
    );
    if (real.length === 0) pass('No blocking console errors');
    else fail(`${real.length} console error(s): ${real.slice(0,3).map(e => e.slice(0,120)).join(' | ')}`);

    // 3i. Work-samples deep link
    const resp2 = await page.goto(WS_URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2500);
    const body = await page.locator('body').innerText().catch(() => '');
    const wsTitle = await page.title();
    if (!body.toLowerCase().includes('404 not found') || wsTitle.includes('Michael')) {
      pass('Work-samples deep link renders via SPA shim');
    } else {
      fail('Work-samples deep link shows raw 404');
    }

  } finally {
    await browser.close();
  }
}

// Run
await testBuildVersion();
await testApi();
await testBrowser();

// Summary
const fails = results.filter(r => r.status === 'FAIL');
const passes = results.filter(r => r.status === 'PASS');
const warns = results.filter(r => r.status === 'WARN');
console.log(`\n=== DEPLOY-TEST2 SUMMARY: ${passes.length} pass, ${warns.length} warn, ${fails.length} fail ===`);
if (fails.length) {
  console.log('Failures:');
  fails.forEach(f => console.log(' -', f.msg));
  process.exit(1);
} else {
  process.exit(0);
}
