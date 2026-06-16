/**
 * HealthStack Patient Portal -- deploy-test Playwright v3 (corrected selectors)
 * Updated to match actual DOM: patient has seeded booking, so CTA is
 * "+ Book another appointment", not "Browse providers".
 * Uses .btn-book and button:has-text("Confirm Appointment") as found in app.js.
 */

const { chromium } = require('/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/node_modules/playwright');

const DEMO_URL = 'https://michaelwegter.com/demos/healthstack-patient-portal/';
const WS_URL   = 'https://michaelwegter.com/work-samples/healthstack-patient-portal';
const TIMEOUT  = 15000;

const results = [];

function pass(name)         { results.push({ name, ok: true });             console.log(`  PASS  ${name}`); }
function fail(name, reason) { results.push({ name, ok: false, reason });    console.error(`  FAIL  ${name}: ${reason}`); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext();
  const page    = await ctx.newPage();

  // ------------------------------------------------------------------ TEST 1
  // Work-samples portfolio route (SPA redirect via 404.html)
  try {
    console.log('\n[1] /work-samples SPA route ...');
    const resp = await page.goto(WS_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    // After SPA redirect, title should be the site name (not a real 404 page)
    const title = await page.title();
    const content = await page.content();
    // The 404.html redirect sets a script and redirects to / which loads the React SPA
    // We expect either the React SPA title OR the redirect page (not a raw server 404)
    if (content.includes('spa-redirect') || content.includes('healthstack') || content.includes('michaelwegter')) {
      pass('work-samples SPA redirect page loads (not raw 404)');
    } else {
      fail('work-samples SPA redirect', `Unexpected content. Title: ${title}`);
    }
  } catch (e) {
    fail('work-samples SPA redirect', e.message);
  }

  // ------------------------------------------------------------------ TEST 2
  // Demo index.html structure
  try {
    console.log('\n[2] Demo index loads with correct title ...');
    await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    const title = await page.title();
    if (!title.includes('HealthStack')) {
      fail('demo title', `Got "${title}"`);
    } else {
      pass(`demo title correct ("${title}")`);
    }

    // Root div gets children
    await page.waitForFunction(() => document.getElementById('root')?.children.length > 0, { timeout: TIMEOUT });
    pass('demo React app renders into #root');
  } catch (e) {
    fail('demo index loads', e.message);
  }

  // ------------------------------------------------------------------ TEST 3
  // Login form visible with email + password + submit
  try {
    console.log('\n[3] Login form structure ...');
    await page.waitForSelector('input[type="email"]', { timeout: TIMEOUT });
    await page.waitForSelector('input[type="password"]', { timeout: TIMEOUT });
    pass('email + password inputs present');

    // Demo fill buttons present
    const patientFill = page.locator('text=patient@healthstack.demo').first();
    if (await patientFill.count() > 0) {
      pass('patient demo-fill credential button present');
    } else {
      fail('patient demo-fill button', 'Not found');
    }
  } catch (e) {
    fail('login form', e.message);
  }

  // ------------------------------------------------------------------ TEST 4
  // Attempt login -- verify whether backend is live
  let loginSucceeded = false;
  try {
    console.log('\n[4] Patient login attempt (tests backend /healthstack/login) ...');
    const emailInput = page.locator('input[type="email"]').first();
    const passInput  = page.locator('input[type="password"]').first();
    await emailInput.fill('patient@healthstack.demo');
    await passInput.fill('DemoPatient123!');

    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first();
    await submitBtn.click();

    // Wait 5 seconds and check what happened
    await page.waitForTimeout(5000);
    const bodyText = await page.evaluate(() => document.body.innerText);

    // Login SUCCESS means we left the login view -- patient dashboard shows unique elements
    // NOT present on login page: "Manage your appointments", "Log out", "Appointments (" tab
    const dashboardSignals = ['Manage your appointments', 'Appointments (', 'Log out', 'Your appointments'];
    const onDashboard = dashboardSignals.some(s => bodyText.includes(s));

    // Login FAILURE shows an error message
    const loginErrors = ['Login failed', 'Not Found', 'HTTP 404', 'Invalid', 'incorrect'];
    const hasError    = loginErrors.some(s => bodyText.includes(s)) || bodyText.includes('404');

    if (onDashboard) {
      loginSucceeded = true;
      pass('patient login succeeded (backend /healthstack/login live)');
    } else if (hasError) {
      fail('patient login', `Backend returned error. Body snippet: "${bodyText.slice(0, 200)}"`);
    } else {
      // No clear signal -- could be stuck on login page showing "patient" role tag
      const emailInputStillThere = await page.locator('input[type="email"]').count() > 0;
      if (emailInputStillThere) {
        fail('patient login', 'Still on login page after submit -- backend may be down (no explicit error shown)');
      } else {
        loginSucceeded = true;
        pass('patient login (no longer on login page)');
      }
    }
  } catch (e) {
    fail('patient login attempt', e.message);
  }

  // ------------------------------------------------------------------ TEST 5
  // Services page / Providers (only if login succeeded)
  if (loginSucceeded) {
    try {
      console.log('\n[5] Services / Providers page ...');
      // Patient has a seeded booking so CTA is "+ Book another appointment".
      // If no bookings the button is "Browse providers". Accept either.
      const browseBtn = page.locator([
        'button:has-text("Browse providers")',
        'a:has-text("Browse providers")',
        'button:has-text("Book another appointment")',
        'button:has-text("+ Book another appointment")',
      ].join(', ')).first();
      if (await browseBtn.count() > 0) {
        await browseBtn.click();
        await page.waitForTimeout(3000);

        // Services page should show provider cards
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.match(/Dr\.|Physician|Specialist|telehealth/i)) {
          pass('services page shows providers');

          // Try booking
          const bookBtn = page.locator('.btn-book, button:has-text("Book Appointment")').first();
          if (await bookBtn.count() > 0) {
            await bookBtn.click();
            await page.waitForTimeout(1500);
            const bodyAfter = await page.evaluate(() => document.body.innerText);
            if (bodyAfter.includes('Book Appointment') && bodyAfter.match(/AM|PM|\d{1,2}:\d{2}/)) {
              pass('slot picker renders after clicking Book Appointment');

              // Pick a slot
              const slot = page.locator('.time-slot, button:has-text("AM"), button:has-text("PM")').first();
              if (await slot.count() > 0) {
                await slot.click();
                await page.waitForTimeout(300);
                const confirmBtn = page.locator('button:has-text("Confirm Appointment")').first();
                if (await confirmBtn.count() > 0) {
                  await confirmBtn.click();
                  await page.waitForTimeout(3000);
                  const afterBook = await page.evaluate(() => document.body.innerText);
                  if (afterBook.match(/checkout|Checkout|pay|Pay|Order summary/i)) {
                    pass('booking confirmed -- checkout page reached');

                    // Checkout
                    const payBtn = page.locator('button:has-text("Pay $")').first();
                    if (await payBtn.count() > 0) {
                      await payBtn.click();
                      await page.waitForTimeout(3000);
                      const afterPay = await page.evaluate(() => document.body.innerText);
                      if (afterPay.match(/pi_|confirmed|success|Booking confirmed/i)) {
                        pass('payment processed -- confirmation page reached');
                      } else {
                        fail('payment', `No confirmation after Pay click. Body: "${afterPay.slice(0,150)}"`);
                      }
                    } else {
                      fail('checkout pay button', 'Pay $XX.00 button not found');
                    }
                  } else {
                    fail('post-booking page', `Expected checkout, got: "${afterBook.slice(0,150)}"`);
                  }
                } else {
                  fail('confirm appointment button', 'Not found');
                }
              } else {
                fail('time slot', 'No time slot buttons found');
              }
            } else {
              fail('slot picker', `Expected slot times, got: "${bodyAfter.slice(0,200)}"`);
            }
          } else {
            fail('book appointment button', 'No .btn-book button found on services page');
          }
        } else {
          fail('services page', `No provider data. Body: "${bodyText.slice(0,200)}"`);
        }
      } else {
        fail('browse providers navigation', '"Browse providers" button not found on patient dashboard');
      }
    } catch (e) {
      fail('services / booking flow', e.message);
    }
  } else {
    fail('services page (skipped)', 'Skipped -- login did not succeed');
    fail('book appointment (skipped)', 'Skipped -- login did not succeed');
    fail('checkout (skipped)', 'Skipped -- login did not succeed');
    fail('payment confirmation (skipped)', 'Skipped -- login did not succeed');
  }

  // ------------------------------------------------------------------ TEST 6
  // Admin login (fresh page, test backend admin auth)
  if (loginSucceeded) {
    try {
      console.log('\n[6] Admin login + dashboard ...');
      // Logout first
      const logoutBtn = page.locator('button:has-text("Log out"), button:has-text("Logout")').first();
      if (await logoutBtn.count() > 0) {
        await logoutBtn.click();
        await page.waitForTimeout(1000);
      } else {
        await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
        await page.waitForTimeout(500);
      }

      const emailInput = page.locator('input[type="email"]').first();
      const passInput  = page.locator('input[type="password"]').first();
      await emailInput.fill('admin@healthstack.demo');
      await passInput.fill('DemoAdmin123!');
      const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in")').first();
      await submitBtn.click();
      await page.waitForTimeout(5000);

      const bodyText = await page.evaluate(() => document.body.innerText);
      // Admin dashboard has unique signals not on the login page
      const adminSignals = ['Audit Log', 'Patient Roster', 'All Bookings', 'total_patients', 'admin@'];
      const onAdminDash = adminSignals.some(s => bodyText.includes(s));

      if (onAdminDash) {
        pass('admin login + admin dashboard loaded');
      } else {
        const stillOnLogin = await page.locator('input[type="email"]').count() > 0;
        if (stillOnLogin) {
          fail('admin login', 'Still on login page -- backend /healthstack/login not responding');
        } else {
          fail('admin login', `Unexpected page content: "${bodyText.slice(0,200)}"`);
        }
      }
    } catch (e) {
      fail('admin login', e.message);
    }
  } else {
    fail('admin login (skipped)', 'Skipped -- patient login did not succeed');
  }

  // ------------------------------------------------------------------ TEST 7
  // No JS errors on first paint (excluding expected API network failures)
  try {
    console.log('\n[7] Console errors on first paint ...');
    const freshCtx  = await browser.newContext();
    const freshPage = await freshCtx.newPage();
    const paintErrors = [];
    freshPage.on('console', msg => { if (msg.type() === 'error') paintErrors.push(msg.text()); });
    await freshPage.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    // Filter known-benign network errors from the API being down
    const critical = paintErrors.filter(e =>
      !e.includes('api.michaelwegter.com') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch') &&
      !e.includes('404')
    );
    if (critical.length === 0) {
      pass(`no critical JS errors on first paint (${paintErrors.length} API network errors filtered as expected)`);
    } else {
      fail('console errors', critical.join('; '));
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

  const allPass = results.every(r => r.ok);
  console.log(`\nVERDICT: ${allPass ? 'pass' : 'fail'}`);
  process.exitCode = allPass ? 0 : 1;
})();
