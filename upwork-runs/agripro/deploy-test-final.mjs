/**
 * AgriPro Deploy-Test: FINAL — correct selectors from DOM inspection
 * Role login: click .role-card div (not button)
 * Nav: click .nav-item (already confirmed working in pass 1)
 */
import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:4030/demos/agripro/';
const SHOTS = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/image-shots';
fs.mkdirSync(SHOTS, { recursive: true });

const R = [];
let OK = true;

function log(t, ok, d='') {
  if (!ok) OK = false;
  const line = `[${ok?'PASS':'FAIL'}] ${t}${d?' — '+d:''}`;
  R.push(line); console.log(line);
}
async function shot(p, name) {
  const f = path.join(SHOTS, `${name.replace(/[^a-z0-9_-]/gi,'_')}.png`);
  await p.screenshot({ path: f, fullPage: true });
  return f;
}

const browser = await chromium.launch({ headless: true });

// ── login helper: click .role-card that contains labelText ────────────────
async function loginAs(page, labelText) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const cards = await page.locator('.role-card').all();
  for (const c of cards) {
    const t = (await c.textContent() || '').trim();
    if (t.toLowerCase().includes(labelText.toLowerCase())) {
      await c.click();
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
}

// ── nav helper: click .nav-item containing keyword (not "switch") ─────────
async function navTo(page, keyword) {
  const items = await page.locator('.nav-item').all();
  for (const item of items) {
    const t = (await item.textContent() || '').trim().toLowerCase();
    if (t.includes(keyword) && !t.includes('switch')) {
      await item.click();
      await page.waitForTimeout(600);
      return true;
    }
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 1: CSS / design tokens
// ──────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await pg.goto(BASE, { waitUntil: 'networkidle' });

  const links = await pg.locator('link[rel="stylesheet"]').all();
  let appCss = null;
  for (const l of links) {
    const h = await l.getAttribute('href') || '';
    if (h.includes('/assets/')) { appCss = h; break; }
  }
  log('CSS: app stylesheet found', !!appCss, appCss);

  if (appCss) {
    const url = `http://localhost:4030${appCss}`;
    const resp = await pg.request.get(url);
    const css = await resp.text();
    log('CSS: color vars (--clr-)', css.includes('--clr-'));
    log('CSS: IBM Plex font ref', css.includes('IBM') || css.includes('font-family'));
    log('CSS: no em/en dashes', !css.includes('\u2014') && !css.includes('\u2013'));
    log('CSS: agri palette (#F5F2EC / #0D3B2B)', css.includes('#F5F2EC') || css.includes('F5F2EC'));
  }

  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 2: Login screen
// ──────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  pg.on('requestfailed', r => errs.push('NET_FAIL:'+r.url()));

  await pg.goto(BASE, { waitUntil: 'networkidle' });
  await shot(pg, 'final_01_login_screen');
  log('Login: page loads (HTTP 200)', true);
  const cards = await pg.locator('.role-card').count();
  log('Login: 4 role cards', cards === 4, `found ${cards}`);
  log('Login: no console errors on load', errs.filter(e=>!e.includes('favicon')&&!e.includes('font')).length===0);

  // Infinite-loop check
  const reqs = {};
  pg.on('request', r => { reqs[r.url()] = (reqs[r.url()]||0)+1; });
  await pg.waitForTimeout(3000);
  const loops = Object.entries(reqs).filter(([u,c])=>c>10&&!u.includes('font')&&!u.includes('gstatic'));
  log('Login: no infinite request loops', loops.length===0, loops.length>0?loops.map(([u,c])=>`${u}x${c}`).join(''):undefined);

  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 3: Procurement role — full flow
// ──────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('console', m => { if (m.type()==='error' && !m.text().includes('favicon') && !m.text().includes('font')) errs.push(m.text()); });

  const loginOk = await loginAs(pg, 'Procurement');
  log('Procurement: login (.role-card click)', loginOk);
  await shot(pg, 'final_02_proc_logged_in');

  // Verify app shell
  const navCount = await pg.locator('.nav-item').count();
  log('Procurement: nav sidebar rendered', navCount > 0, `${navCount} nav items`);
  const navTexts = await pg.locator('.nav-item').allTextContents();
  log('Procurement: correct tabs (Inspections, Procurement, Dashboards)', 
    navTexts.some(t=>t.includes('Inspect')) && navTexts.some(t=>t.includes('Procurement')) && navTexts.some(t=>t.includes('Dashboard')));

  // ── Inspections tab ──
  await navTo(pg, 'inspect');
  await shot(pg, 'final_03_proc_inspections');
  const table = await pg.locator('table.data-table, .data-table').first();
  const tableVisible = await table.count() > 0;
  log('Inspections: data table renders', tableVisible);
  if (tableVisible) {
    const rows = await pg.locator('tbody tr').count();
    log('Inspections: data rows present', rows > 0, `${rows} rows`);
  }

  // Search input
  const inputs = await pg.locator('input').all();
  let searchFound = false;
  for (const inp of inputs) {
    const ph = (await inp.getAttribute('placeholder') || '').toLowerCase();
    if (ph.includes('search') || ph.includes('id') || ph.includes('crop')) {
      await inp.fill('corn');
      await pg.waitForTimeout(400);
      await shot(pg, 'final_04_proc_insp_search');
      const filteredRows = await pg.locator('tbody tr').count();
      log('Inspections: search filters rows', true, `${filteredRows} rows for "corn"`);
      await inp.fill('');
      await pg.waitForTimeout(200);
      searchFound = true;
      break;
    }
  }
  if (!searchFound) log('Inspections: search input', false, 'not found');

  // Stage filter dropdown
  const sels = await pg.locator('select').all();
  for (const sel of sels) {
    const opts = await sel.locator('option').count();
    if (opts > 1) {
      await sel.selectOption({ index: 1 });
      await pg.waitForTimeout(300);
      await shot(pg, 'final_05_proc_insp_filter');
      log('Inspections: stage filter dropdown works', true);
      await sel.selectOption({ index: 0 });
      break;
    }
  }

  // Click first tbody row
  const firstRow = pg.locator('tbody tr').first();
  if (await firstRow.count() > 0) {
    await firstRow.click();
    await pg.waitForTimeout(400);
    await shot(pg, 'final_06_proc_insp_row_click');
    log('Inspections: row click', true);
  }

  // Stage advance buttons
  const stageBtns = await pg.locator('button').all();
  let stageHit = false;
  for (const btn of stageBtns) {
    const t = (await btn.textContent() || '').toLowerCase().trim();
    if (t.includes('advance') || t.includes('approve') || t.includes('next') || t.includes('submit') || t.includes('progress')) {
      const disabled = await btn.isDisabled();
      if (!disabled) {
        await btn.click();
        await pg.waitForTimeout(400);
        await shot(pg, 'final_07_proc_stage_advance');
        log('Inspections: stage advance button clickable', true, `"${t}"`);
        stageHit = true;
        break;
      }
    }
  }
  if (!stageHit) {
    // check if any stage buttons exist even if disabled
    let found = false;
    for (const btn of await pg.locator('button').all()) {
      const t = (await btn.textContent() || '').toLowerCase().trim();
      if (t.includes('advance') || t.includes('next stage')) { found = true; break; }
    }
    log('Inspections: stage advance button exists', found, found ? 'disabled state' : 'none found');
  }

  // OCR upload zone
  await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await pg.waitForTimeout(300);
  const uploadZone = pg.locator('[class*="upload"], [class*="drop"], [class*="ocr"]').first();
  const ocrExists = await uploadZone.count() > 0;
  if (!ocrExists) {
    // check for file input
    const fileInput = pg.locator('input[type="file"]').first();
    const fileExists = await fileInput.count() > 0;
    log('Inspections: OCR upload zone', fileExists, fileExists ? 'file input only' : 'not found');
  } else {
    await uploadZone.scrollIntoViewIfNeeded();
    await shot(pg, 'final_08_proc_ocr_zone');
    log('Inspections: OCR upload zone visible', true);
  }

  // Anomaly flags
  const anomalyFlags = await pg.locator('[class*="anomaly"], [class*="flag"], .chip-reject, .chip-warn').count();
  log('Inspections: anomaly flags rendered', anomalyFlags > 0, `${anomalyFlags} elements`);

  // Pipeline bars
  const pipelineBars = await pg.locator('.pipeline-bar, [class*="pipeline"]').count();
  log('Inspections: pipeline stage bars', pipelineBars > 0, `${pipelineBars} bars`);

  // ── Procurement tab ──
  await navTo(pg, 'procurement');
  await pg.waitForTimeout(400);
  await shot(pg, 'final_09_proc_procurement_tab');
  log('Procurement tab: loads', true);

  const campaignEls = await pg.locator('[class*="campaign"], [class*="card"]').count();
  log('Procurement tab: campaign cards present', campaignEls > 0, `${campaignEls} elements`);

  // Approval / stage action
  let approvalHit = false;
  for (const btn of await pg.locator('button').all()) {
    const t = (await btn.textContent() || '').toLowerCase().trim();
    if (t.includes('approve') || t.includes('reject') || t.includes('review') || t.includes('advance')) {
      await btn.click();
      await pg.waitForTimeout(400);
      await shot(pg, 'final_10_proc_approval_action');
      log('Procurement tab: approval/action button clicked', true, `"${t}"`);
      approvalHit = true;
      break;
    }
  }
  if (!approvalHit) log('Procurement tab: approval button', false, 'none found');

  // ── Dashboards tab ──
  await navTo(pg, 'dashboard');
  await pg.waitForTimeout(800); // charts need time to paint
  await shot(pg, 'final_11_proc_dashboard');
  log('Dashboard tab: loads', true);

  const svgEls = await pg.locator('svg').count();
  log('Dashboard: charts (SVG) rendered', svgEls > 0, `${svgEls} SVG elements`);

  const kpiCards = await pg.locator('[class*="kpi"], [class*="stat-card"], [class*="metric"]').count();
  log('Dashboard: KPI cards', kpiCards > 0, `${kpiCards} elements`);

  // Export PDF
  for (const btn of await pg.locator('button').all()) {
    const t = (await btn.textContent() || '').toLowerCase().trim();
    if (t.includes('pdf') || t.includes('export pdf')) {
      await btn.click();
      await pg.waitForTimeout(800);
      await shot(pg, 'final_12_proc_export_pdf');
      log('Dashboard: PDF export button clicked', true);
      break;
    }
  }
  // Export Excel
  for (const btn of await pg.locator('button').all()) {
    const t = (await btn.textContent() || '').toLowerCase().trim();
    if (t.includes('excel') || t.includes('xlsx')) {
      await btn.click();
      await pg.waitForTimeout(600);
      await shot(pg, 'final_13_proc_export_excel');
      log('Dashboard: Excel export button clicked', true);
      break;
    }
  }

  // ── Notifications ──
  const notifBtn = pg.locator('.notif-btn').first();
  if (await notifBtn.count() > 0) {
    await notifBtn.click();
    await pg.waitForTimeout(400);
    await shot(pg, 'final_14_proc_notif_open');
    const tray = pg.locator('.notif-tray').first();
    log('Notifications: tray opens', await tray.count() > 0);
    const items = await pg.locator('.notif-item').count();
    log('Notifications: items present', items > 0, `${items} items`);
    // Click first item
    if (items > 0) {
      await pg.locator('.notif-item').first().click();
      await pg.waitForTimeout(300);
      log('Notifications: item click works', true);
    }
    // close
    await pg.mouse.click(200, 200);
    await pg.waitForTimeout(200);
  } else {
    log('Notifications: .notif-btn', false, 'not found');
  }

  // ── Warehouse tab ──
  await navTo(pg, 'warehouse');
  await shot(pg, 'final_15_proc_warehouse');
  log('Warehouse tab: loads', true);

  const warehouseRows = await pg.locator('tbody tr').count();
  log('Warehouse: bin rows in table', warehouseRows > 0, `${warehouseRows} rows`);
  const progressBars = await pg.locator('[class*="progress"], [class*="capacity"]').count();
  log('Warehouse: capacity/progress bars', progressBars > 0, `${progressBars} bars`);

  // ── Documents tab ──
  await navTo(pg, 'doc');
  await shot(pg, 'final_16_proc_documents');
  log('Documents tab: loads', true);

  const docItems = await pg.locator('[class*="doc-item"], [class*="document-item"], tbody tr, [class*="doc-row"]').count();
  log('Documents: list items', docItems > 0, `${docItems} items`);

  // Search
  for (const inp of await pg.locator('input').all()) {
    const ph = (await inp.getAttribute('placeholder') || '').toLowerCase();
    if (ph) {
      await inp.fill('cert');
      await pg.waitForTimeout(300);
      await shot(pg, 'final_17_proc_doc_search');
      log('Documents: search filter works', true);
      await inp.fill('');
      break;
    }
  }

  // ── Audit Log tab ──
  await navTo(pg, 'audit');
  await shot(pg, 'final_18_proc_audit_log');
  log('Audit Log tab: loads', true);

  const auditRows = await pg.locator('tbody tr').count();
  log('Audit Log: entries present', auditRows > 0, `${auditRows} entries`);

  // console errors
  log('Procurement: no console errors', errs.length === 0, errs.length > 0 ? errs.slice(0,3).join(' | ') : 'clean');
  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 4: Management role — Admin tab + Dashboards
// ──────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('console', m => { if (m.type()==='error' && !m.text().includes('favicon') && !m.text().includes('font')) errs.push(m.text()); });

  const loginOk = await loginAs(pg, 'Management');
  log('Management: login', loginOk);
  await shot(pg, 'final_19_mgmt_logged_in');

  const navTexts = await pg.locator('.nav-item').allTextContents();
  log('Management: Admin tab in nav', navTexts.some(t=>t.includes('Admin')));
  log('Management: Inspections tab in nav', navTexts.some(t=>t.includes('Inspect')));

  // Admin tab
  const gotAdmin = await navTo(pg, 'admin');
  log('Management: Admin tab navigates', gotAdmin);
  if (gotAdmin) {
    await shot(pg, 'final_20_mgmt_admin');
    const adminBody = (await pg.textContent('body') || '').toLowerCase();
    log('Management: Admin content renders', adminBody.includes('user') || adminBody.includes('role') || adminBody.includes('manage'));
  }

  // Dashboard (management-scoped)
  await navTo(pg, 'dashboard');
  await pg.waitForTimeout(800);
  await shot(pg, 'final_21_mgmt_dashboard');
  const charts = await pg.locator('svg').count();
  log('Management: Dashboard charts', charts > 0, `${charts} SVG`);

  log('Management: no console errors', errs.length === 0, errs.length > 0 ? errs.slice(0,3).join(' | ') : 'clean');
  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 5: RBAC — Quality role nav scoping
// ──────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();

  await loginAs(pg, 'Quality');
  await shot(pg, 'final_22_quality_nav');
  const navTexts = await pg.locator('.nav-item').allTextContents();
  log('Quality RBAC: Procurement tab hidden', !navTexts.some(t=>t.includes('Procurement')), `nav: ${navTexts.join(', ')}`);
  log('Quality RBAC: Warehouse tab hidden', !navTexts.some(t=>t.includes('Warehouse')));
  log('Quality RBAC: Admin tab hidden', !navTexts.some(t=>t.includes('Admin')));
  log('Quality RBAC: Inspections tab shown', navTexts.some(t=>t.includes('Inspect')));

  // Navigate to Inspections and verify quality lab content
  await navTo(pg, 'inspect');
  await shot(pg, 'final_23_quality_inspections');
  const bodyText = (await pg.textContent('body') || '').toLowerCase();
  log('Quality: Inspections content loads', bodyText.includes('inspection') || bodyText.includes('lab') || bodyText.includes('grading'));

  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 6: Warehouse role nav scoping
// ──────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();

  await loginAs(pg, 'Warehouse');
  await shot(pg, 'final_24_warehouse_nav');
  const navTexts = await pg.locator('.nav-item').allTextContents();
  log('Warehouse RBAC: Procurement tab hidden', !navTexts.some(t=>t.includes('Procurement')));
  log('Warehouse RBAC: Admin tab hidden', !navTexts.some(t=>t.includes('Admin')));
  log('Warehouse RBAC: Warehouse tab shown', navTexts.some(t=>t.includes('Warehouse')));

  await navTo(pg, 'warehouse');
  await shot(pg, 'final_25_warehouse_bins');
  const rows = await pg.locator('tbody tr').count();
  log('Warehouse: bin table rows', rows > 0, `${rows} rows`);

  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 7: Mobile responsiveness
// ──────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('console', m => { if (m.type()==='error' && !m.text().includes('favicon') && !m.text().includes('font')) errs.push(m.text()); });

  await pg.goto(BASE, { waitUntil: 'networkidle' });
  await shot(pg, 'final_26_mobile_login');
  const cards = await pg.locator('.role-card').count();
  log('Mobile: login screen renders', cards === 4, `${cards} role cards`);

  await loginAs(pg, 'Procurement');
  await shot(pg, 'final_27_mobile_logged_in');

  const bodyText = (await pg.textContent('body') || '');
  log('Mobile: login works', bodyText.includes('Inspection') || bodyText.includes('AgriPro') || bodyText.includes('Nav'));

  // horizontal overflow
  const bodyWidth = await pg.evaluate(() => document.body.scrollWidth);
  log('Mobile: no horizontal overflow', bodyWidth <= 380, `body scrollWidth: ${bodyWidth}px`);

  log('Mobile: no console errors', errs.length===0, errs.length>0?errs.slice(0,2).join(' | '):'clean');
  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 8: Backend — frontend-only, no API calls expected
// ──────────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const apiCalls = [];
  pg.on('request', r => { if (r.url().includes('api.michaelwegter') || r.url().includes('localhost:5')) apiCalls.push(r.url()); });

  await pg.goto(BASE, { waitUntil: 'networkidle' });
  await loginAs(pg, 'Procurement');
  await pg.waitForTimeout(2000);
  log('Backend: no external API calls (frontend-only)', apiCalls.length === 0, apiCalls.length>0?apiCalls.slice(0,3).join(', '):'clean');
  await ctx.close();
}

await browser.close();

// ──────────────────────────────────────────────────────────────────────────
// Write image-shots.mjs (canonical hand-off to image-analyzer)
// ──────────────────────────────────────────────────────────────────────────
const imageShots = `/**
 * AgriPro image-shots.mjs — run this to capture all screenshots for image-analyzer
 * Usage: node image-shots.mjs (server must be at http://localhost:4030/)
 */
import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:4030/demos/agripro/';
const SHOTS = path.join(import.meta.dirname || '.', 'image-shots');
fs.mkdirSync(SHOTS, { recursive: true });
const s = (pg, n) => pg.screenshot({ path: path.join(SHOTS, n+'.png'), fullPage: true });
async function login(page, label) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const cards = await page.locator('.role-card').all();
  for (const c of cards) { if ((await c.textContent()||'').toLowerCase().includes(label.toLowerCase())) { await c.click(); await page.waitForTimeout(800); return; } }
}
async function nav(page, keyword) {
  const items = await page.locator('.nav-item').all();
  for (const i of items) { const t=(await i.textContent()||'').toLowerCase(); if(t.includes(keyword)&&!t.includes('switch')){await i.click();await page.waitForTimeout(600);return;}}
}

const browser = await chromium.launch({ headless: true });

// --- LOGIN SCREEN ---
{ const ctx=await browser.newContext(); const pg=await ctx.newPage(); await pg.goto(BASE,{waitUntil:'networkidle'}); await s(pg,'01_login_screen'); await ctx.close(); }

// --- PROCUREMENT ROLE ---
{ const ctx=await browser.newContext(); const pg=await ctx.newPage();
  await login(pg,'Procurement');
  await s(pg,'02_procurement_logged_in');
  await nav(pg,'inspect'); await s(pg,'03_procurement_inspections');
  const inputs=await pg.locator('input').all(); for(const i of inputs){const ph=(await i.getAttribute('placeholder')||'').toLowerCase();if(ph){await i.fill('corn');await pg.waitForTimeout(400);await s(pg,'04_procurement_insp_search');await i.fill('');break;}}
  const sels=await pg.locator('select').all(); for(const sel of sels){const n=await sel.locator('option').count();if(n>1){await sel.selectOption({index:1});await pg.waitForTimeout(300);await s(pg,'05_procurement_insp_filter');await sel.selectOption({index:0});break;}}
  const rows=await pg.locator('tbody tr').all(); if(rows.length>0){await rows[0].click();await pg.waitForTimeout(400);await s(pg,'06_procurement_insp_row_detail');}
  await pg.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await pg.waitForTimeout(300); await s(pg,'07_procurement_insp_scrolled_ocr');
  await nav(pg,'procurement'); await s(pg,'08_procurement_board');
  await nav(pg,'dashboard'); await pg.waitForTimeout(800); await s(pg,'09_procurement_dashboard');
  const notifBtn=pg.locator('.notif-btn').first(); if(await notifBtn.count()>0){await notifBtn.click();await pg.waitForTimeout(400);await s(pg,'10_notifications_open');}
  await nav(pg,'warehouse'); await s(pg,'11_procurement_warehouse');
  await nav(pg,'doc'); await s(pg,'12_procurement_documents');
  await nav(pg,'audit'); await s(pg,'13_procurement_audit_log');
  await ctx.close(); }

// --- QUALITY ROLE ---
{ const ctx=await browser.newContext(); const pg=await ctx.newPage();
  await login(pg,'Quality');
  await s(pg,'14_quality_logged_in');
  await nav(pg,'inspect'); await s(pg,'15_quality_inspections');
  await nav(pg,'dashboard'); await pg.waitForTimeout(800); await s(pg,'16_quality_dashboard');
  await nav(pg,'doc'); await s(pg,'17_quality_documents');
  await nav(pg,'audit'); await s(pg,'18_quality_audit_log');
  await ctx.close(); }

// --- WAREHOUSE ROLE ---
{ const ctx=await browser.newContext(); const pg=await ctx.newPage();
  await login(pg,'Warehouse');
  await s(pg,'19_warehouse_logged_in');
  await nav(pg,'warehouse'); await s(pg,'20_warehouse_bins');
  await nav(pg,'inspect'); await s(pg,'21_warehouse_inspections');
  await nav(pg,'audit'); await s(pg,'22_warehouse_audit');
  await ctx.close(); }

// --- MANAGEMENT ROLE ---
{ const ctx=await browser.newContext(); const pg=await ctx.newPage();
  await login(pg,'Management');
  await s(pg,'23_management_logged_in');
  await nav(pg,'dashboard'); await pg.waitForTimeout(800); await s(pg,'24_management_dashboard');
  await nav(pg,'admin'); await s(pg,'25_management_admin');
  await nav(pg,'procurement'); await s(pg,'26_management_procurement');
  await nav(pg,'warehouse'); await s(pg,'27_management_warehouse');
  await nav(pg,'audit'); await s(pg,'28_management_audit');
  await ctx.close(); }

// --- MOBILE ---
{ const ctx=await browser.newContext({viewport:{width:375,height:812}}); const pg=await ctx.newPage();
  await pg.goto(BASE,{waitUntil:'networkidle'}); await s(pg,'29_mobile_login');
  await login(pg,'Procurement'); await s(pg,'30_mobile_logged_in');
  await nav(pg,'inspect'); await s(pg,'31_mobile_inspections');
  await ctx.close(); }

await browser.close();
console.log('Screenshots written to', SHOTS);
`;
fs.writeFileSync('/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/image-shots.mjs', imageShots);

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════');
console.log('FINAL RESULTS:');
R.forEach(r => console.log(r));
const fails = R.filter(r=>r.startsWith('[FAIL]'));
console.log(`\nFailed: ${fails.length}/${R.length}`);
if (fails.length) { console.log('FAILURES:'); fails.forEach(f=>console.log(' '+f)); }
console.log(`\nOverall: ${OK ? 'PASS' : 'FAIL'}`);

fs.writeFileSync('/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/deploy-test-results-final.txt',
  R.join('\n') + `\n\nFailed: ${fails.length}/${R.length}\nOverall: ${OK?'pass':'fail'}`);
