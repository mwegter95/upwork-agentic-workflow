// checkout-multitracks.mjs — multi-step Squarespace checkout
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

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(DOWNLOAD_DIR, `${name}.png`) });
}

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

  // Go to cart + checkout
  await page.goto('https://www.tommywalkerministries.org/cart');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  const checkoutBtn = page.locator('a:has-text("CHECKOUT")').or(page.locator('a:has-text("Checkout")')).first();
  await checkoutBtn.click();
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });
  console.log('Step 1: email form');

  // STEP 1: Email
  await page.fill('input[name="email"]', 'zweetztuph@gmail.com');
  const subscribeCb = page.locator('input[name="subscribeCheckbox"]');
  if (await subscribeCb.count() > 0 && await subscribeCb.isChecked()) {
    await subscribeCb.uncheck();
    console.log('Unchecked subscribe');
  }
  await screenshot(page, '01-email-filled');

  // Click Continue after email
  const continueAfterEmail = page.locator('button:has-text("Continue")').first();
  if (await continueAfterEmail.count() > 0) {
    await continueAfterEmail.click();
    await page.waitForTimeout(2000);
    console.log('Clicked Continue after email');
    await screenshot(page, '02-after-email-continue');
  }

  // STEP 2: Billing address — wait for it to become visible
  console.log('Waiting for address form...');
  try {
    await page.waitForSelector('input[data-test="first-name"]:visible', { timeout: 10000 });
    console.log('Address form visible');
  } catch (e) {
    // Try scrolling to make it visible
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);
  }

  // Fill address fields using fill with force if needed
  const fill = async (sel, val) => {
    const el = page.locator(sel).first();
    if (await el.count() > 0) {
      await el.scrollIntoViewIfNeeded();
      await el.fill(val, { force: true });
      console.log(`Filled ${sel}: ${val}`);
    } else {
      console.log(`SKIP (not found): ${sel}`);
    }
  };

  await fill('input[data-test="first-name"]', 'Michael');
  await fill('input[data-test="last-name"]', 'Wegter');
  await fill('input[data-test="line1"]', '123 Main Street');
  await fill('input[data-test="city"]', 'Los Angeles');
  await fill('input[data-test="postal-code"]', '90041');

  // Country select
  const countrySelect = page.locator('select[data-test="country"]');
  if (await countrySelect.count() > 0) await countrySelect.selectOption({ value: 'US' });

  // Region/state
  const regionSelect = page.locator('select[data-test="region"]');
  const regionInput = page.locator('input[data-test="region"]');
  if (await regionSelect.count() > 0) {
    // Try value CA first, then label variations
    try { await regionSelect.selectOption({ value: 'CA' }); }
    catch { try { await regionSelect.selectOption({ label: 'California' }); }
      catch { await regionSelect.selectOption({ index: 5 }); } }
  }
  else if (await regionInput.count() > 0) await regionInput.fill('CA');

  await screenshot(page, '03-address-filled');

  // Continue after address
  const continueBtns = await page.locator('button:has-text("Continue")').all();
  console.log(`Found ${continueBtns.length} Continue buttons`);
  if (continueBtns.length > 0) {
    await continueBtns[continueBtns.length - 1].click();
    await page.waitForTimeout(2000);
    console.log('Clicked Continue after address');
    await screenshot(page, '04-after-address-continue');
  }

  // STEP 3: Look for Place Order / payment section
  await page.waitForTimeout(2000);
  const pageText3 = await page.locator('body').innerText().catch(() => '');
  console.log('Page text step 3 (first 1000):', pageText3.slice(0, 1000));
  await screenshot(page, '05-payment-step');

  // Place Order (for $0 orders, no payment needed)
  const placeOrderBtn = page.locator('button:has-text("Place Order")').or(
    page.locator('button:has-text("Complete Purchase")')).or(
    page.locator('button:has-text("Continue to Payment")')).or(
    page.locator('button:has-text("PURCHASE")')).or(
    page.locator('button:has-text("Purchase")')).or(
    page.locator('button[type="submit"]')).first();

  if (await placeOrderBtn.count() > 0) {
    const btnTxt = await placeOrderBtn.innerText().catch(() => '?');
    console.log(`Clicking order button: "${btnTxt}"`);
    await placeOrderBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);
    await screenshot(page, '06-post-order');
    console.log('Post-order URL:', page.url());

    const finalText = await page.locator('body').innerText().catch(() => '');
    console.log('FINAL PAGE TEXT:', finalText.slice(0, 5000));
    fs.writeFileSync(path.join(DOWNLOAD_DIR, 'final-page.html'), await page.content());
    fs.writeFileSync(path.join(DOWNLOAD_DIR, 'final-page.txt'), finalText);
  } else {
    console.log('No place order button found. Page text:', pageText3.slice(0, 500));
  }

  await page.waitForTimeout(8000);
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
