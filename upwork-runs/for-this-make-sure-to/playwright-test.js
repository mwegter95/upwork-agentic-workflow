/**
 * HealthStack Patient Portal -- deploy-test Playwright script
 * Run: node playwright-test.js
 *
 * Tests:
 *   1. work-samples route renders via SPA redirect
 *   2. Demo index loads at /demos/healthstack-patient-portal/
 *   3. Login flow (POST /healthstack/login)
 *   4. Patient dashboard loads (GET /healthstack/dashboard/patient)
 *   5. Services tab shows provider cards (GET /healthstack/services)
 *   6. Book appointment flow (POST /healthstack/book)
 *   7. Checkout flow (POST /healthstack/checkout)
 *   8. Admin login + admin dashboard (GET /healthstack/dashboard/admin)
 */

const { chromium } = require('/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/node_modules/playwright');

const DEMO_URL   = 'https://michaelwegter.com/demos/healthstack-patient-portal/';
const WS_URL     = 'https://michaelwegter.com/work-samples/healthstack-patient-portal';
const API_BASE   = 'https://api.michaelwegter.com/healthstack';

const PATIENT = { email: 'patient@healthstack.demo', password: 'DemoPatient123!' };
const ADMIN   = { email: 'admin@healthstack.demo',   password: 'DemoAdmin123!' };

const TIMEOUT = 15000; // 15s per assertion

const results = [];

function pass(name) {
  results.push({ name, ok: true });
  console.log(`  PASS  ${name}`);
}

