/**
 * AgriPro DOM inspection pass — understand actual structure
 */
import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';
import fs from 'fs';

const BASE = 'http://localhost:4030/demos/agripro/';
const SHOTS = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/image-shots';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const pg = await ctx.newPage();

await pg.goto(BASE, { waitUntil: 'networkidle' });

// --- Login screen DOM ---
const loginHTML = await pg.locator('#root').innerHTML();
console.log('=== LOGIN SCREEN (first 3000 chars) ===');
console.log(loginHTML.substring(0,3000));

// Click first button to see what it is
const btns = await pg.locator('button').all();
console.log('\n=== ALL BUTTONS ON LOGIN ===');
for (const b of btns) {
  console.log('  btn:', JSON.stringify(await b.textContent()), 'class:', await b.getAttribute('class'));
}

// Click Procurement role
for (const b of btns) {
  const t = (await b.textContent() || '').trim();
  if (t.toLowerCase().includes('procurement')) {
    await b.click();
    console.log('  Clicked:', t);
    break;
  }
}
await pg.waitForTimeout(500);

// After clicking role - what changed?
const btns2 = await pg.locator('button').all();
console.log('\n=== BUTTONS AFTER ROLE CLICK ===');
for (const b of btns2) {
  console.log('  btn:', JSON.stringify(await b.textContent()), 'class:', await b.getAttribute('class'));
}

// Click sign-in
for (const b of btns2) {
  const t = (await b.textContent() || '').toLowerCase().trim();
  if (t.includes('sign') || t.includes('access') || t.includes('enter')) {
    await b.click();
    console.log('  Clicked sign-in:', t);
    break;
  }
}
await pg.waitForTimeout(800);
await pg.screenshot({ path: `${SHOTS}/dom_post_login.png`, fullPage: true });

const postLoginHTML = await pg.locator('#root').innerHTML();
console.log('\n=== POST LOGIN DOM (first 4000 chars) ===');
console.log(postLoginHTML.substring(0,4000));

// Nav items
const navItems = await pg.locator('.nav-item').all();
console.log('\n=== NAV ITEMS ===');
for (const n of navItems) {
  console.log('  nav:', JSON.stringify(await n.textContent()), 'class:', await n.getAttribute('class'));
}

// All buttons in main app
const allBtns = await pg.locator('button').all();
console.log('\n=== ALL APP BUTTONS (first 30) ===');
for (let i=0; i<Math.min(30, allBtns.length); i++) {
  const t = await allBtns[i].textContent();
  console.log(`  [${i}]:`, JSON.stringify(t?.trim().substring(0,50)));
}

// Click first nav item that has "inspect" 
let clicked = false;
for (const n of navItems) {
  const t = (await n.textContent() || '').toLowerCase();
  if (t.includes('inspect') && !t.includes('switch')) {
    await n.click();
    clicked = true;
    console.log('\nClicked nav:', t);
    break;
  }
}

await pg.waitForTimeout(600);
await pg.screenshot({ path: `${SHOTS}/dom_inspections.png`, fullPage: true });

const inspHTML = await pg.locator('.app-content, main, #root').first().innerHTML();
console.log('\n=== INSPECTIONS CONTENT (first 3000 chars) ===');
console.log(inspHTML.substring(0,3000));

// All inputs on inspections page
const inputs = await pg.locator('input').all();
console.log('\n=== INPUTS ON INSPECTIONS PAGE ===');
for (const inp of inputs) {
  console.log('  input type:', await inp.getAttribute('type'), 'placeholder:', await inp.getAttribute('placeholder'), 'class:', await inp.getAttribute('class'));
}

// Check for table
const tables = await pg.locator('table, .data-table').all();
console.log(`\n=== TABLES: ${tables.length} ===`);
for (const t of tables) {
  const rows = await t.locator('tr').count();
  console.log('  table rows:', rows, 'class:', await t.getAttribute('class'));
}

await browser.close();
console.log('\n=== DOM INSPECTION DONE ===');
