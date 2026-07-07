import { chromium } from 'playwright';

const URL = 'http://localhost:8899/demos/bowling-shirt-designer/';
const OUT = '/Users/michaelwegter/Desktop/Projects/michaelwegter.com/public/work-samples/bowling-shirt-designer.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);

// Apply a striking design + back name for the hero still.
await page.getByRole('button', { name: 'Argyle' }).click().catch(() => {});
await page.getByPlaceholder('Your name / team').fill('STRIKE').catch(() => {});
await page.waitForTimeout(500);
// Scroll so the studio (3D shirt + options) fills the frame.
await page.locator('#studio').scrollIntoViewIfNeeded();
await page.waitForTimeout(2600); // let the shirt auto-rotate to a front-ish angle

await page.screenshot({ path: OUT });
console.log('CAPTURED', OUT);
await browser.close();
