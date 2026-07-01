/**
 * Final confirmation: inspect detail panel after row click
 */
import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';
import fs from 'fs';
const BASE = 'http://localhost:4030/demos/agripro/';
const SHOTS = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/image-shots';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const pg = await ctx.newPage();

await pg.goto(BASE, { waitUntil: 'networkidle' });
const cards = await pg.locator('.role-card').all();
for (const c of cards) { if ((await c.textContent()||'').includes('Procurement')) { await c.click(); break; } }
await pg.waitForTimeout(800);

// nav to inspections
for (const n of await pg.locator('.nav-item').all()) {
  const t=(await n.textContent()||'').toLowerCase();
  if(t.includes('inspect')&&!t.includes('switch')){await n.click();await pg.waitForTimeout(600);break;}
}

// Click first row
const firstRow = pg.locator('tbody tr').first();
await firstRow.click();
await pg.waitForTimeout(500);

await pg.screenshot({ path: `${SHOTS}/confirm_01_inspection_detail.png`, fullPage: true });

const detailText = (await pg.textContent('body') || '');
const hasDetail = detailText.includes('Pipeline') || detailText.includes('Close') || detailText.includes('Crop') || detailText.includes('Field Team');
console.log('Inspection detail visible after row click:', hasDetail);
console.log('Detail sample:', detailText.substring(detailText.indexOf('Close')-50, detailText.indexOf('Close')+200));

// Count all elements in the inline detail
const pipelineInDetail = await pg.locator('.pipeline-bar').count();
console.log('Pipeline bars visible:', pipelineInDetail);

// Procurement board: click campaign then check approve buttons
for (const n of await pg.locator('.nav-item').all()) {
  const t=(await n.textContent()||'').toLowerCase();
  if(t.includes('procurement')&&!t.includes('switch')){await n.click();await pg.waitForTimeout(600);break;}
}

// click first campaign card
const firstCard = pg.locator('.card').first();
await firstCard.click();
await pg.waitForTimeout(500);

await pg.screenshot({ path: `${SHOTS}/confirm_02_procurement_campaign_selected.png`, fullPage: true });

const approveBtns = await pg.locator('button:has-text("Approve"), button.btn-success').count();
console.log('Approve buttons after campaign select:', approveBtns);

// Click Approve button
if (approveBtns > 0) {
  await pg.locator('button:has-text("Approve")').first().click();
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${SHOTS}/confirm_03_approved.png`, fullPage: true });
  console.log('Approve button clicked successfully');
}

await browser.close();
console.log('DONE');
