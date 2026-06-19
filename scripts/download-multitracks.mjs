// download-multitracks.mjs
// Downloads 3 multitrack zip files from Tommy Walker Ministries (Squarespace store)
// Usage: node scripts/download-multitracks.mjs

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_DIR = path.resolve(__dirname, '../upwork-runs/audio-software-engineer-needed-for/multitracks-download');

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const NAME_FIRST = 'Michael';
const NAME_LAST = 'Wegter';
const EMAIL = 'zweetztuph@gmail.com';

const SONGS = [
  { slug: 'greaterthangreat2021', title: 'Greater Than Great' },
  { slug: 'hewillholdmefast',     title: 'He Will Hold Me Fast' },
  { slug: '1awo364knaaosbf72yqo486kxi6btk', title: 'What A Generous God' },
];

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  // Add each song to cart
  for (const song of SONGS) {
    console.log(`\n=== Adding to cart: ${song.title} ===`);
    await page.goto(`https://www.tommywalkerministries.org/multitracks/${song.slug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Squarespace uses div[role="button"].sqs-add-to-cart-button
    const addBtn = page.locator('div.sqs-add-to-cart-button').first();
    const count = await addBtn.count();
    console.log(`Add to cart button found: ${count > 0}`);
    if (count > 0) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      console.log(`Added ${song.title} to cart`);
    } else {
      // Fallback: click any element containing "Add To Cart" text
      const fallback = page.locator('[role="button"]:has-text("Add To Cart"), div:has-text("Add To Cart")').last();
      if (await fallback.count() > 0) {
        await fallback.click();
        await page.waitForTimeout(2000);
        console.log(`Added ${song.title} (fallback) to cart`);
      } else {
        console.log(`WARNING: Could not add ${song.title} to cart`);
      }
    }
  }

  // Go to cart
  console.log('\n=== Going to cart ===');
  await page.goto('https://www.tommywalkerministries.org/cart');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const cartText = await page.locator('body').innerText().catch(() => '');
  console.log('Cart page text (first 1500):', cartText.slice(0, 1500));

  await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'cart.png') });

  // Check if cart has items
  if (cartText.includes('nothing in your shopping cart')) {
    console.log('Cart is empty — items may not have been added properly');
    console.log('Trying to add items again by navigating to the cart directly...');
  }

  // Find checkout button
  const checkoutBtn = page.locator('[data-test="proceed-to-checkout"], a:has-text("Checkout"), button:has-text("Checkout"), .cart-subtotal-checkout').first();
  if (await checkoutBtn.count() > 0) {
    console.log('Found checkout button, clicking...');
    await checkoutBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  } else {
    // Try clicking by text
    const anyCheckout = page.locator('text=Checkout').first();
    if (await anyCheckout.count() > 0) {
      await anyCheckout.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  }

  console.log('\nCheckout URL:', page.url());
  const checkoutText = await page.locator('body').innerText().catch(() => '');
  console.log('Checkout page text (first 3000):', checkoutText.slice(0, 3000));
  await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'checkout.png') });

  // Look at all input fields on checkout page
  const inputs = await page.locator('input').all();
  console.log(`\nFound ${inputs.length} input fields:`);
  for (const inp of inputs) {
    const type = await inp.getAttribute('type').catch(() => '');
    const name = await inp.getAttribute('name').catch(() => '');
    const id = await inp.getAttribute('id').catch(() => '');
    const placeholder = await inp.getAttribute('placeholder').catch(() => '');
    console.log(`  type="${type}" name="${name}" id="${id}" placeholder="${placeholder}"`);
  }

  // Fill checkout form fields
  await fillField(page, 'input[name*="first"], input[id*="first"], input[autocomplete="given-name"]', NAME_FIRST, 'first name');
  await fillField(page, 'input[name*="last"], input[id*="last"], input[autocomplete="family-name"]', NAME_LAST, 'last name');
  await fillField(page, 'input[type="email"], input[name*="email"], input[autocomplete="email"]', EMAIL, 'email');

  // Uncheck "receive emails" checkbox
  const checkboxes = await page.locator('input[type="checkbox"]').all();
  for (const cb of checkboxes) {
    const labelText = await cb.evaluate(el => {
      const lbl = document.querySelector(`label[for="${el.id}"]`) || el.closest('label');
      return lbl?.textContent?.trim() || '';
    }).catch(() => '');
    console.log(`Checkbox: "${labelText}" checked=${await cb.isChecked().catch(() => 'unknown')}`);
    if (/email|newsletter|receive|update/i.test(labelText)) {
      if (await cb.isChecked().catch(() => false)) {
        await cb.uncheck();
        console.log('Unchecked email opt-in');
      }
    }
  }

  await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'checkout-filled.png') });

  // Submit
  const submitBtn = page.locator('button[type="submit"], input[type="submit"], button:has-text("Continue"), button:has-text("Place Order"), button:has-text("Complete")').first();
  console.log(`\nSubmit button found: ${await submitBtn.count() > 0}`);
  if (await submitBtn.count() > 0) {
    const btnText = await submitBtn.innerText().catch(() => '');
    console.log('Submit button text:', btnText);
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('Post-submit URL:', page.url());
    const postText = await page.locator('body').innerText().catch(() => '');
    console.log('Post-submit text (first 3000):', postText.slice(0, 3000));
    await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'post-submit.png') });
  }

  // Wait for user to inspect if needed
  await page.waitForTimeout(5000);
  await browser.close();
  console.log('\nDone. Check', DOWNLOAD_DIR, 'for screenshots.');
}

async function fillField(page, selector, value, label) {
  const field = page.locator(selector).first();
  if (await field.count() > 0) {
    await field.fill(value);
    console.log(`Filled ${label}: ${value}`);
  } else {
    console.log(`WARNING: Could not find ${label} field (selector: ${selector})`);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
