// Check exactly which page and resource triggers the 404 console error
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Track all console errors with page URL context
page.on('console', (m) => {
  if (m.type() === 'error') {
    console.log(`[console error on ${page.url()}]: ${m.text()}`);
  }
});
page.on('pageerror', (e) => console.log(`[pageerror]: ${e.message}`));

const failed = [];
page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

// Step 1: demo URL
console.log('\n--- Loading demo URL ---');
await page.goto('https://michaelwegter.com/demos/bowling-shirt-designer/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

// Interact
const patternBtn = page.locator('button').filter({ hasText: /argyle/i }).first();
if (await patternBtn.count() > 0) await patternBtn.click();
const inp = page.locator('input[type="text"]').first();
if (await inp.count() > 0) await inp.fill('BOWLER');
await page.waitForTimeout(400);
const cartBtn = page.locator('button').filter({ hasText: /add to cart/i }).first();
if (await cartBtn.count() > 0) await cartBtn.click();
await page.waitForTimeout(600);

// Step 2: work-samples SPA route
console.log('\n--- Loading work-samples SPA route ---');
await page.goto('https://michaelwegter.com/work-samples/bowling-shirt-designer', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

console.log('\nAll failed resources:');
failed.forEach(f => console.log(' ', f));
if (failed.length === 0) console.log('  none');

await browser.close();
