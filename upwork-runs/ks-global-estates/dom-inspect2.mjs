import { chromium } from '/Users/michael_wegter@optum.com/Documents/projects/WegterProjects/upwork-agentic-workflow/node_modules/playwright/index.mjs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => { if (msg.type() === 'error') console.log(`[ERROR]`, msg.text()); });
  
  await page.goto('http://localhost:4090/demos/ks-global-estates/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000); // Let Leaflet init

  // Check for map container
  const mapInfo = await page.evaluate(() => {
    const leaflet = document.querySelector('.leaflet-container');
    const mapDiv = document.querySelector('#map, [class*="map"], [id*="map"]');
    return {
      leafletContainer: leaflet ? leaflet.className : null,
      mapDiv: mapDiv ? `${mapDiv.tagName} id=${mapDiv.id} class=${mapDiv.className}` : null,
      allIds: [...document.querySelectorAll('[id]')].map(el => el.id).filter(Boolean).slice(0, 20),
    };
  });
  console.log('Map info:', JSON.stringify(mapInfo, null, 2));

  // Cards
  const cardInfo = await page.evaluate(() => {
    const byClass = [...document.querySelectorAll('[class*="prop"], [class*="Prop"], [class*="card"], [class*="Card"], [class*="listing"], [class*="item"]')];
    return byClass.slice(0, 10).map(el => `${el.tagName} ${el.className.substring(0, 60)}`);
  });
  console.log('\nCard-like elements:', cardInfo);

  // Heart/favorite buttons
  const heartInfo = await page.evaluate(() => {
    const all = [...document.querySelectorAll('button, [role=button]')];
    return all.map(el => {
      const txt = el.textContent.trim();
      const label = el.getAttribute('aria-label') || '';
      const cls = el.className || '';
      return { txt: txt.substring(0, 30), label, cls: cls.substring(0, 50) };
    }).filter(b => b.txt || b.label || b.cls).slice(0, 30);
  });
  console.log('\nAll buttons:', JSON.stringify(heartInfo, null, 2));

  // Full body innerText snippet
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log('\nBody text (extended):', bodyText);
  
  await browser.close();
})();
