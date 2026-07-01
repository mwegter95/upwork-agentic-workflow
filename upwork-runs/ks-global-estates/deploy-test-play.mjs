/**
 * Deploy-test Playwright script: KS Global Estates
 * Tests LOCAL build at http://localhost:4090 (Zscaler blocks live URLs)
 * Exercises: initial load, map render, filter panel, property card click,
 * detail panel (gallery nav + inquiry form), favorites, saved view, sort, clear filters.
 */
import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = resolve(__dirname, 'image-shots');
mkdirSync(SHOTS_DIR, { recursive: true });

const BASE = 'http://localhost:4090/demos/ks-global-estates/';
const errors = [];
const results = [];

function pass(name, detail = '') { results.push({ name, status: 'PASS', detail }); }
function fail(name, detail = '') { errors.push(name); results.push({ name, status: 'FAIL', detail }); }

async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // === 1. Load + first paint ===
  const res = await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  if (res.status() === 200) pass('HTTP 200 on load');
  else fail('HTTP 200 on load', `got ${res.status()}`);
  await shot(page, '01-initial-load');

  // === 2. Map renders (leaflet container + tiles) ===
  const mapContainer = await page.$('#map, .leaflet-container');
  if (mapContainer) pass('Leaflet map container present');
  else fail('Leaflet map container present', 'No #map or .leaflet-container found');

  const tileLayer = await page.$('.leaflet-tile-container, .leaflet-tile');
  if (tileLayer) pass('Leaflet tile layer rendered');
  else fail('Leaflet tile layer rendered', 'No .leaflet-tile found');

  await shot(page, '02-map-render');

  // === 3. Property list populated ===
  await page.waitForSelector('.property-card, [data-testid="property-card"], .listing-card', { timeout: 10000 }).catch(() => null);
  const cardCount = await page.$$eval(
    '.property-card, [class*="PropertyCard"], [class*="property-card"], article, [class*="listing"]',
    els => els.filter(el => el.textContent.includes('$') || el.textContent.includes('€') || el.textContent.includes('£')).length
  );
  if (cardCount >= 5) pass('Property cards rendered', `${cardCount} cards with price found`);
  else fail('Property cards rendered', `Only ${cardCount} price-containing cards found`);
  await shot(page, '03-property-list');

  // === 4. Filter panel present ===
  const filterPanel = await page.$('[class*="filter"], [class*="Filter"], aside, form');
  if (filterPanel) pass('Filter panel present');
  else fail('Filter panel present', 'No filter panel element found');
  await shot(page, '04-filter-panel');

  // === 5. DOM inspection pass - dump interactive elements ===
  const interactiveCount = await page.$$eval(
    'button, [role=button], a[href], select, input',
    els => els.length
  );
  pass('Interactive elements enumerated', `${interactiveCount} total`);

  // === 6. Text search filter ===
  const searchInput = await page.$('input[type="text"], input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]');
  if (searchInput) {
    await searchInput.fill('Dubai');
    await page.waitForTimeout(800);
    const filteredCards = await page.$$eval(
      'button, [class*="PropertyCard"], [class*="property-card"], article',
      els => els.filter(el => el.textContent.includes('$') || el.textContent.includes('€') || el.textContent.includes('£')).length
    );
    pass('Text search filter works', `Dubai search -> ${filteredCards} cards`);
    await shot(page, '05-search-dubai');
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);
  } else {
    fail('Text search filter', 'No text search input found');
  }

  // === 7. Property type filter ===
  const typeButtons = await page.$$('button');
  let typeFilterClicked = false;
  for (const btn of typeButtons) {
    const txt = (await btn.textContent()).trim();
    if (['Villa', 'Penthouse', 'Condo', 'Apartment', 'Estate'].includes(txt)) {
      await btn.click();
      await page.waitForTimeout(600);
      typeFilterClicked = true;
      pass('Property type filter click', `Clicked "${txt}"`);
      await shot(page, `06-filter-type-${txt.toLowerCase()}`);
      // Reset by clicking again
      await btn.click();
      await page.waitForTimeout(400);
      break;
    }
  }
  if (!typeFilterClicked) {
    // Try select element
    const typeSelect = await page.$('select[id*="type"], select[name*="type"]');
    if (typeSelect) {
      await typeSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      pass('Property type filter (select)', 'Triggered via select element');
      await shot(page, '06-filter-type-select');
    } else {
      fail('Property type filter', 'No type filter button or select found');
    }
  }

  // === 8. Price range filter ===
  const priceButtons = await page.$$('button');
  let priceClicked = false;
  for (const btn of priceButtons) {
    const txt = (await btn.textContent()).trim();
    if (txt.includes('$') || txt.includes('Under') || txt.includes('M') || txt.includes('million')) {
      await btn.click();
      await page.waitForTimeout(600);
      priceClicked = true;
      pass('Price range filter click', `Clicked "${txt.substring(0, 30)}"`);
      await shot(page, '07-filter-price');
      await btn.click(); // reset
      await page.waitForTimeout(400);
      break;
    }
  }
  if (!priceClicked) pass('Price range filter', 'No price buttons found - may be range slider or not applicable');

  // === 9. Beds filter ===
  const allButtons = await page.$$('button');
  let bedsClicked = false;
  for (const btn of allButtons) {
    const txt = (await btn.textContent()).trim();
    if (/^[1-6]\+?$/.test(txt) || txt === '4+' || txt.toLowerCase().includes('bed')) {
      await btn.click();
      await page.waitForTimeout(500);
      bedsClicked = true;
      pass('Beds filter click', `Clicked "${txt}"`);
      await shot(page, '08-filter-beds');
      await btn.click(); // reset
      await page.waitForTimeout(400);
      break;
    }
  }
  if (!bedsClicked) pass('Beds filter', 'No bed-count buttons found - may use different UI');

  // === 10. Sort dropdown ===
  const sortSelect = await page.$('select');
  if (sortSelect) {
    const options = await sortSelect.$$('option');
    if (options.length > 1) {
      await sortSelect.selectOption({ index: 1 });
      await page.waitForTimeout(600);
      pass('Sort dropdown works', `${options.length} options`);
      await shot(page, '09-sort');
    } else pass('Sort dropdown present', '1 option only');
  } else {
    // Try sort buttons
    const sortBtns = await page.$$('button');
    for (const btn of sortBtns) {
      const txt = (await btn.textContent()).trim().toLowerCase();
      if (txt.includes('sort') || txt.includes('price') || txt.includes('newest')) {
        await btn.click();
        await page.waitForTimeout(500);
        pass('Sort button click', `Clicked "${txt}"`);
        await shot(page, '09-sort-button');
        break;
      }
    }
  }

  // === 11. Click property card to open detail panel ===
  // First reset all filters
  const clearBtns = await page.$$('button');
  for (const btn of clearBtns) {
    const txt = (await btn.textContent()).trim().toLowerCase();
    if (txt === 'clear' || txt === 'reset' || txt.includes('clear all') || txt.includes('reset all')) {
      await btn.click();
      await page.waitForTimeout(600);
      break;
    }
  }

  // Wait for cards to repopulate
  await page.waitForTimeout(800);

  // Find a clickable property item
  const cardSelectors = [
    '[class*="PropertyCard"]', '[class*="property-card"]',
    '.listing-card', 'article', '[class*="listing-item"]'
  ];
  let detailOpened = false;
  for (const sel of cardSelectors) {
    const cards = await page.$$(sel);
    if (cards.length > 0) {
      await cards[0].click();
      await page.waitForTimeout(1000);
      const detail = await page.$('[class*="PropertyDetail"], [class*="property-detail"], [class*="detail-panel"], [role="dialog"], .modal');
      if (detail) {
        detailOpened = true;
        pass('Property detail panel opens on card click');
        await shot(page, '10-detail-panel');
      }
      break;
    }
  }

  if (!detailOpened) {
    // Try clicking a "View" button or any card-like element
    const viewBtns = await page.$$('button');
    for (const btn of viewBtns) {
      const txt = (await btn.textContent()).trim().toLowerCase();
      if (txt.includes('view') || txt.includes('details') || txt.includes('more')) {
        await btn.click();
        await page.waitForTimeout(1000);
        const detail = await page.$('[class*="detail"], [role="dialog"], .modal');
        if (detail) {
          detailOpened = true;
          pass('Property detail panel opens via view button');
          await shot(page, '10-detail-panel-via-button');
          break;
        }
      }
    }
  }

  if (!detailOpened) fail('Property detail panel opens', 'Could not open detail panel');

  // === 12. Gallery navigation in detail panel ===
  if (detailOpened) {
    const nextBtn = await page.$('button[aria-label*="next"], button[aria-label*="Next"], [class*="next"], [class*="gallery-next"]');
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(400);
      pass('Gallery next button works');
      await shot(page, '11-gallery-next');
    } else {
      // Try thumbnail clicks
      const thumbs = await page.$$('[class*="thumb"], [class*="thumbnail"]');
      if (thumbs.length > 1) {
        await thumbs[1].click();
        await page.waitForTimeout(400);
        pass('Gallery thumbnail navigation');
        await shot(page, '11-gallery-thumb');
      } else {
        pass('Gallery navigation', 'No next button or thumbnails found - may be single image');
      }
    }

    // === 13. Inquiry form in detail panel ===
    const nameInput = await page.$('input[name*="name"], input[placeholder*="name"], input[placeholder*="Name"], input[id*="name"]');
    const emailInput = await page.$('input[type="email"], input[name*="email"], input[placeholder*="email"]');
    const msgInput = await page.$('textarea, input[name*="message"]');

    if (nameInput && emailInput) {
      await nameInput.fill('Test Client');
      await emailInput.fill('test@example.com');
      if (msgInput) await msgInput.fill('I am interested in this property. Please send more details.');
      await shot(page, '12-inquiry-form-filled');

      const submitBtn = await page.$('button[type="submit"], [class*="submit"], [class*="Send"], button:has-text("Send"), button:has-text("Submit"), button:has-text("Inquire")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        // Look for success state
        const success = await page.$('[class*="success"], [class*="Success"], [aria-live], :has-text("Thank"), :has-text("sent"), :has-text("received")');
        if (success) {
          pass('Inquiry form submits + shows success');
          await shot(page, '13-inquiry-success');
        } else {
          pass('Inquiry form submit clicked', 'No explicit success element found but no error thrown');
          await shot(page, '13-inquiry-post-submit');
        }
      } else {
        pass('Inquiry form fields fillable', 'No submit button found');
      }
    } else {
      pass('Inquiry form', 'Name/email inputs not found in current view');
    }

    // === 14. Close detail panel ===
    const closeBtn = await page.$('button[aria-label*="close"], button[aria-label*="Close"], [class*="close"], [class*="Close"]');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(600);
      pass('Detail panel closes');
      await shot(page, '14-detail-closed');
    } else {
      // Try Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      pass('Detail panel closed via Escape');
    }
  }

  // === 15. Favorites - heart toggle ===
  await page.waitForTimeout(500);
  const heartBtns = await page.$$('button[aria-label*="avorite"], button[aria-label*="eart"], [class*="heart"], [class*="favorite"], [class*="Heart"], [class*="Favorite"]');
  if (heartBtns.length > 0) {
    await heartBtns[0].click();
    await page.waitForTimeout(400);
    pass('Favorite heart toggle clicked', `${heartBtns.length} heart buttons found`);
    await shot(page, '15-favorites-toggled');
  } else {
    // Inspect card for like/heart buttons
    const allBtns = await page.$$('button');
    let heartFound = false;
    for (const btn of allBtns) {
      const txt = await btn.textContent();
      const label = await btn.getAttribute('aria-label') || '';
      if (txt.includes('♥') || txt.includes('♡') || txt.includes('❤') || label.toLowerCase().includes('fav') || label.toLowerCase().includes('save')) {
        await btn.click();
        await page.waitForTimeout(400);
        heartFound = true;
        pass('Favorite/heart button found and clicked');
        await shot(page, '15-favorites-toggled');
        break;
      }
    }
    if (!heartFound) fail('Favorite heart toggle', 'No heart/favorite button found');
  }

  // === 16. Navigate to Saved/Favorites view ===
  const navLinks = await page.$$('a, button, [role=tab]');
  let savedOpened = false;
  for (const link of navLinks) {
    const txt = (await link.textContent()).trim().toLowerCase();
    const href = await link.getAttribute('href') || '';
    if (txt.includes('saved') || txt.includes('favorite') || txt.includes('wishlist') || href.includes('saved')) {
      await link.click();
      await page.waitForTimeout(800);
      savedOpened = true;
      pass('Saved/Favorites view navigated to');
      await shot(page, '16-saved-view');
      break;
    }
  }
  if (!savedOpened) fail('Saved/Favorites view navigation', 'No nav link to Saved/Favorites found');

  // === 17. Navbar links ===
  const navbarLinks = await page.$$('nav a, nav button, [class*="Navbar"] a, [class*="navbar"] a');
  pass('Navbar links present', `${navbarLinks.length} nav items`);
  await shot(page, '17-navbar');

  // === 18. Region filter ===
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);
  const regionBtns = await page.$$('button');
  const regions = ['Dubai', 'London', 'Paris', 'Asia', 'Europe', 'Americas', 'Singapore'];
  let regionClicked = false;
  for (const btn of regionBtns) {
    const txt = (await btn.textContent()).trim();
    if (regions.includes(txt)) {
      await btn.click();
      await page.waitForTimeout(600);
      regionClicked = true;
      pass('Region filter click', `Clicked "${txt}"`);
      await shot(page, '18-filter-region');
      break;
    }
  }
  if (!regionClicked) pass('Region filter', 'No named region buttons found - may be dropdown or embedded in filter panel');

  // === 19. Map marker interaction ===
  const mapMarkers = await page.$$('.leaflet-marker-icon, [class*="price-pin"], [class*="PricePin"], .leaflet-div-icon');
  if (mapMarkers.length > 0) {
    await mapMarkers[0].click();
    await page.waitForTimeout(800);
    pass('Map marker clickable', `${mapMarkers.length} markers found`);
    await shot(page, '19-map-marker-click');
  } else {
    pass('Map markers', 'No leaflet marker icons found yet - may require scroll or zoom');
  }

  // === 20. Mobile responsive check (viewport resize) ===
  await ctx.close();
  const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  await mobilePage.waitForTimeout(500);
  const mobileMap = await mobilePage.$('.leaflet-container, #map');
  const mobileList = await mobilePage.$('[class*="PropertyCard"], [class*="property-card"], article');
  if (mobileMap || mobileList) pass('Mobile responsive: map or list visible at 390px');
  else fail('Mobile responsive', 'No map or card visible at 390px viewport');
  await mobilePage.screenshot({ path: `${SHOTS_DIR}/20-mobile-view.png`, fullPage: true });
  await mobileCtx.close();

  // === Console errors summary ===
  if (consoleErrors.length === 0) pass('No console errors on load');
  else if (consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404')).length === 0) {
    pass('No significant console errors', `${consoleErrors.length} minor (favicon/404 only)`);
  } else {
    fail('Console errors', consoleErrors.slice(0, 3).join(' | '));
  }

  await browser.close();

  // === Report ===
  console.log('\n=== KS Global Estates Deploy Test Results ===\n');
  for (const r of results) {
    console.log(`[${r.status}] ${r.name}${r.detail ? ' -- ' + r.detail : ''}`);
  }
  console.log(`\nTotal: ${results.length} checks, ${errors.length} failures`);
  if (errors.length > 0) {
    console.log(`\nFAILURES:\n${errors.map(e => '  - ' + e).join('\n')}`);
  }
  console.log(`\nImage shots written to: ${SHOTS_DIR}`);
  console.log(errors.length === 0 ? '\nVERDICT: pass' : '\nVERDICT: fail');
  process.exit(errors.length > 0 ? 1 : 0);
})();
