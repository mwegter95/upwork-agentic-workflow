const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  // Enable request/response logging
  const redirects = [];
  page.on('response', resp => {
    if (resp.status() >= 300 && resp.status() < 400) {
      redirects.push(`${resp.status()} ${resp.url()} → ${resp.headers()['location']}`);
    }
  });

  await page.goto('https://api.michaelwegter.com/demos/maryland-driveway-restore/wp-login.php', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });

  // Log all cookies before login
  const cookiesBefore = await ctx.cookies();
  console.log('Cookies before login:', JSON.stringify(cookiesBefore.map(c => ({name: c.name, domain: c.domain, path: c.path}))));

  await page.fill('#user_login', 'mdr_admin');
  await page.fill('#user_pass', 'MDR_Restore_2026!');

  // Submit and track all navigations
  await page.click('#wp-submit');
  await page.waitForTimeout(5000);

  console.log('Final URL:', page.url());
  console.log('Redirects:', redirects);

  // Check for error messages
  const errEl = await page.$('[id="login_error"], .login-error, .notice-error');
  if (errEl) console.log('Login error:', await errEl.innerText());

  // Check page title and body snippet
  const title = await page.title();
  const body = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('Page title:', title);
  console.log('Body snippet:', body);

  // Get cookies after
  const cookiesAfter = await ctx.cookies();
  console.log('Cookies after:', JSON.stringify(cookiesAfter.map(c => ({name: c.name, domain: c.domain, path: c.path, value: c.value.slice(0,20)}))));

  await browser.close();
})().catch(e => console.error('ERROR:', e));
