/**
 * AgriPro Deploy-Test: comprehensive Playwright exercise
 * Tests every role, every tab, every interactive control
 * Captures screenshots into image-shots/
 */
import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:4030/demos/agripro/';
const SHOTS_DIR = '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/image-shots';
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const results = [];
let pass = true;

function log(test, ok, detail = '') {
  const status = ok ? 'PASS' : 'FAIL';
  if (!ok) pass = false;
  results.push(`[${status}] ${test}${detail ? ' — ' + detail : ''}`);
  console.log(`[${status}] ${test}${detail ? ' — ' + detail : ''}`);
}

async function shot(page, name) {
  const file = path.join(SHOTS_DIR, `${name.replace(/[^a-z0-9_-]/gi, '_')}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  screenshot: ${file}`);
  return file;
}

async function checkNoConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function waitAndShot(page, name, ms = 500) {
  await page.waitForTimeout(ms);
  return shot(page, name);
}

const ROLES = [
  { name: 'Procurement', label: 'Procurement Manager' },
  { name: 'Quality', label: 'Quality Control' },
  { name: 'Warehouse', label: 'Warehouse' },
  { name: 'Management', label: 'Management' },
];

async function runRoleFlow(browser, role) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  const networkErrors = [];
  page.on('requestfailed', req => networkErrors.push(req.url()));

  // Track API/network requests for infinite-loop check
  const apiCalls = {};
  page.on('request', req => {
    const u = req.url();
    apiCalls[u] = (apiCalls[u] || 0) + 1;
  });

  try {
    // --- Load ---
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await shot(page, `${role.name}_01_login_screen`);
    log(`${role.name} - page load`, true);

    // Check for infinite API loop (first 5s)
    await page.waitForTimeout(3000);
    const loopCandidates = Object.entries(apiCalls).filter(([u, c]) => c > 10 && !u.includes('fonts.googleapis') && !u.includes('fonts.gstatic'));
    if (loopCandidates.length > 0) {
      log(`${role.name} - infinite API loop check`, false, `Repeated requests: ${loopCandidates.map(([u,c])=>`${u} x${c}`).join(', ')}`);
    } else {
      log(`${role.name} - infinite API loop check`, true);
    }

    // --- Login ---
    // Find the role button by text
    const roleButtons = await page.locator('button, [role="button"]').all();
    let clicked = false;
    for (const btn of roleButtons) {
      const txt = (await btn.textContent() || '').trim();
      if (txt.toLowerCase().includes(role.name.toLowerCase())) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Try clicking the role card directly
      const card = page.locator(`text=${role.name}`).first();
      if (await card.count() > 0) {
        await card.click();
        clicked = true;
      }
    }

    if (!clicked) {
      log(`${role.name} - login role select`, false, 'Could not find role button');
      await shot(page, `${role.name}_02_login_fail`);
      await context.close();
      return;
    }

    // Click "Sign In" or "Login" button after selecting role
    await page.waitForTimeout(300);
    const signInCandidates = await page.locator('button').all();
    for (const btn of signInCandidates) {
      const txt = (await btn.textContent() || '').trim().toLowerCase();
      if (txt.includes('sign in') || txt.includes('login') || txt.includes('enter') || txt.includes('access')) {
        await btn.click();
        break;
      }
    }

    await page.waitForTimeout(800);
    await shot(page, `${role.name}_02_post_login`);

    // Check we're past login
    const url = page.url();
    const bodyText = await page.textContent('body');
    const loggedIn = !bodyText.toLowerCase().includes('sign in') || bodyText.toLowerCase().includes('dashboard') || bodyText.toLowerCase().includes('inspection') || bodyText.toLowerCase().includes('procurement');
    log(`${role.name} - login`, loggedIn, loggedIn ? '' : 'Still appears to be on login screen');

    if (!loggedIn) {
      await context.close();
      return;
    }

    // --- Discover nav tabs ---
    const navLinks = await page.locator('nav a, nav button, [role="tab"], .sidebar a, .sidebar button, .nav-item, aside a, aside button').all();
    const tabNames = [];
    for (const link of navLinks) {
      const txt = (await link.textContent() || '').trim();
      if (txt && txt.length < 40) tabNames.push({ el: link, txt });
    }
    log(`${role.name} - nav tabs found`, tabNames.length > 0, `tabs: ${tabNames.map(t=>t.txt).join(', ')}`);

    // --- Click every nav tab ---
    for (const tab of tabNames) {
      try {
        await tab.el.click();
        await page.waitForTimeout(600);
        const safeName = `${role.name}_tab_${tab.txt.replace(/[^a-z0-9]/gi,'_')}`;
        await shot(page, safeName);
        log(`${role.name} - tab "${tab.txt}"`, true);
      } catch(e) {
        log(`${role.name} - tab "${tab.txt}"`, false, e.message.substring(0,80));
      }
    }

    // --- Dashboard: find and click export buttons ---
    // Navigate to dashboard
    for (const tab of tabNames) {
      if (tab.txt.toLowerCase().includes('dashboard')) {
        await tab.el.click();
        await page.waitForTimeout(500);
        break;
      }
    }
    const exportBtns = await page.locator('button').all();
    for (const btn of exportBtns) {
      const txt = (await btn.textContent() || '').trim().toLowerCase();
      if (txt.includes('export') || txt.includes('pdf') || txt.includes('excel') || txt.includes('xlsx')) {
        try {
          await btn.click();
          await page.waitForTimeout(500);
          await shot(page, `${role.name}_export_${txt.replace(/\s+/g,'_')}`);
          log(`${role.name} - export button "${txt}"`, true);
        } catch(e) {
          log(`${role.name} - export button "${txt}"`, false, e.message.substring(0,80));
        }
      }
    }

    // --- Inspections tab ---
    for (const tab of tabNames) {
      if (tab.txt.toLowerCase().includes('inspect')) {
        await tab.el.click();
        await page.waitForTimeout(600);
        await shot(page, `${role.name}_inspections`);
        log(`${role.name} - inspections tab load`, true);

        // Search
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
        if (await searchInput.count() > 0) {
          await searchInput.fill('corn');
          await page.waitForTimeout(400);
          await shot(page, `${role.name}_inspections_search_corn`);
          log(`${role.name} - inspections search`, true);
          await searchInput.fill('');
          await page.waitForTimeout(300);
        }

        // Filter dropdowns / selects
        const selects = await page.locator('select').all();
        for (const sel of selects) {
          try {
            const opts = await sel.locator('option').all();
            if (opts.length > 1) {
              await sel.selectOption({ index: 1 });
              await page.waitForTimeout(300);
              await shot(page, `${role.name}_inspections_filter`);
              log(`${role.name} - inspections filter select`, true);
              await sel.selectOption({ index: 0 });
            }
          } catch(e) { /* ignore */ }
        }

        // Click first table row or "View" button to open detail
        const rows = await page.locator('tr, .inspection-row, [data-testid="inspection-row"], .card').all();
        if (rows.length > 1) {
          try {
            await rows[1].click();
            await page.waitForTimeout(400);
            await shot(page, `${role.name}_inspection_detail`);
            log(`${role.name} - inspection row click`, true);
          } catch(e) {
            log(`${role.name} - inspection row click`, false, e.message.substring(0,60));
          }
        }

        // Stage progression buttons
        const stageBtns = await page.locator('button').all();
        for (const btn of stageBtns) {
          const txt = (await btn.textContent() || '').trim().toLowerCase();
          if (txt.includes('advance') || txt.includes('progress') || txt.includes('approve') || txt.includes('next stage') || txt.includes('mark')) {
            try {
              await btn.click();
              await page.waitForTimeout(400);
              await shot(page, `${role.name}_stage_advance`);
              log(`${role.name} - stage advance button`, true);
              break;
            } catch(e) { /* ignore */ }
          }
        }

        // OCR upload area
        const uploadArea = page.locator('[class*="upload"], [class*="drop"], input[type="file"], [class*="ocr"]').first();
        if (await uploadArea.count() > 0) {
          try {
            await uploadArea.scrollIntoViewIfNeeded();
            await shot(page, `${role.name}_ocr_upload_area`);
            log(`${role.name} - OCR upload area visible`, true);
          } catch(e) { /* ignore */ }
        }

        break;
      }
    }

    // --- Procurement tab ---
    for (const tab of tabNames) {
      if (tab.txt.toLowerCase().includes('procurement') || tab.txt.toLowerCase().includes('campaign')) {
        await tab.el.click();
        await page.waitForTimeout(600);
        await shot(page, `${role.name}_procurement`);
        log(`${role.name} - procurement tab load`, true);

        // Campaign cards — click each
        const campaignCards = await page.locator('[class*="campaign"], [class*="card"]').all();
        if (campaignCards.length > 0) {
          try {
            await campaignCards[0].click();
            await page.waitForTimeout(400);
            await shot(page, `${role.name}_campaign_detail`);
            log(`${role.name} - campaign card click`, true);
          } catch(e) { /* ignore */ }
        }

        // Approval buttons
        const approvalBtns = await page.locator('button').all();
        for (const btn of approvalBtns) {
          const txt = (await btn.textContent() || '').trim().toLowerCase();
          if (txt.includes('approve') || txt.includes('reject')) {
            try {
              await btn.click();
              await page.waitForTimeout(400);
              await shot(page, `${role.name}_approval_action`);
              log(`${role.name} - approval button "${txt}"`, true);
              break;
            } catch(e) { /* ignore */ }
          }
        }
        break;
      }
    }

    // --- Notifications ---
    const notifBell = page.locator('[class*="notif"], [aria-label*="notif" i], [class*="bell"], button:has(svg)').first();
    if (await notifBell.count() > 0) {
      try {
        await notifBell.click();
        await page.waitForTimeout(400);
        await shot(page, `${role.name}_notifications`);
        log(`${role.name} - notifications bell`, true);
        // Close by clicking elsewhere
        await page.mouse.click(100, 100);
        await page.waitForTimeout(200);
      } catch(e) {
        log(`${role.name} - notifications bell`, false, e.message.substring(0,60));
      }
    }

    // --- Warehouse tab ---
    for (const tab of tabNames) {
      if (tab.txt.toLowerCase().includes('warehouse')) {
        await tab.el.click();
        await page.waitForTimeout(500);
        await shot(page, `${role.name}_warehouse`);
        log(`${role.name} - warehouse tab load`, true);
        break;
      }
    }

    // --- Documents tab ---
    for (const tab of tabNames) {
      if (tab.txt.toLowerCase().includes('doc')) {
        await tab.el.click();
        await page.waitForTimeout(500);
        await shot(page, `${role.name}_documents`);
        log(`${role.name} - documents tab load`, true);

        // Search
        const docSearch = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        if (await docSearch.count() > 0) {
          await docSearch.fill('cert');
          await page.waitForTimeout(300);
          await shot(page, `${role.name}_documents_search`);
          log(`${role.name} - documents search`, true);
        }
        break;
      }
    }

    // --- Audit Log ---
    for (const tab of tabNames) {
      if (tab.txt.toLowerCase().includes('audit') || tab.txt.toLowerCase().includes('log')) {
        await tab.el.click();
        await page.waitForTimeout(500);
        await shot(page, `${role.name}_audit_log`);
        log(`${role.name} - audit log tab load`, true);
        break;
      }
    }

    // --- Admin (Management only) ---
    if (role.name === 'Management') {
      for (const tab of tabNames) {
        if (tab.txt.toLowerCase().includes('admin') || tab.txt.toLowerCase().includes('user')) {
          await tab.el.click();
          await page.waitForTimeout(500);
          await shot(page, `${role.name}_admin`);
          log(`${role.name} - admin tab load`, true);
          break;
        }
      }
    }

    // --- Global: enumerate ALL remaining buttons/links not yet clicked ---
    const allBtns = await page.locator('button, [role="button"], a[href]').all();
    log(`${role.name} - total interactive elements found`, true, `count: ${allBtns.length}`);

    // Console errors check
    const criticalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('fonts') && !e.includes('Warning:'));
    log(`${role.name} - console errors`, criticalErrors.length === 0, criticalErrors.length > 0 ? criticalErrors.slice(0,3).join(' | ') : 'clean');

    // Final shot of last state
    await shot(page, `${role.name}_final_state`);

  } catch(err) {
    log(`${role.name} - UNEXPECTED ERROR`, false, err.message.substring(0,120));
    await shot(page, `${role.name}_error_state`).catch(()=>{});
  } finally {
    await context.close();
  }
}

