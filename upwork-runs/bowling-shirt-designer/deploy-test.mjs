// deploy-test.mjs — live Playwright test for bowling-shirt-designer
import { chromium } from 'playwright';

const DEMO_URL = 'https://michaelwegter.com/demos/bowling-shirt-designer/';
const WS_URL = 'https://michaelwegter.com/work-samples/bowling-shirt-designer';
const API_BASE = 'https://api.michaelwegter.com';

const results = [];
const fail = (msg) => { results.push({ status: 'FAIL', msg }); console.error('FAIL:', msg); };
const pass = (msg) => { results.push({ status: 'PASS', msg }); console.log('PASS:', msg); };

// --- API round-trip (no browser needed) ---
async function testApi() {
  // health
  const h = await fetch(`${API_BASE}/bowling/health`);
  const hj = await h.json();
  if (hj.status === 'ok') pass('API /bowling/health ok — mode: ' + hj.mode);
  else fail('/bowling/health returned: ' + JSON.stringify(hj));

  // patterns list
  const p = await fetch(`${API_BASE}/bowling/patterns`);
  const pj = await p.json();
  if (Array.isArray(pj.patterns) && pj.patterns.length >= 5) pass(`/bowling/patterns returned ${pj.patterns.length} patterns`);
  else fail('/bowling/patterns unexpected: ' + JSON.stringify(pj));

  // session create + retrieve
  const c = await fetch(`${API_BASE}/bowling/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pattern: 'argyle', text: 'STRIKE', qty: 2 }),
  });
  const cj = await c.json();
  if (!cj.id) { fail('POST /bowling/session — no id: ' + JSON.stringify(cj)); return; }
  pass('POST /bowling/session created id: ' + cj.id);

  const g = await fetch(`${API_BASE}/bowling/session/${cj.id}`);
  const gj = await g.json();
  if (gj.id === cj.id && gj.data?.pattern === 'argyle' && gj.data?.text === 'STRIKE') {
    pass('GET /bowling/session/:id round-trip verified');
  } else {
    fail('GET /bowling/session/:id mismatch: ' + JSON.stringify(gj));
  }
}

// --- Browser tests ---
async function testBrowser() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  try {
    // 1. Direct demo URL loads (static 200)
    const resp = await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (resp?.status() === 200) pass(`Demo static URL 200: ${DEMO_URL}`);
    else fail(`Demo URL returned ${resp?.status()}: ${DEMO_URL}`);

    // 2. Wait for page to fully render (Next.js static export)
    await page.waitForTimeout(4000);

    // 3. Page title / hero element visible
    const title = await page.title();
    if (title && title.length > 0) pass('Page title: ' + title);
    else fail('No page title');

    // 4. Canvas (3D shirt) or main customizer element present
    const canvasCount = await page.locator('canvas').count();
    const studioEl = await page.locator('#studio, [id*="studio"], [class*="studio"], [class*="customiz"]').count();
    if (canvasCount > 0) pass(`3D canvas element(s) found: ${canvasCount}`);
    else if (studioEl > 0) pass('Studio/customizer element found');
    else fail('No canvas or customizer element found on page');

    // 5. Pattern selection — try clicking a pattern button (Argyle, Flames, etc.)
    const patternBtn = page.locator('button').filter({ hasText: /argyle|flames|starburst|chevron|pattern/i }).first();
    const btnCount = await patternBtn.count();
    if (btnCount > 0) {
      await patternBtn.click();
      await page.waitForTimeout(600);
      pass('Pattern button clicked');
    } else {
      // Try thumbnail/swatch approach
      const swatches = await page.locator('[data-pattern], [class*="pattern"], [class*="swatch"]').count();
      if (swatches > 0) {
        await page.locator('[data-pattern], [class*="pattern"], [class*="swatch"]').first().click();
        await page.waitForTimeout(600);
        pass('Pattern swatch clicked');
      } else {
        fail('No pattern selection elements found');
      }
    }

    // 6. Text input (name/team on back of shirt)
    const textInput = page.locator('input[placeholder*="name"], input[placeholder*="team"], input[type="text"]').first();
    if (await textInput.count() > 0) {
      await textInput.fill('BOWLER');
      await page.waitForTimeout(400);
      pass('Name/text input filled');
    } else {
      fail('No text input for name/team found');
    }

    // 7. Add to cart
    const cartBtn = page.locator('button').filter({ hasText: /add to cart|add to bag|buy/i }).first();
    if (await cartBtn.count() > 0) {
      await cartBtn.click();
      await page.waitForTimeout(600);
      pass('Add to cart clicked');
    } else {
      fail('No "Add to Cart" button found');
    }

    // 8. Cart has items (checkout button appears or cart count > 0)
    await page.waitForTimeout(500);
    const checkoutBtn = await page.locator('button').filter({ hasText: /checkout|cart|order/i }).count();
    const cartBadge = await page.locator('[class*="cart"], [class*="badge"], [class*="count"]').count();
    if (checkoutBtn > 0 || cartBadge > 0) pass('Cart/checkout element present after add');
    else fail('No cart or checkout element visible after add to cart');

    // 9. /work-samples/<slug> deep link loads via SPA shim (browser, not curl)
    const resp2 = await page.goto(WS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const wsTitle = await page.title();
    // The 404.html SPA shim redirects to app — page should not show a raw 404 text
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (!bodyText.toLowerCase().includes('404 not found') || wsTitle.includes('Michael')) {
      pass('Work-samples deep link renders via SPA shim: ' + WS_URL);
    } else {
      fail('Work-samples deep link shows raw 404 — SPA shim may have failed');
    }

    // 10. Console error summary
    if (consoleErrors.length === 0 && pageErrors.length === 0) {
      pass('No console errors or page errors during session');
    } else {
      const combined = [...consoleErrors, ...pageErrors];
      // Filter known benign errors (e.g., 3rd-party, hydration warnings)
      const real = combined.filter(e =>
        !e.includes('favicon') &&
        !e.includes('non-passive') &&
        !e.includes('ResizeObserver') &&
        !e.includes('hydrat')
      );
      if (real.length === 0) pass(`${combined.length} minor/expected console messages (none blocking)`);
      else fail(`${real.length} real console/page error(s): ${real.slice(0,3).map(e => e.slice(0,120)).join(' | ')}`);
    }

  } finally {
    await browser.close();
  }
}

// Run all tests
await testApi();
await testBrowser();

// Summary
const fails = results.filter(r => r.status === 'FAIL');
const passes = results.filter(r => r.status === 'PASS');
console.log(`\n=== DEPLOY-TEST SUMMARY: ${passes.length} pass, ${fails.length} fail ===`);
if (fails.length > 0) {
  console.log('Failures:');
  fails.forEach(f => console.log(' -', f.msg));
  process.exit(1);
} else {
  process.exit(0);
}
