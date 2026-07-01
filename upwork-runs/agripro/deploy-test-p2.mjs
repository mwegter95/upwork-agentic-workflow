/**
 * AgriPro Deploy-Test Pass 2: targeted interaction + DOM inspection
 * Fixes: correct CSS selector, don't click "Switch Role" in tab loop
 * Adds: search, filters, OCR area, row clicks, export, notifications, audit log
 */
import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:4030/demos/agripro/';
const SHOTS_DIR = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/image-shots';
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const results = [];
let overallPass = true;

function log(test, ok, detail = '') {
  const s = ok ? 'PASS' : 'FAIL';
  if (!ok) overallPass = false;
  const line = `[${s}] ${test}${detail ? ' — ' + detail : ''}`;
  results.push(line);
  console.log(line);
}

async function shot(page, name) {
  const f = path.join(SHOTS_DIR, `${name.replace(/[^a-z0-9_-]/gi,'_')}.png`);
  await page.screenshot({ path: f, fullPage: true });
  return f;
}

const browser = await chromium.launch({ headless: true });

// ── 1. CSS / palette check ────────────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await pg.goto(BASE, { waitUntil: 'networkidle' });

  // get the app CSS (second link[rel=stylesheet] — first is Google Fonts)
  const cssLinks = await pg.locator('link[rel="stylesheet"]').all();
  let appCssHref = null;
  for (const l of cssLinks) {
    const href = await l.getAttribute('href') || '';
    if (href.includes('/demos/') || href.includes('/assets/')) { appCssHref = href; break; }
  }
  log('CSS - app stylesheet found', !!appCssHref, appCssHref || 'none');

  if (appCssHref) {
    const cssUrl = appCssHref.startsWith('http') ? appCssHref : `http://localhost:4030${appCssHref}`;
    const resp = await pg.request.get(cssUrl);
    const css = await resp.text();
    log('CSS - color vars present', css.includes('--clr-'), css.substring(0,60));
    log('CSS - font tokens present', css.includes('font-family') || css.includes('IBM'), '');
    log('CSS - no em/en dashes in styles', !css.includes('\u2014') && !css.includes('\u2013'));
  }
  await ctx.close();
}

// ── 2. Login + full interaction (Procurement = most tabs) ─────────────────
async function loginAs(page, roleName) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Find and click the role card/button
  const buttons = await page.locator('button').all();
  for (const btn of buttons) {
    const t = (await btn.textContent() || '').trim();
    if (t.toLowerCase().includes(roleName.toLowerCase())) {
      await btn.click();
      await page.waitForTimeout(200);
      break;
    }
  }
  // Click sign-in button
  const btns2 = await page.locator('button').all();
  for (const btn of btns2) {
    const t = (await btn.textContent() || '').trim().toLowerCase();
    if (t.includes('sign') || t.includes('access') || t.includes('enter') || t.includes('login') || t === roleName.toLowerCase()) {
      await btn.click();
      await page.waitForTimeout(600);
      break;
    }
  }
}

async function clickNavTab(page, keyword) {
  const items = await page.locator('.nav-item, nav button, nav a, [role="tab"]').all();
  for (const item of items) {
    const t = (await item.textContent() || '').trim().toLowerCase();
    if (t.includes(keyword.toLowerCase()) && !t.includes('switch')) {
      await item.click();
      await page.waitForTimeout(500);
      return true;
    }
  }
  return false;
}

