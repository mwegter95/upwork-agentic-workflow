import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => { if (msg.type() === 'error') console.log(`[ERROR]`, msg.text()); });
  
  await page.goto('http://localhost:4090/demos/ks-global-estates/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Get all buttons including those we might have missed
  const allBtnsExtended = await page.evaluate(() => {
    const all = [...document.querySelectorAll('button, [role=button], [class*="heart"], [class*="Heart"], [class*="fav"], [class*="Fav"]')];
    return all.map(el => ({
      tag: el.tagName,
      txt: el.textContent.trim().substring(0, 30),
      label: el.getAttribute('aria-label') || '',
      cls: (el.className || '').substring(0, 60)
    }));
  });
  console.log('All interactive (all):', JSON.stringify(allBtnsExtended.slice(0, 50), null, 2));

  // Click first card and dump detail
  const firstCard = await page.$('article.prop-card');
  if (firstCard) {
    console.log('\nClicking first card...');
    await firstCard.click();
    await page.waitForTimeout(1500);
    const afterClick = await page.evaluate(() => {
      const detail = document.querySelector('[class*="detail"], [class*="Detail"], [role="dialog"], [class*="panel"], [class*="Panel"]');
      if (detail) return { found: true, cls: detail.className, html: detail.innerHTML.substring(0, 1500) };
      return { found: false, body: document.body.innerHTML.substring(0, 1000) };
    });
    console.log('After card click:', JSON.stringify(afterClick, null, 2));
  }

  await browser.close();
})();
