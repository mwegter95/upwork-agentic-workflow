#!/usr/bin/env node
import { chromium } from 'playwright';
import { statSync } from 'fs';
import path from 'path';
const MEDIA = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/proposal/media';
const BASE = 'http://localhost:7777/demos/agripro/';

const browser = await chromium.launch();

// ── HERO: Procurement role → inspections table visible ─────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.click('.role-card:has-text("Procurement")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(MEDIA, 'hero.png') });
  console.log('hero.png', statSync(path.join(MEDIA, 'hero.png')).size, 'bytes');
  await ctx.close();
}

// ── STEP-1: Quality/Lab → navigate to Documents/OCR panel ──────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.click('.role-card:has-text("Quality")');
  await page.waitForTimeout(2000);
  // Inspect sidebar nav
  const allNavText = await page.evaluate(() => {
    const els = document.querySelectorAll('nav *, aside *, [class*="nav"] *, [class*="sidebar"] *');
    return Array.from(els).map(e => e.textContent?.trim()).filter(t => t && t.length < 40);
  });
  console.log('nav text items:', JSON.stringify([...new Set(allNavText)].slice(0,30)));
  // Look for documents/lab/OCR nav item
  let clicked = false;
  for (const txt of ['Documents', 'Lab Certs', 'OCR', 'Certificates', 'Upload', 'Lab', 'Scan']) {
    const el = page.locator(`text="${txt}"`).first();
    if (await el.count() > 0) {
      await el.click().catch(() => {});
      clicked = true;
      console.log('clicked nav:', txt);
      break;
    }
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(MEDIA, 'step-1.png') });
  console.log('step-1.png', statSync(path.join(MEDIA, 'step-1.png')).size, 'bytes');
  await ctx.close();
}

// ── STEP-2: Quality/Lab → anomaly detection flags visible ──────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 860 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.click('.role-card:has-text("Quality")');
  await page.waitForTimeout(2000);
  // Navigate to inspections
  for (const txt of ['Inspections', 'Quality', 'Anomaly', 'Flagged', 'Grading']) {
    const el = page.locator(`[class*="nav"] >> text="${txt}"`).first();
    if (await el.count() > 0) {
      await el.click().catch(() => {});
      console.log('nav clicked:', txt);
      break;
    }
  }
  await page.waitForTimeout(1000);
  // Click first flagged/rejected row
  const flagged = page.locator('tr:has-text("REJECT"), tr:has-text("FLAG"), tr:has-text("Flagged"), [class*="flag"]').first();
  if (await flagged.count() > 0) {
    await flagged.click().catch(() => {});
    await page.waitForTimeout(1200);
    console.log('clicked flagged row');
  }
  await page.screenshot({ path: path.join(MEDIA, 'step-2.png') });
  console.log('step-2.png', statSync(path.join(MEDIA, 'step-2.png')).size, 'bytes');
  await ctx.close();
}

await browser.close();
console.log('Done.');
