// checkout-and-download.mjs — complete checkout + immediate download in single session
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.resolve(__dirname, '../upwork-runs/audio-software-engineer-needed-for/multitracks-download');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

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
    console.log(`Adding: ${song.title}`);
    await page.goto(`https://www.tommywalkerministries.org/multitracks/${song.slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    const btn = page.locator('div.sqs-add-to-cart-button').first();
    if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(1200); }
  }

  // Cart
  await page.goto('https://www.tommywalkerministries.org/cart');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Checkout
  const checkoutBtn = page.locator('a:has-text("CHECKOUT")').or(page.locator('a:has-text("Checkout")')).first();
  await checkoutBtn.click();
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  console.log('Checkout form ready');

  // Fill email + unsubscribe
  await page.fill('input[name="email"]', 'zweetztuph@gmail.com');
  const subscribeCb = page.locator('input[name="subscribeCheckbox"]');
  if (await subscribeCb.count() > 0 && await subscribeCb.isChecked()) await subscribeCb.uncheck();

  // Continue to address
  await page.locator('button:has-text("Continue")').first().click();
  await page.waitForTimeout(2000);
  await page.waitForSelector('input[data-test="first-name"]:visible', { timeout: 10000 });

  // Fill address
  await page.fill('input[data-test="first-name"]', 'Michael');
  await page.fill('input[data-test="last-name"]', 'Wegter');
  await page.fill('input[data-test="line1"]', '123 Main Street');
  await page.fill('input[data-test="city"]', 'Los Angeles');
  await page.fill('input[data-test="postal-code"]', '90041');
  const regionSelect = page.locator('select[data-test="region"]');
  if (await regionSelect.count() > 0) try { await regionSelect.selectOption({ value: 'CA' }); } catch {}

  // Continue to review
  await page.locator('button:has-text("Continue")').first().click();
  await page.waitForTimeout(2000);
  console.log('On review page, placing order...');

  // Place order
  const purchaseBtn = page.locator('button:has-text("PURCHASE")').or(page.locator('button:has-text("Purchase")')).first();
  await purchaseBtn.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('Order URL:', page.url());
  const orderHtml = await page.content();
  fs.writeFileSync(path.join(DOWNLOAD_DIR, 'order-confirmation.html'), orderHtml);

  const pageText = await page.locator('body').innerText().catch(() => '');
  console.log('Order page text:', pageText.slice(0, 2000));

  // Save all links
  const allLinks = await page.evaluate(() =>
    [...document.querySelectorAll('a')].map(a => ({ text: a.textContent?.trim(), href: a.href }))
  );
  console.log('All links:', JSON.stringify(allLinks, null, 2));

  // Look for download links and buttons
  const dlButtons = await page.locator('a:has-text("DOWNLOAD ITEM"), a:has-text("Download Item"), button:has-text("DOWNLOAD"), a[href*="download"], a[href*=".zip"]').all();
  console.log(`Download buttons/links found: ${dlButtons.length}`);

  if (dlButtons.length > 0) {
    for (let i = 0; i < dlButtons.length; i++) {
      const tag = await dlButtons[i].evaluate(el => el.tagName);
      const href = await dlButtons[i].getAttribute('href').catch(() => null);
      const txt = await dlButtons[i].innerText().catch(() => '');
      console.log(`Download ${i + 1}: <${tag}> text="${txt}" href="${href}"`);

      try {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 120000 }),
          dlButtons[i].click()
        ]);
        const filename = download.suggestedFilename();
        const savePath = path.join(DOWNLOAD_DIR, filename || `multitrack-${i + 1}.zip`);
        await download.saveAs(savePath);
        const stats = fs.statSync(savePath);
        console.log(`Saved: ${savePath} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log(`Download ${i + 1} error: ${e.message}`);
        // If not downloadable, capture the URL it tries to open
        const [newPage] = await Promise.all([
          context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
          dlButtons[i].click().catch(() => {})
        ]);
        if (newPage) {
          await newPage.waitForLoadState();
          console.log(`Opened new tab: ${newPage.url()}`);
          await newPage.close();
        }
      }
    }
  } else {
    console.log('No download buttons visible on this page.');
    console.log('This may be a Squarespace bug - trying to wait and refresh...');
    await page.waitForTimeout(5000);
    await page.reload();
    await page.waitForTimeout(3000);
    const dlButtons2 = await page.locator('a:has-text("DOWNLOAD ITEM")').all();
    console.log(`After reload: ${dlButtons2.length} download buttons`);
    const refreshText = await page.locator('body').innerText().catch(() => '');
    console.log('After reload text:', refreshText.slice(0, 1000));
    fs.writeFileSync(path.join(DOWNLOAD_DIR, 'order-after-reload.html'), await page.content());
  }

  await page.waitForTimeout(5000);
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
