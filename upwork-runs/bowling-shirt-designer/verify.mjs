import { chromium } from 'playwright';
const URL = 'http://localhost:8899/demos/bowling-shirt-designer/';
const RUN = '/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/upwork-runs/bowling-shirt-designer';
const HERO = '/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/work-samples/bowling-shirt-designer.png';

const errs = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PE: ' + e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);

// Interactions
await page.getByRole('button', { name: 'Argyle' }).click();
await page.getByPlaceholder('Your name / team').fill('STRIKE');
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Add to cart/ }).click();
await page.waitForTimeout(500);
const checkout = await page.getByRole('button', { name: /Checkout/ }).count();
await page.getByRole('button', { name: '×' }).click().catch(() => {});
await page.waitForTimeout(400);

// Hero still
await page.locator('#studio').scrollIntoViewIfNeeded();
await page.waitForTimeout(2200);
await page.screenshot({ path: HERO });

// Back-view proof: grab several canvas frames as it rotates
await page.locator('#shirt-canvas canvas').screenshot({ path: `${RUN}/verify-front.png` });
await page.waitForTimeout(2400);
await page.locator('#shirt-canvas canvas').screenshot({ path: `${RUN}/verify-back.png` });

console.log('CHECKOUT', checkout, 'ERRORS', errs.length);
errs.slice(0, 5).forEach((e) => console.log('  ', e.slice(0, 150)));
await browser.close();
