const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  await page.goto('https://api.michaelwegter.com/demos/maryland-driveway-restore/wp-login.php', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });

  const cookies = await ctx.cookies();
  console.log('Cookies before login:', JSON.stringify(cookies.map(c => ({name: c.name, value: c.value.slice(0,20)}))));

  await page.fill('#user_login', 'mdr_admin');
  await page.fill('#user_pass', 'MDR_Restore_2026!');

  const [response] = await Promise.all([
    page.waitForNavigation({ timeout: 20000, waitUntil: 'domcontentloaded' }).catch(e => ({ error: e.message })),
    page.click('#wp-submit')
  ]);

  console.log('URL after:', page.url());

  const errEl = await page.$('[id="login_error"]');
  if (errEl) {
    const errText = await errEl.innerText();
    console.log('Login error:', errText);
  }

  const cookies2 = await ctx.cookies();
  console.log('Cookies after login:', JSON.stringify(cookies2.map(c => c.name)));

  await browser.close();
})().catch(e => console.error(e));
