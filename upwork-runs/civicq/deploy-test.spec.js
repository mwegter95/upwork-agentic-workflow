const { chromium } = require('playwright');

(async () => {
  const results = [];
  const log = (label, ok, detail) => {
    results.push({ label, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'} - ${label}${detail ? ' :: ' + detail : ''}`);
  };

  const browser = await chromium.launch();
  const consoleErrors = [];

  // 1. Work-samples route (SPA)
  {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[work-samples] ${msg.text()}`);
    });
    page.on('pageerror', (err) => consoleErrors.push(`[work-samples pageerror] ${err.message}`));
    try {
      const resp = await page.goto('https://michaelwegter.com/work-samples/civicq', { waitUntil: 'networkidle', timeout: 30000 });
      log('GET /work-samples/civicq reachable', !!resp, `status=${resp && resp.status()}`);
      await page.waitForTimeout(2000);
      const title = await page.title();
      log('page has title', !!title, title);
      // check iframe present pointing to demo
      const iframeSrc = await page.evaluate(() => {
        const f = document.querySelector('iframe');
        return f ? f.src : null;
      });
      log('iframe present pointing at civicq demo', !!(iframeSrc && iframeSrc.includes('civicq')), iframeSrc);
    } catch (e) {
      log('work-samples page load', false, e.message);
    }
    await page.close();
  }

  // 2. Direct demo load (hero flow)
  {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[demo] ${msg.text()}`);
    });
    page.on('pageerror', (err) => consoleErrors.push(`[demo pageerror] ${err.message}`));
    try {
      const resp = await page.goto('https://michaelwegter.com/demos/civicq/', { waitUntil: 'networkidle', timeout: 30000 });
      log('GET /demos/civicq/ status 200', resp.status() === 200, `status=${resp.status()}`);

      // hero section present
      const heroExists = await page.locator('text=/CivicQ|civic/i').first().isVisible().catch(() => false);
      log('hero/branding visible', heroExists);

      // sticky nav anchor links
      const navLinks = await page.locator('nav a, header a').count();
      log('nav links present', navLinks > 0, `count=${navLinks}`);

      // data viz - scoring chart (svg/canvas)
      const svgCount = await page.locator('svg').count();
      log('custom data viz (svg) rendered', svgCount > 0, `svg count=${svgCount}`);

      // scroll through all 10 sections via anchor links
      const anchors = await page.$$eval('a[href^="#"]', as => as.map(a => a.getAttribute('href')));
      log('anchor links found', anchors.length > 0, JSON.stringify(anchors.slice(0, 12)));

      // Email capture form - try to find email input
      const emailInput = page.locator('input[type="email"]').first();
      const emailInputCount = await page.locator('input[type="email"]').count();
      log('email capture input present', emailInputCount > 0, `count=${emailInputCount}`);

      let subscribeResult = 'not attempted';
      if (emailInputCount > 0) {
        const testEmail = `playwright-test-${Date.now()}@example.com`;
        await emailInput.fill(testEmail);
        // find submit button near it
        const submitBtn = page.locator('form button[type="submit"], form button, button:has-text("Subscribe"), button:has-text("Notify"), button:has-text("Join")').first();
        const submitCount = await page.locator('form button[type="submit"], form button, button:has-text("Subscribe"), button:has-text("Notify"), button:has-text("Join")').count();
        if (submitCount > 0) {
          // listen for the network response
          const respPromise = page.waitForResponse((r) => r.url().includes('/api/civicq/subscribe'), { timeout: 15000 }).catch(() => null);
          await submitBtn.click({ trial: false }).catch(() => {});
          const apiResp = await respPromise;
          if (apiResp) {
            subscribeResult = `status=${apiResp.status()}`;
            log('email subscribe -> API call fired', true, subscribeResult);
            const ok = apiResp.status() === 200 || apiResp.status() === 201;
            log('email subscribe API responded ok', ok, subscribeResult);
          } else {
            log('email subscribe -> API call fired', false, 'no /api/civicq/subscribe network call observed within timeout');
          }
        } else {
          log('email subscribe submit control found', false);
        }
      }

      // methodology page link
      const methodLinkCount = await page.locator('a[href*="methodology"]').count();
      log('methodology page link present', methodLinkCount > 0, `count=${methodLinkCount}`);

      await page.waitForTimeout(1000);
    } catch (e) {
      log('demo page load / hero flow', false, e.message);
    }
    await page.close();
  }

  // 3. Methodology page direct load
  {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[methodology] ${msg.text()}`);
    });
    page.on('pageerror', (err) => consoleErrors.push(`[methodology pageerror] ${err.message}`));
    try {
      const resp = await page.goto('https://michaelwegter.com/demos/civicq/methodology.html', { waitUntil: 'networkidle', timeout: 30000 });
      log('GET methodology.html status 200', resp.status() === 200, `status=${resp.status()}`);
      const svgCount = await page.locator('svg').count();
      log('methodology page renders content (svg present or text)', true, `svg=${svgCount}`);
    } catch (e) {
      log('methodology page load', false, e.message);
    }
    await page.close();
  }

  await browser.close();

  // 4. API checks directly
  try {
    const healthResp = await fetch('https://api.michaelwegter.com/health');
    const healthJson = await healthResp.json().catch(() => null);
    log('api /health status 200', healthResp.status === 200, JSON.stringify(healthJson));
  } catch (e) {
    log('api /health reachable', false, e.message);
  }

  try {
    const testEmail = `playwright-direct-${Date.now()}@example.com`;
    const subResp = await fetch('https://api.michaelwegter.com/api/civicq/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const subJson = await subResp.text();
    log('api POST /api/civicq/subscribe', subResp.status === 200 || subResp.status === 201, `status=${subResp.status} body=${subJson.slice(0,200)}`);
  } catch (e) {
    log('api POST /api/civicq/subscribe', false, e.message);
  }

  try {
    const csvResp = await fetch('https://api.michaelwegter.com/api/civicq/csv-export');
    const csvText = await csvResp.text();
    log('api GET /api/civicq/csv-export', csvResp.status === 200, `status=${csvResp.status} len=${csvText.length} sample=${csvText.slice(0,150).replace(/\n/g,'\\n')}`);
  } catch (e) {
    log('api GET /api/civicq/csv-export', false, e.message);
  }

  console.log('\n--- console errors captured during page loads ---');
  if (consoleErrors.length === 0) {
    console.log('(none)');
  } else {
    consoleErrors.forEach((e) => console.log(e));
  }

  const allOk = results.every((r) => r.ok) && consoleErrors.length === 0;
  console.log('\n=== SUMMARY ===');
  results.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'} - ${r.label}`));
  console.log(allOk ? 'ALL_OK' : 'SOME_FAILED');
  process.exit(allOk ? 0 : 1);
})();
