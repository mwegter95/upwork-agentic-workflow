/**
 * AgriPro targeted check: warehouse bin-cards and procurement approve button
 */
import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:4030/demos/agripro/';
const SHOTS = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/image-shots';
const R = []; let OK = true;
function log(t,ok,d=''){if(!ok)OK=false;const l=`[${ok?'PASS':'FAIL'}] ${t}${d?' — '+d:''}`;R.push(l);console.log(l);}
async function shot(p,n){return p.screenshot({path:path.join(SHOTS,n+'.png'),fullPage:true});}

const browser = await chromium.launch({ headless: true });

async function login(page, label) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const cards = await page.locator('.role-card').all();
  for (const c of cards) { if ((await c.textContent()||'').toLowerCase().includes(label.toLowerCase())) { await c.click(); await page.waitForTimeout(800); return; } }
}
async function nav(page, keyword) {
  for (const i of await page.locator('.nav-item').all()) {
    const t=(await i.textContent()||'').toLowerCase();
    if(t.includes(keyword)&&!t.includes('switch')){await i.click();await page.waitForTimeout(600);return true;}
  }
  return false;
}

// ── Warehouse tab: bin-card layout ──────────────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await login(pg, 'Warehouse');
  await nav(pg, 'warehouse');
  await shot(pg, 'targeted_01_warehouse_bins');

  // Correct selector: .bin-card (not tbody tr)
  const binCards = await pg.locator('.bin-card, [class*="bin-card"], .bin-grid .card').count();
  log('Warehouse: bin cards render (.bin-card)', binCards > 0, `${binCards} bin cards`);

  // Fill bar
  const fillBars = await pg.locator('.bin-fill-bar, [class*="bin-fill"]').count();
  log('Warehouse: bin fill bars render', fillBars > 0, `${fillBars} fill bars`);

  // Bin grid
  const binGrid = await pg.locator('.bin-grid').count();
  log('Warehouse: bin-grid container', binGrid > 0);

  // Dump bin content
  const binText = await pg.locator('.bin-grid').first().textContent().catch(()=>'');
  log('Warehouse: bin data visible', binText.length > 10, `sample: ${binText.substring(0,100)}`);

  await ctx.close();
}

// ── Procurement Board: approve button state ─────────────────────────────────
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await login(pg, 'Procurement');
  await nav(pg, 'procurement');
  await shot(pg, 'targeted_02_procurement_board');

  // Check what's on the board
  const boardHTML = await pg.locator('.app-content').first().innerHTML().catch(()=>'');
  console.log('PROCUREMENT BOARD HTML (first 2000):', boardHTML.substring(0,2000));

  // Look for any inspections needing approval
  const inspRows = await pg.locator('[class*="pending"], [class*="approval"], [class*="insp-row"]').count();
  log('Procurement: pending approval items visible', inspRows > 0, `${inspRows} items`);

  // Approve button
  const approveBtns = await pg.locator('button.btn-success, button:has-text("Approve")').count();
  log('Procurement: Approve button (btn-success)', approveBtns > 0, `${approveBtns} buttons`);

  // Campaign selection toggle to reveal approval rows
  const campaignCards = await pg.locator('[class*="campaign-card"], .card').all();
  if (campaignCards.length > 0) {
    await campaignCards[0].click();
    await pg.waitForTimeout(500);
    await shot(pg, 'targeted_03_procurement_campaign_selected');
    const approveBtns2 = await pg.locator('button:has-text("Approve"), button.btn-success').count();
    log('Procurement: Approve buttons after campaign select', approveBtns2 > 0, `${approveBtns2} buttons`);
  }

  await ctx.close();
}

// ── Procurement Inspections: verify "approve & advance" IS a real inspection action ──
{
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  await login(pg, 'Procurement');
  await nav(pg, 'inspect');

  // Click first row
  const firstRow = pg.locator('tbody tr').first();
  if (await firstRow.count() > 0) {
    await firstRow.click();
    await pg.waitForTimeout(400);
    await shot(pg, 'targeted_04_insp_row_selected');
    const approveAdv = await pg.locator('button:has-text("Approve"), button:has-text("advance")').count();
    log('Inspections: approve/advance button visible after row select', approveAdv > 0, `${approveAdv} buttons`);
    const detailPanel = await pg.locator('[class*="detail"], [class*="selected"], [class*="inspection-detail"]').count();
    log('Inspections: detail panel opens on row click', detailPanel > 0, `${detailPanel} elements`);
  }

  await ctx.close();
}

await browser.close();

console.log('\n=== TARGETED RESULTS ===');
R.forEach(r=>console.log(r));
console.log(`\nOverall: ${OK?'PASS':'FAIL'}`);
