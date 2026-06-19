// explore-checkout.mjs — explore Squarespace checkout structure
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.resolve(__dirname, '../upwork-runs/audio-software-engineer-needed-for/multitracks-download');

const SONGS = [
  { slug: 'greaterthangreat2021', title: 'Greater Than Great' },
  { slug: 'hewillholdmefast',     title: 'He Will Hold Me Fast' },
  { slug: '1awo364knaaosbf72yqo486kxi6btk', title: 'What A Generous God' },
];

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  // Add all songs to cart
  for (const song of SONGS) {
    await page.goto(`https://www.tommywalkerministries.org/multitracks/${song.slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const addBtn = page.locator('div.sqs-add-to-cart-button').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      console.log(`Added: ${song.title}`);
    }
  }

  // Go to cart and checkout
  await page.goto('https://www.tommywalkerministries.org/cart');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const checkoutBtn = page.locator('[data-test="proceed-to-checkout"]').or(page.locator('a:has-text("CHECKOUT")').or(page.locator('a:has-text("Checkout")'))).first();
  if (await checkoutBtn.count() > 0) {
    await checkoutBtn.click();
    await page.waitForLoadState('networkidle');
  }

  // Wait longer for checkout to render
  await page.waitForTimeout(5000);
  console.log('Checkout URL:', page.url());
  await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'checkout-wait5s.png') });

  // Check iframes
  const frames = page.frames();
  console.log(`\nFrames on page: ${frames.length}`);
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    console.log(`Frame ${i}: url=${f.url()}, name=${f.name()}`);
  }

  // Get full page HTML
  const html = await page.content();
  const checkoutHtmlPath = path.join(DOWNLOAD_DIR, 'checkout-page.html');
  fs.writeFileSync(checkoutHtmlPath, html);
  console.log(`\nFull HTML saved to ${checkoutHtmlPath}`);
  console.log('HTML length:', html.length);

  // Look for specific patterns
  const emailMatch = html.match(/email/gi);
  const inputMatch = html.match(/<input[^>]*>/gi);
  const iframeMatch = html.match(/<iframe[^>]*>/gi);
  console.log('\nEmail occurrences:', emailMatch?.length);
  console.log('Input tags:', inputMatch?.length, inputMatch?.slice(0, 5));
  console.log('Iframe tags:', iframeMatch?.length, iframeMatch);

  // Wait for any dynamic inputs
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('\nFound email input after waiting!');
    const inputs = await page.locator('input').all();
    for (const inp of inputs) {
      const attrs = await inp.evaluate(el => ({
        type: el.type, name: el.name, id: el.id, placeholder: el.placeholder, autocomplete: el.autocomplete
      }));
      console.log('Input:', attrs);
    }
  } catch (e) {
    console.log('\nNo email input found even after 10s wait');
  }

  await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'checkout-final.png') });
  await page.waitForTimeout(3000);
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
