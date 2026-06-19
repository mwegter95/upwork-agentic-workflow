// explore-multitrack-page.mjs — dump HTML and find form/button elements
import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.tommywalkerministries.org/multitracks/greaterthangreat2021');
  await page.waitForLoadState('networkidle');

  // Find all buttons, inputs, forms, and links
  const forms = await page.locator('form').all();
  console.log('Forms count:', forms.length);
  for (let i = 0; i < forms.length; i++) {
    const html = await forms[i].evaluate(el => el.outerHTML);
    console.log(`\n--- Form ${i} ---`);
    console.log(html.slice(0, 2000));
  }

  const buttons = await page.locator('button, input[type="submit"], input[type="button"]').all();
  console.log('\nButtons/inputs count:', buttons.length);
  for (const btn of buttons) {
    const html = await btn.evaluate(el => el.outerHTML);
    console.log('Button:', html.slice(0, 200));
  }

  // Find any snipcart or commerce-related elements
  const body = await page.content();
  const snipMatch = body.match(/snipcart|add-item|data-item|shopify|ecwid/gi);
  console.log('\nCommerce platform hints:', snipMatch?.slice(0, 20));

  // Get all data attributes
  const dataAttrs = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-item-id], [data-product-id], [class*="snipcart"], [class*="cart"]')];
    return els.map(el => ({ tag: el.tagName, outerHTML: el.outerHTML.slice(0, 300) }));
  });
  console.log('\nCart/product elements:', JSON.stringify(dataAttrs, null, 2));

  await browser.close();
}
run().catch(e => { console.error(e); process.exit(1); });
