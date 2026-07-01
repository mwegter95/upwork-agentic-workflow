import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}]`, msg.text()));
  page.on('pageerror', err => console.log('[ERROR]', err.message));
  
  await page.goto('http://localhost:4090/demos/ks-global-estates/', { waitUntil: 'load', timeout: 30000 });
  console.log('\n--- After load event ---');
  
  // Wait longer for React to hydrate
  await page.waitForTimeout(5000);
  console.log('\n--- After 5s wait ---');
  
  const rootInner = await page.$eval('#root', el => el.innerHTML.substring(0, 2000)).catch(() => 'no #root');
  console.log('Root innerHTML (first 2000 chars):', rootInner);
  
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('\nBody text:', bodyText);
  
  const allClasses = await page.evaluate(() => {
    return [...new Set([...document.querySelectorAll('*')].map(el => el.className).filter(c => c && typeof c === 'string'))].slice(0, 30);
  });
  console.log('\nClasses found:', allClasses);
  
  await browser.close();
})();
