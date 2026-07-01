import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const OUT = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/ks-global-estates/image-views/';
await mkdir(OUT, { recursive: true });

const BASE = 'http://localhost:4091/demos/ks-global-estates/';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

// Load the app
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

// Screenshot the property list view (all 25 cards)
await page.screenshot({ path: path.join(OUT, 'all-cards-1.png'), fullPage: false });
console.log('Cards screenshot 1 captured');

// Scroll to see more cards
await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, 'all-cards-2.png') });

await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, 'all-cards-3.png') });

await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, 'all-cards-4.png') });

await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, 'all-cards-5.png') });

// Now click each card to see its gallery - need to do this for each property
// First click property 1 to see its gallery
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

// Click the first card
const cards = await page.$$('[class*="card"], [class*="Card"], .property-card, article');
console.log(`Found ${cards.length} card elements`);

if (cards.length > 0) {
  await cards[0].click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'detail-p1.png') });
  console.log('Detail panel p1 captured');
  
  // Close detail panel
  const closeBtn = await page.$('[class*="close"], button[aria-label*="close"], button[aria-label*="Close"]');
  if (closeBtn) await closeBtn.click();
  await page.waitForTimeout(500);
}

await browser.close();
console.log('Done.');
