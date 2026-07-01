#!/usr/bin/env node
const {chromium} = require('playwright');
const path = require('path');
const MEDIA = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/proposal/media';
const BASE = 'http://localhost:7777/demos/agripro/';

(async () => {
  const browser = await chromium.launch();

  // ── HERO: Procurement role → Inspections table ─────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.click('.role-card:has-text("Procurement")');
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(MEDIA, 'hero.png') });
    const s = require('fs').statSync(path.join(MEDIA, 'hero.png')).size;
    console.log('hero.png', s, 'bytes');
    await ctx.close();
  }

  // ── STEP-1: Quality/Lab role → navigate to Documents / OCR panel ──────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.click('.role-card:has-text("Quality")');
    await page.waitForTimeout(1800);
    // Try nav items to find OCR / Documents / Lab Certificates
    const navItems = await page.$$('nav li, aside li, [class*=nav-item], [class*=navItem], [class*=sidebar] a, [class*=sidebar] button, [class*=nav] a, [class*=nav] button');
    console.log('nav items found:', navItems.length);
    let clicked = false;
    for (const item of navItems) {
      const txt = (await item.innerText().catch(() => '')).toLowerCase();
      if (txt.includes('document') || txt.includes('ocr') || txt.includes('cert') || txt.includes('lab cert') || txt.includes('upload')) {
        await item.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Look for any button with OCR/Document text
      const btn = page.locator('button, a').filter({ hasText: /document|ocr|cert|upload|lab/i }).first();
      const c = await btn.count();
      if (c > 0) { await btn.click(); clicked = true; }
    }
    await page.waitForTimeout(1500);
    // If still not on OCR view, try clicking "Upload" or "Scan" button
    if (!clicked) {
      const uploads = page.locator('button').filter({ hasText: /upload|scan|ocr/i });
      if (await uploads.count() > 0) { await uploads.first().click(); await page.waitForTimeout(1000); }
    }
    await page.screenshot({ path: path.join(MEDIA, 'step-1.png') });
    const s = require('fs').statSync(path.join(MEDIA, 'step-1.png')).size;
    console.log('step-1.png', s, 'bytes');
    await ctx.close();
  }

  // ── STEP-2: Quality/Lab role → trigger anomaly flags view ─────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.click('.role-card:has-text("Quality")');
    await page.waitForTimeout(1800);
    // Find inspection with flagged/anomaly indicator and click it
    const flagged = page.locator('[class*=flag], [class*=anomal], [class*=badge], [class*=warn], [class*=reject]').first();
    const fc = await flagged.count();
    if (fc > 0) { await flagged.click().catch(() => {}); await page.waitForTimeout(800); }
    // Also try clicking a row labeled FLAGGED or REJECT
    const flagRow = page.locator('tr, [class*=row]').filter({ hasText: /flag|reject|warn|anomal/i }).first();
    if (await flagRow.count() > 0) { await flagRow.click().catch(() => {}); await page.waitForTimeout(800); }
    // Try nav to inspection/anomaly section
    const navItems = await page.$$('[class*=nav] a, [class*=nav] button, [class*=sidebar] a, [class*=sidebar] button, aside a, aside button');
    for (const item of navItems) {
      const txt = (await item.innerText().catch(() => '')).toLowerCase();
      if (txt.includes('inspection') || txt.includes('anomal') || txt.includes('flag')) {
        await item.click().catch(() => {});
        break;
      }
    }
    await page.waitForTimeout(1000);
    // Click into a flagged row/card
    const flaggedItem = page.locator('[class*=flag], [class*=anomal], [class*=badge]:has-text("REJECT"), [class*=badge]:has-text("FLAG"), tr:has-text("REJECT"), tr:has-text("FLAG")').first();
    if (await flaggedItem.count() > 0) { await flaggedItem.click().catch(() => {}); await page.waitForTimeout(1000); }
    await page.screenshot({ path: path.join(MEDIA, 'step-2.png') });
    const s = require('fs').statSync(path.join(MEDIA, 'step-2.png')).size;
    console.log('step-2.png', s, 'bytes');
    await ctx.close();
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
