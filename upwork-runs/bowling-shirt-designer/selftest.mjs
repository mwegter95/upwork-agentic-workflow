import { chromium } from 'playwright';

const URL = 'http://localhost:8899/demos/bowling-shirt-designer/';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

const hasCanvas = await page.locator('#shirt-canvas canvas').count();
const hasInput = await page.getByPlaceholder('Your name / team').count();
const bodyLen = (await page.locator('body').innerText()).length;

if (hasInput) {
  await page.getByRole('button', { name: 'Ten Pin' }).click().catch(() => {});
  await page.getByPlaceholder('Your name / team').fill('STRIKE').catch(() => {});
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /Add to cart/ }).click().catch(() => {});
  await page.waitForTimeout(600);
}
const cartBtn = await page.getByRole('button', { name: /Checkout/ }).count();

await page.screenshot({ path: '/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/upwork-runs/bowling-shirt-designer/selftest.png' });

console.log('CANVAS_COUNT', hasCanvas, 'INPUT', hasInput, 'BODYLEN', bodyLen, 'CHECKOUT', cartBtn);
console.log('CONSOLE_ERRORS', errors.length);
errors.forEach((e) => console.log('  ERR:', e.slice(0, 200)));
await browser.close();