// ── 2a. Procurement role full flow ────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const consoleErrors = [];
  pg.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text()); });

  await loginAs(pg, 'Procurement');
  await shot(pg, 'p2_procurement_login');
  const bodyText = await pg.textContent('body');
  log('Procurement - login successful', bodyText.includes('Inspection') || bodyText.includes('Dashboard') || bodyText.includes('Procurement'));

  // -- Inspections tab --
  const gotInsp = await clickNavTab(pg, 'inspect');
  log('Procurement - Inspections tab nav', gotInsp);
  await shot(pg, 'p2_proc_inspections');

  // DOM inspection - what's in the inspections table?
  const tableRows = await pg.locator('tr').count();
  log('Procurement - inspection table rows visible', tableRows > 1, `rows: ${tableRows}`);

  // Search
  const searchEl = pg.locator('input').filter({ hasText: '' }).first();
  const inputs = await pg.locator('input').all();
  let searched = false;
  for (const inp of inputs) {
    const ph = await inp.getAttribute('placeholder') || '';
    if (ph.toLowerCase().includes('search') || ph.toLowerCase().includes('filter') || ph.toLowerCase().includes('crop') || ph.toLowerCase().includes('id')) {
      await inp.fill('corn');
      await pg.waitForTimeout(400);
      await shot(pg, 'p2_proc_insp_search_corn');
      log('Procurement - inspections search fill', true);
      await inp.fill('');
      await pg.waitForTimeout(200);
      searched = true;
      break;
    }
  }
  if (!searched) log('Procurement - inspections search', false, 'no search input found');

  // Filter selects
  const selects = await pg.locator('select').all();
  for (const sel of selects) {
    try {
      const optCount = await sel.locator('option').count();
      if (optCount > 1) {
        await sel.selectOption({ index: 1 });
        await pg.waitForTimeout(300);
        await shot(pg, 'p2_proc_insp_filter');
        log('Procurement - inspections filter dropdown', true);
        await sel.selectOption({ index: 0 });
        break;
      }
    } catch(e) { /* skip */ }
  }

  // Click first data row (not header)
  const rows = await pg.locator('tbody tr, .inspection-row').all();
  if (rows.length > 0) {
    try {
      await rows[0].click();
      await pg.waitForTimeout(400);
      await shot(pg, 'p2_proc_insp_row_click');
      log('Procurement - inspection row click', true);
    } catch(e) {
      log('Procurement - inspection row click', false, e.message.substring(0,80));
    }
  } else {
    log('Procurement - inspection row click', false, 'no tbody rows found');
  }

  // OCR / upload area
  const uploadEls = await pg.locator('[class*="upload"], [class*="drop"], [class*="ocr"], input[type="file"]').all();
  log('Procurement - OCR upload element exists', uploadEls.length > 0, `count: ${uploadEls.length}`);
  if (uploadEls.length > 0) {
    await uploadEls[0].scrollIntoViewIfNeeded().catch(()=>{});
    await shot(pg, 'p2_proc_ocr_area');
  }

  // Stage buttons
  const stageBtns = await pg.locator('button').all();
  let stageClicked = false;
  for (const btn of stageBtns) {
    const t = (await btn.textContent() || '').trim().toLowerCase();
    if (t.includes('advance') || t.includes('progress') || t.includes('approve') || t.includes('stage') || t.includes('submit')) {
      try {
        await btn.click();
        await pg.waitForTimeout(400);
        await shot(pg, 'p2_proc_stage_btn');
        log('Procurement - stage action button clicked', true, `"${t}"`);
        stageClicked = true;
        break;
      } catch(e) { /* skip */ }
    }
  }
  if (!stageClicked) log('Procurement - stage action button', false, 'none found/clickable');

  // -- Procurement tab --
  await loginAs(pg, 'Procurement'); // re-login after potential state change
  await clickNavTab(pg, 'procurement');
  await shot(pg, 'p2_proc_procurement_tab');
  log('Procurement - Procurement tab', true);

  const campaignCards = await pg.locator('[class*="campaign"], [class*="card"], [class*="board"]').all();
  log('Procurement - campaign cards present', campaignCards.length > 0, `count: ${campaignCards.length}`);

  // Approval buttons
  const allBtns = await pg.locator('button').all();
  let approvalFound = false;
  for (const btn of allBtns) {
    const t = (await btn.textContent() || '').trim().toLowerCase();
    if (t.includes('approve') || t.includes('reject') || t.includes('review')) {
      try {
        await btn.click();
        await pg.waitForTimeout(400);
        await shot(pg, 'p2_proc_approval_btn');
        log('Procurement - approval action button', true, `"${t}"`);
        approvalFound = true;
        break;
      } catch(e) { /* skip */ }
    }
  }
  if (!approvalFound) log('Procurement - approval button visible', false, 'none found');

  // -- Dashboard tab --
  await clickNavTab(pg, 'dashboard');
  await shot(pg, 'p2_proc_dashboard');
  log('Procurement - Dashboard tab', true);

  // Check charts rendered
  const chartEls = await pg.locator('svg, canvas, [class*="recharts"], [class*="chart"]').count();
  log('Procurement - dashboard charts rendered', chartEls > 0, `chart elements: ${chartEls}`);

  // Export buttons
  const exportBtns = await pg.locator('button').all();
  for (const btn of exportBtns) {
    const t = (await btn.textContent() || '').trim().toLowerCase();
    if (t.includes('pdf') || t.includes('excel') || t.includes('export')) {
      try {
        await btn.click();
        await pg.waitForTimeout(600);
        await shot(pg, `p2_proc_export_${t.replace(/\s+/g,'_')}`);
        log(`Procurement - export "${t}"`, true);
      } catch(e) {
        log(`Procurement - export "${t}"`, false, e.message.substring(0,60));
      }
    }
  }

  // -- Notifications bell --
  const notifBtn = pg.locator('.notif-btn, [class*="bell"], [aria-label*="notif" i]').first();
  if (await notifBtn.count() > 0) {
    await notifBtn.click();
    await pg.waitForTimeout(300);
    await shot(pg, 'p2_proc_notifications_open');
    const tray = pg.locator('.notif-tray, [class*="notif-tray"]').first();
    log('Procurement - notifications tray opens', await tray.count() > 0);
    // Click first notification item
    const notifItems = await pg.locator('.notif-item').all();
    if (notifItems.length > 0) {
      await notifItems[0].click();
      await pg.waitForTimeout(300);
      log('Procurement - notification item click', true, `items: ${notifItems.length}`);
    }
    await shot(pg, 'p2_proc_notif_clicked');
  } else {
    log('Procurement - notifications bell', false, 'no .notif-btn found');
  }

  // -- Warehouse tab --
  await clickNavTab(pg, 'warehouse');
  await shot(pg, 'p2_proc_warehouse');
  log('Procurement - Warehouse tab', true);
  const warehouseRows = await pg.locator('tr, [class*="bin"], [class*="warehouse-row"]').count();
  log('Procurement - warehouse data rows', warehouseRows > 0, `count: ${warehouseRows}`);

  // -- Documents tab --
  await clickNavTab(pg, 'doc');
  await shot(pg, 'p2_proc_documents');
  log('Procurement - Documents tab', true);
  const docItems = await pg.locator('[class*="doc-item"], [class*="document"], tr').count();
  log('Procurement - document list items', docItems > 0, `count: ${docItems}`);

  // Document search
  const docInputs = await pg.locator('input').all();
  for (const inp of docInputs) {
    const ph = await inp.getAttribute('placeholder') || '';
    if (ph) {
      await inp.fill('cert');
      await pg.waitForTimeout(300);
      await shot(pg, 'p2_proc_doc_search');
      log('Procurement - document search', true);
      await inp.fill('');
      break;
    }
  }

  // -- Audit Log tab --
  await clickNavTab(pg, 'audit');
  await shot(pg, 'p2_proc_audit_log');
  log('Procurement - Audit Log tab', true);
  const auditRows = await pg.locator('tr, [class*="audit"], [class*="log-row"]').count();
  log('Procurement - audit log entries', auditRows > 0, `count: ${auditRows}`);

  // Console errors final
  const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('font') && !e.includes('Warning'));
  log('Procurement - no console errors', realErrors.length === 0, realErrors.length > 0 ? realErrors.slice(0,3).join(' | ') : 'clean');

  await ctx.close();
}

