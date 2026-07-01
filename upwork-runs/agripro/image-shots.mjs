/**
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
