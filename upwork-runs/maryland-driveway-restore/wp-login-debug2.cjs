const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });

  // Try each credential combo
  const creds = [
    { user: 'mdr_admin', pass: 'MDR_Restore_2026!' },
    { user: 'demo_admin', pass: 'DemoView2026!' },
    { user: 'admin', pass: 'MDR_Restore_2026!' },
    { user: 'admin', pass: 'admin' },
  ];

  for (const { user, pass } of creds) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.goto('https://api.michaelwegter.com/demos/maryland-driveway-restore/wp-login.php', {
      waitUntil: 'domcontentloaded', timeout: 20000
    });
    await page.fill('#user_login', user);
    await page.fill('#user_pass', pass);
    await Promise.all([
      page.waitForNavigation({ timeout: 15000, waitUntil: 'domcontentloaded' }).catch(() => {}),
      page.click('#wp-submit')
    ]);
    const finalUrl = page.url();
    const loggedIn = finalUrl.includes('wp-admin') && !finalUrl.includes('wp-login');
    console.log(`${user}/${pass}: ${loggedIn ? 'SUCCESS → ' + finalUrl : 'FAIL → ' + finalUrl}`);

    if (!loggedIn) {
      const errEl = await page.$('[id="login_error"]');
      if (errEl) console.log('  Error:', await errEl.innerText().catch(() => '?'));
    }
    await ctx.close();
  }

  await browser.close();
})().catch(e => console.error(e));