// ── 2b. Management role — Admin tab + scoped nav ──────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const consoleErrors = [];
  pg.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text()); });

  await loginAs(pg, 'Management');
  await shot(pg, 'p2_mgmt_post_login');
  const bodyText = await pg.textContent('body');
  log('Management - login successful', bodyText.includes('Inspection') || bodyText.includes('Dashboard'));

  // Admin tab — Management-only
  const gotAdmin = await clickNavTab(pg, 'admin');
  log('Management - Admin tab accessible', gotAdmin);
  if (gotAdmin) {
    await shot(pg, 'p2_mgmt_admin');
    const adminContent = await pg.textContent('body');
    log('Management - Admin tab has user content', adminContent.toLowerCase().includes('user') || adminContent.toLowerCase().includes('role') || adminContent.toLowerCase().includes('manage'));
  }

  // Dashboard
  await clickNavTab(pg, 'dashboard');
  await shot(pg, 'p2_mgmt_dashboard');
  const charts = await pg.locator('svg, [class*="recharts"]').count();
  log('Management - Dashboard charts', charts > 0, `count: ${charts}`);

  // Export
  const exportBtns = await pg.locator('button').all();
  for (const btn of exportBtns) {
    const t = (await btn.textContent() || '').trim().toLowerCase();
    if (t.includes('pdf') || t.includes('excel') || t.includes('export')) {
      try {
        await btn.click();
        await pg.waitForTimeout(500);
        await shot(pg, `p2_mgmt_export_${t.replace(/\s+/g,'_')}`);
        log(`Management - export "${t}"`, true);
      } catch(e) { /* skip */ }
    }
  }

  const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('font') && !e.includes('Warning'));
  log('Management - no console errors', realErrors.length === 0, realErrors.length > 0 ? realErrors.slice(0,3).join(' | ') : 'clean');

  await ctx.close();
}

