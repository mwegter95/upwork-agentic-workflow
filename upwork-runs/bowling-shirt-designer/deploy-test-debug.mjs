// Identify which resource 404s on the live demo
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const failed = [];
page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text()); });
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));

await page.goto('https://michaelwegter.com/demos/bowling-shirt-designer/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);

// Interact to trigger any lazy-loaded resources
const patternBtn = page.locator('button').filter({ hasText: /argyle|flames/i }).first();
if (await patternBtn.count() > 0) await patternBtn.click();
const inp = page.locator('input[type="text"]').first();
if (await inp.count() > 0) await inp.fill('TEST');
await page.waitForTimeout(1000);

console.log('\nFailed resources:');
failed.forEach(f => console.log(' ', f));
if (failed.length === 0) console.log('  none');

await browser.close();
