// download-order.mjs — click DOWNLOAD ITEM buttons on order confirmation page
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.resolve(__dirname, '../upwork-runs/audio-software-engineer-needed-for/multitracks-download');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// Order confirmation URL from previous run
const ORDER_URL = 'https://www.tommywalkerministries.org/commerce/orders/996b8b65-1f9e-4db6-a11f-003a92d5baaa';

const SONGS = [
  { slug: 'greaterthangreat2021', title: 'Greater Than Great' },
  { slug: 'hewillholdmefast',     title: 'He Will Hold Me Fast' },
  { slug: '1awo364knaaosbf72yqo486kxi6btk', title: 'What A Generous God' },
];

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  // First, add to cart and complete checkout to get fresh download links
  // (or navigate to order URL directly - may require session)
  console.log('Loading order page...');
  await page.goto(ORDER_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const pageText = await page.locator('body').innerText().catch(() => '');
  console.log('Order page text (first 500):', pageText.slice(0, 500));

  // Check if download links are directly accessible
  const downloadLinks = await page.locator('a:has-text("DOWNLOAD ITEM"), a:has-text("Download Item"), a[href*="download"]').all();
  console.log(`Found ${downloadLinks.length} download links`);

  if (downloadLinks.length === 0) {
    // The session may have expired - need to redo the checkout
    console.log('No download links found, redoing checkout...');
    await doCheckout(page, context);
    return;
  }

  // Save page HTML to inspect download links
  const pageHtml = await page.content();
  fs.writeFileSync(path.join(DOWNLOAD_DIR, 'order-page.html'), pageHtml);

  // Look for all href links
  const allLinks = await page.evaluate(() => {
    return [...document.querySelectorAll('a')].map(a => ({
      text: a.textContent?.trim(),
      href: a.href
    })).filter(l => l.href && (l.text?.includes('DOWNLOAD') || l.href.includes('download') || l.href.includes('.zip') || l.href.includes('.mp3')));
  });
  console.log('Download-related links:', JSON.stringify(allLinks, null, 2));

  // Click each download button
  for (let i = 0; i < downloadLinks.length; i++) {
    console.log(`\nDownloading item ${i + 1}...`);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      downloadLinks[i].click()
    ]);
    const filename = download.suggestedFilename();
    const savePath = path.join(DOWNLOAD_DIR, filename || `download-${i + 1}.zip`);
    await download.saveAs(savePath);
    console.log(`Saved: ${savePath} (${filename})`);
    await page.waitForTimeout(1000);
  }

  await browser.close();
  console.log('\nAll downloads complete. Check:', DOWNLOAD_DIR);
}

async function doCheckout(page, context) {
  const SONGS = [
    { slug: 'greaterthangreat2021' },
    { slug: 'hewillholdmefast' },
    { slug: '1awo364knaaosbf72yqo486kxi6btk' },
  ];

  for (const song of SONGS) {
    await page.goto(`https://www.tommywalkerministries.org/multitracks/${song.slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    const btn = page.locator('div.sqs-add-to-cart-button').first();
    if (await btn.count() > 0) { await btn.click(); await page.waitForTimeout(1200); }
  }

  await page.goto('https://www.tommywalkerministries.org/cart');
  await page.waitForLoadState('networkidle');
  const checkoutBtn = page.locator('a:has-text("CHECKOUT")').or(page.locator('a:has-text("Checkout")')).first();
  await checkoutBtn.click();
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  await page.fill('input[name="email"]', 'zweetztuph@gmail.com');
  const subscribeCb = page.locator('input[name="subscribeCheckbox"]');
  if (await subscribeCb.count() > 0 && await subscribeCb.isChecked()) await subscribeCb.uncheck();
  const contAfterEmail = page.locator('button:has-text("Continue")').first();
  if (await contAfterEmail.count() > 0) { await contAfterEmail.click(); await page.waitForTimeout(2000); }
  await page.waitForSelector('input[data-test="first-name"]:visible', { timeout: 10000 });
  await page.fill('input[data-test="first-name"]', 'Michael');
  await page.fill('input[data-test="last-name"]', 'Wegter');
  await page.fill('input[data-test="line1"]', '123 Main Street');
  await page.fill('input[data-test="city"]', 'Los Angeles');
  await page.fill('input[data-test="postal-code"]', '90041');
  const regionSelect = page.locator('select[data-test="region"]');
  if (await regionSelect.count() > 0) try { await regionSelect.selectOption({ value: 'CA' }); } catch {}
  const contAfterAddr = page.locator('button:has-text("Continue")').first();
  if (await contAfterAddr.count() > 0) { await contAfterAddr.click(); await page.waitForTimeout(2000); }
  await page.waitForTimeout(1000);
  const purchaseBtn = page.locator('button:has-text("PURCHASE")').or(page.locator('button:has-text("Purchase")')).first();
  await purchaseBtn.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('New order URL:', page.url());

  // Now download
  const downloadBtns = await page.locator('a:has-text("DOWNLOAD ITEM")').all();
  console.log(`Found ${downloadBtns.length} download buttons after new order`);

  const pageHtml2 = await page.content();
  fs.writeFileSync(path.join(DOWNLOAD_DIR, 'order-page2.html'), pageHtml2);

  const allLinks2 = await page.evaluate(() => {
    return [...document.querySelectorAll('a')].map(a => ({
      text: a.textContent?.trim(),
      href: a.href
    }));
  });
  console.log('ALL links on order page:', JSON.stringify(allLinks2.slice(0, 30), null, 2));

  for (let i = 0; i < downloadBtns.length; i++) {
    console.log(`Downloading item ${i + 1}...`);
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 90000 }),
        downloadBtns[i].click()
      ]);
      const filename = download.suggestedFilename();
      const savePath = path.join(DOWNLOAD_DIR, filename || `download-${i + 1}.zip`);
      await download.saveAs(savePath);
      console.log(`Saved: ${savePath}`);
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log(`Download ${i + 1} failed:`, e.message);
    }
  }

  await page.waitForTimeout(5000);
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
