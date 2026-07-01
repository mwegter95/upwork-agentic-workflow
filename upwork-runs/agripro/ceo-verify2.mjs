import { chromium } from 'playwright';
const url = 'http://localhost:7799/demos/agripro/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await p.waitForTimeout(1000);
// Try to enter a role. Click first button/card that looks like a role.
const labels = ['Procurement','Quality','Warehouse','Management','Enter','Continue'];
let entered = null;
for (const t of labels) {
  const el = p.locator(`text=${t}`).first();
  if (await el.count() && await el.isVisible().catch(()=>false)) {
    try { await el.click({ timeout: 2000 }); entered = t; break; } catch {}
  }
}
await p.waitForTimeout(1500);
const bodyLen = (await p.innerText('body')).length;
const navHits = [];
for (const t of ['Inspections','Procurement','Dashboards','Documents','Warehouse','Audit']) {
  if (await p.locator(`text=${t}`).first().count()) navHits.push(t);
}
// count table rows / data cells
const rows = await p.locator('table tr, [role="row"]').count().catch(()=>0);
const buttons = await p.locator('button').count().catch(()=>0);
console.log('entered role via:', entered, '| bodyTextLen after:', bodyLen);
console.log('nav/section hits:', navHits.join(', '));
console.log('table-ish rows:', rows, '| buttons:', buttons);
console.log('CONSOLE_ERRORS:', errs.length); errs.slice(0,8).forEach(e=>console.log('  -',e));
await p.screenshot({ path: 'upwork-runs/agripro/ceo-shot.png', fullPage: false });
await b.close();
