import { chromium } from 'playwright';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
const URL = 'http://localhost:8899/demos/bowling-shirt-designer/';
const RUN = '/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/upwork-runs/bowling-shirt-designer';
const UP = `${RUN}/screenshot bowlifi.png`;
const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');

const errs = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('PE: ' + e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
const firstPaintErrs = errs.length;

// Base render
await page.locator('#shirt-canvas canvas').screenshot({ path: `${RUN}/st2-base.png` });

// Upload an image (wrap mode is default) -> should wrap around shirt
await page.locator('input[type=file]').first().setInputFiles(UP);
await page.waitForTimeout(1800);
await page.locator('#shirt-canvas canvas').screenshot({ path: `${RUN}/st2-wrap.png` });

// Smart Align
const sa = page.getByRole('button', { name: /Smart Align/ });
const hasSA = await sa.count();
if (hasSA) { await sa.first().click(); await page.waitForTimeout(1500); }
await page.locator('#shirt-canvas canvas').screenshot({ path: `${RUN}/st2-aligned.png` });

// Front/Back mode
await page.getByRole('button', { name: 'Front / Back' }).click();
await page.waitForTimeout(400);
const slots = await page.locator('input[type=file]').count();

const frames = ['st2-base.png', 'st2-wrap.png', 'st2-aligned.png'].map((f) => md5(`${RUN}/${f}`));
console.log('FIRST_PAINT_ERRS', firstPaintErrs, 'TOTAL_ERRS', errs.length);
console.log('SMART_ALIGN_BTN', hasSA, 'FB_FILE_SLOTS', slots);
console.log('WRAP_CHANGED_RENDER', frames[0] !== frames[1]);
console.log('DISTINCT_FRAMES', new Set(frames).size, '/3');
errs.slice(0, 6).forEach((e) => console.log('  ERR', e.slice(0, 160)));
await browser.close();