function fail(name, reason) {
  results.push({ name, ok: false, reason });
  console.error(`  FAIL  ${name}: ${reason}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ ignoreHTTPSErrors: false });
  const page    = await ctx.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  // ------------------------------------------------------------------ TEST 1
  // Work-samples SPA route
  try {
    console.log('\n[1] work-samples route ...');
    await page.goto(WS_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    // After SPA redirect lands we should see a page with content about healthstack
    const title = await page.title();
    const body  = await page.content();
    if (body.includes('404') && !body.includes('HealthStack') && !body.includes('healthstack')) {
      fail('work-samples route renders', `Page looks like a real 404 (title: ${title})`);
    } else {
      pass('work-samples route renders');
    }
  } catch (e) {
    fail('work-samples route renders', e.message);
  }

  // ------------------------------------------------------------------ TEST 2
  // Demo index loads
  try {
    console.log('\n[2] Demo index loads ...');
    await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    const title = await page.title();
    if (!title.includes('HealthStack')) {
      fail('demo index title', `Expected "HealthStack" in title, got "${title}"`);
    } else {
      pass('demo index title');
    }

    // Wait for the root div to contain something rendered by JS
    await page.waitForFunction(() => document.getElementById('root')?.children.length > 0, { timeout: TIMEOUT });
    pass('demo JS renders');
  } catch (e) {
    fail('demo index loads', e.message);
  }

  // ------------------------------------------------------------------ TEST 3
  // Login -- patient
  try {
    console.log('\n[3] Patient login ...');
    // Look for email / password inputs
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i], input[name="email"]', { timeout: TIMEOUT });

    // Use demo-fill button if present
    const demoBtn = page.locator('button:has-text("Demo"), button:has-text("demo"), button:has-text("Fill"), button:has-text("fill")').first();
    const hasDemoBtn = await demoBtn.count() > 0;
    if (hasDemoBtn) {
      await demoBtn.click();
      await page.waitForTimeout(300);
    } else {
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]').first();
      const passInput  = page.locator('input[type="password"]').first();
      await emailInput.fill(PATIENT.email);
      await passInput.fill(PATIENT.password);
    }

    // Click sign in
    const signInBtn = page.locator('button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in"), button[type="submit"]').first();
    await signInBtn.click();

    // Wait for dashboard to appear
    await page.waitForFunction(() => {
      const body = document.body.innerText;
      return body.includes('Dashboard') || body.includes('dashboard') || body.includes('Welcome') || body.includes('Patient');
    }, { timeout: TIMEOUT });
    pass('patient login + dashboard');
  } catch (e) {
    fail('patient login', e.message);
  }

  // ------------------------------------------------------------------ TEST 4
  // Browse Providers tab
  try {
    console.log('\n[4] Browse Providers tab ...');
    const providersTab = page.locator('button:has-text("Provider"), a:has-text("Provider"), button:has-text("Browse"), a:has-text("Browse")').first();
    if (await providersTab.count() > 0) {
      await providersTab.click();
      await page.waitForTimeout(2000); // allow API call
      const cards = await page.locator('[class*="provider"], [class*="card"], [class*="service"]').count();
      if (cards >= 1) {
        pass(`browse providers tab (${cards} cards)`);
      } else {
        // Check body text for provider names
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.match(/Dr\.|Provider|Physician|Specialist|Appointment/i)) {
          pass('browse providers tab (text content found)');
        } else {
          fail('browse providers tab', `No provider cards found (${cards} matching elements)`);
        }
      }
    } else {
      fail('browse providers tab', 'No "Providers" or "Browse" tab found');
    }
  } catch (e) {
    fail('browse providers tab', e.message);
  }

  // ------------------------------------------------------------------ TEST 5
  // Book appointment
  try {
    console.log('\n[5] Book appointment flow ...');
    const bookBtn = page.locator('button:has-text("Book"), button:has-text("Appoint"), button:has-text("Schedule")').first();
    if (await bookBtn.count() > 0) {
      await bookBtn.click();
      await page.waitForTimeout(1500);

      // Look for time-slot picker
      const slot = page.locator('[class*="slot"], button:has-text("AM"), button:has-text("PM"), button:has-text(":00"), button:has-text(":30")').first();
      if (await slot.count() > 0) {
        await slot.click();
        await page.waitForTimeout(300);

        const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Book"), button[type="submit"]').last();
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
          const bodyText = await page.evaluate(() => document.body.innerText);
          if (bodyText.match(/booking|Booking|booked|confirmed|Confirmed|checkout|Checkout|pay|Pay/i)) {
            pass('book appointment + confirmation/checkout page');
          } else {
            fail('book appointment', 'No confirmation/checkout text found after booking');
          }
        } else {
          fail('book appointment', 'No Confirm button found');
        }
      } else {
        fail('book appointment', 'No time slot picker found after clicking Book');
      }
    } else {
      fail('book appointment', 'No "Book" button found on providers page');
    }
  } catch (e) {
    fail('book appointment', e.message);
  }

  // ------------------------------------------------------------------ TEST 6
  // Checkout / payment
  try {
    console.log('\n[6] Checkout / payment ...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    // We may already be on checkout from previous step
    if (bodyText.match(/pay|Pay|checkout|Checkout|order|Order|total|Total/i)) {
      const payBtn = page.locator('button:has-text("Pay"), button:has-text("pay"), button:has-text("Confirm"), button:has-text("Complete")').first();
      if (await payBtn.count() > 0) {
        await payBtn.click();
        await page.waitForTimeout(2000);
        const afterText = await page.evaluate(() => document.body.innerText);
        if (afterText.match(/success|Success|confirmed|Confirmed|pi_|Payment/i)) {
          pass('checkout + payment confirmation');
        } else {
          fail('checkout', 'No success/confirmation text after paying');
        }
      } else {
        fail('checkout', 'No Pay button found on checkout page');
      }
    } else {
      fail('checkout', 'Not on checkout page after booking step');
    }
  } catch (e) {
    fail('checkout', e.message);
  }

  // ------------------------------------------------------------------ TEST 7
  // Admin flow
  try {
    console.log('\n[7] Admin login + dashboard ...');
    // Logout first
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Log out"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Log out")').first();
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    } else {
      // Navigate back to home to reset
      await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
      await page.waitForTimeout(1000);
    }

    // Login as admin
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i], input[name="email"]', { timeout: TIMEOUT });
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]').first();
    const passInput  = page.locator('input[type="password"]').first();
    await emailInput.fill(ADMIN.email);
    await passInput.fill(ADMIN.password);
    const signInBtn = page.locator('button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in"), button[type="submit"]').first();
    await signInBtn.click();
    await page.waitForTimeout(2000);

    const adminText = await page.evaluate(() => document.body.innerText);
    if (adminText.match(/admin|Admin|Stat|Dashboard|patient|Audit|roster/i)) {
      pass('admin login + dashboard');
    } else {
      fail('admin login', `Unexpected page content after admin login`);
    }
  } catch (e) {
    fail('admin login + dashboard', e.message);
  }

  // ------------------------------------------------------------------ TEST 8
  // No critical console errors on first paint
  try {
    console.log('\n[8] Console errors check ...');
    // Re-load demo to capture first-paint errors
    const freshCtx  = await browser.newContext();
    const freshPage = await freshCtx.newPage();
    const paintErrors = [];
    freshPage.on('console', msg => { if (msg.type() === 'error') paintErrors.push(msg.text()); });
    await freshPage.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    // Filter out network errors from the still-down backend (known, not a frontend bug)
    const nonApiErrors = paintErrors.filter(e => !e.includes('api.michaelwegter.com') && !e.includes('fetch') && !e.includes('net::ERR'));
    if (nonApiErrors.length === 0) {
      pass('no critical console errors on first paint');
    } else {
      fail('console errors', nonApiErrors.join('; '));
    }
    await freshCtx.close();
  } catch (e) {
    fail('console errors check', e.message);
  }

  // ------------------------------------------------------------------ SUMMARY
  await browser.close();

  console.log('\n========================================');
  const passed = results.filter(r => r.ok).length;
  const total  = results.length;
  console.log(`Results: ${passed}/${total} passed`);
  results.filter(r => !r.ok).forEach(r => console.log(`  FAIL: ${r.name} -- ${r.reason}`));

  const verdict = results.every(r => r.ok) ? 'pass' : 'fail';
  console.log(`\nVERDICT: ${verdict}`);
  process.exitCode = verdict === 'pass' ? 0 : 1;
})();