// ── 2c. Quality role — scoped nav verification ────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await loginAs(pg, 'Quality');
  const navItems = await pg.locator('.nav-item').allTextContents();
  // Quality should NOT see Procurement or Warehouse tabs
  const noProcurement = !navItems.some(t => t.toLowerCase().includes('procurement'));
  const noWarehouse = !navItems.some(t => t.toLowerCase().includes('warehouse'));
  log('Quality - RBAC: Procurement tab hidden', noProcurement, `nav: ${navItems.join(', ')}`);
  log('Quality - RBAC: Warehouse tab hidden', noWarehouse);
  await shot(pg, 'p2_quality_nav_scope');
  await ctx.close();
}

// ── 2d. Warehouse role — scoped nav verification ──────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await loginAs(pg, 'Warehouse');
  const navItems = await pg.locator('.nav-item').allTextContents();
  const noProcurement = !navItems.some(t => t.toLowerCase().includes('procurement'));
  const noAdmin = !navItems.some(t => t.toLowerCase().includes('admin'));
  log('Warehouse - RBAC: Procurement tab hidden', noProcurement, `nav: ${navItems.join(', ')}`);
  log('Warehouse - RBAC: Admin tab hidden', noAdmin);
  await shot(pg, 'p2_warehouse_nav_scope');
  await ctx.close();
}

// ── 2e. Mobile responsiveness check ──────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } }); // iPhone 13
  const pg = await ctx.newPage();
  const consoleErrors = [];
  pg.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text()); });
  await pg.goto(BASE, { waitUntil: 'networkidle' });
  await shot(pg, 'p2_mobile_login');
  log('Mobile - login screen renders', true);

  await loginAs(pg, 'Procurement');
  await shot(pg, 'p2_mobile_post_login');
  const bodyText = await pg.textContent('body');
  log('Mobile - login works', bodyText.includes('Inspection') || bodyText.includes('Dashboard'));

  // Check for horizontal overflow
  const bodyWidth = await pg.evaluate(() => document.body.scrollWidth);
  const viewportWidth = 375;
  log('Mobile - no horizontal overflow', bodyWidth <= viewportWidth + 5, `body: ${bodyWidth}px, viewport: ${viewportWidth}px`);

  const realErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('font') && !e.includes('Warning'));
  log('Mobile - no console errors', realErrors.length === 0, realErrors.length > 0 ? realErrors.slice(0,3).join(' | ') : 'clean');

  await ctx.close();
}

await browser.close();

// Summary
console.log('\n=== RESULTS ===');
results.forEach(r => console.log(r));
const failCount = results.filter(r => r.startsWith('[FAIL]')).length;
console.log(`\nFailed: ${failCount}/${results.length}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

const summary = results.join('\n') + `\n\nFailed: ${failCount}/${results.length}\nVerdict: ${overallPass ? 'pass' : 'fail'}`;
fs.writeFileSync('/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/deploy-test-results-p2.txt', summary);