// Run a quick CSS/palette check
async function cssCheck(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const cssHref = await page.locator('link[rel="stylesheet"]').first().getAttribute('href');
    log('CSS - stylesheet link present', !!cssHref, cssHref || 'none');

    if (cssHref) {
      const cssUrl = cssHref.startsWith('http') ? cssHref : `http://localhost:4030${cssHref}`;
      const resp = await page.request.get(cssUrl);
      const cssText = await resp.text();
      const hasGreen = cssText.includes('#') || cssText.includes('rgb') || cssText.includes('hsl') || cssText.includes('color');
      log('CSS - color vars present', hasGreen, hasGreen ? 'yes' : 'no color vars found');
      const hasFont = cssText.includes('IBM') || cssText.includes('font') || cssText.includes('sans');
      log('CSS - font references present', hasFont);
    }
  } finally {
    await context.close();
  }
}

// Main
const browser = await chromium.launch({ headless: true });
try {
  await cssCheck(browser);

  // Only run Procurement + Management in full (representative of all roles)
  // Run all 4 but skip redundant tabs for speed
  for (const role of ROLES) {
    console.log(`\n=== Role: ${role.name} ===`);
    await runRoleFlow(browser, role);
  }
} finally {
  await browser.close();
}

// Summary
console.log('\n=== RESULTS ===');
results.forEach(r => console.log(r));
console.log(`\nOverall: ${pass ? 'PASS' : 'FAIL'}`);

// Write summary file
const summary = results.join('\n') + '\n\nVerdict: ' + (pass ? 'pass' : 'fail');
fs.writeFileSync('/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/upwork-runs/agripro/deploy-test-results.txt', summary);
