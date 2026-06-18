// media-capture: Playwright script to record hero flow with screenshots and video
// Captures: carrier submits invoice -> underwriter approves/disburses -> admin views ledger
// Run: node media-capture.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://michaelwegter.com/demos/trucking-freight-factoring-and-banking';
const MEDIA_DIR = path.join(__dirname, 'media');
const CREDS = {
  carrier:     { email: 'carrier@factoringdemo.com',     password: 'Carrier@12345' },
  underwriter: { email: 'underwriter@factoringdemo.com', password: 'Under@12345'   },
  admin:       { email: 'admin@factoringdemo.com',        password: 'Admin@12345'   },
};

if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

let screenshotCount = 0;
async function screenshot(page, label) {
  screenshotCount++;
  const filename = `${String(screenshotCount).padStart(2, '0')}-${label.replace(/\s+/g, '_')}.png`;
  const filepath = path.join(MEDIA_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`📸 ${filename}`);
  return filepath;
}

async function login(page, role) {
  await page.goto(`${BASE}/login/`, { waitUntil: 'load', timeout: 20000 });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', CREDS[role].email);
  await page.fill('input[type="password"]', CREDS[role].password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard\//, { timeout: 10000 });
}

(async () => {
  console.log('\n=== FreightFactor Media Capture ===\n');

  const browser = await chromium.launch({
    headless: true,
  });

  // ========================================
  // Scene 1: Carrier submits invoice
  // ========================================
  console.log('\n[Scene 1] Carrier submits invoice\n');
  const carrierCtx = await browser.newContext({
    recordVideo: { dir: MEDIA_DIR }
  });
  const carrierPage = await carrierCtx.newPage();

  try {
    await login(carrierPage, 'carrier');
    await screenshot(carrierPage, '01_carrier_dashboard');

    // Go to invoice list
    await carrierPage.goto(`${BASE}/invoices/`, { waitUntil: 'load', timeout: 20000 });
    await carrierPage.waitForTimeout(1000);
    await screenshot(carrierPage, '02_invoice_list');

    // Go to submit form
    await carrierPage.goto(`${BASE}/invoices/new/`, { waitUntil: 'load', timeout: 20000 });
    await carrierPage.waitForSelector('input[placeholder="Swift Logistics Inc."]', { timeout: 10000 });
    await screenshot(carrierPage, '03_invoice_form');

    // Fill form
    await carrierPage.fill('input[placeholder="Swift Logistics Inc."]', 'Test Freight LLC');
    await carrierPage.fill('input[placeholder="CompanyA"]', 'Shipper Inc');
    await carrierPage.fill('input[placeholder="2024-06-15"]', '2026-06-10');
    await carrierPage.fill('input[placeholder="75000"]', '7500');
    await screenshot(carrierPage, '04_invoice_form_filled');

    // Submit
    const submitBtn = await carrierPage.locator('button:has-text("Submit")').first();
    await submitBtn.click();
    await carrierPage.waitForTimeout(2000);
    await screenshot(carrierPage, '05_invoice_submitted');

    console.log('✓ Carrier submitted invoice\n');
  } catch(e) {
    console.error('Carrier flow error:', e.message);
  }

  await carrierCtx.close();

  // ========================================
  // Scene 2: Underwriter approves & disburses
  // ========================================
  console.log('\n[Scene 2] Underwriter approves & disburses\n');
  const underwriterCtx = await browser.newContext({
    recordVideo: { dir: MEDIA_DIR }
  });
  const underwriterPage = await underwriterCtx.newPage();

  try {
    await login(underwriterPage, 'underwriter');
    await screenshot(underwriterPage, '06_underwriter_dashboard');

    // Go to approval queue
    await underwriterPage.goto(`${BASE}/underwriter/queue/`, { waitUntil: 'load', timeout: 20000 });
    await underwriterPage.waitForTimeout(1000);
    await screenshot(underwriterPage, '07_approval_queue');

    // Find and click first invoice (should be pending)
    const firstRow = await underwriterPage.locator('table tbody tr').first();
    await firstRow.click();
    await underwriterPage.waitForTimeout(500);

    // Approve button
    const approveBtn = await underwriterPage.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await underwriterPage.waitForTimeout(1500);
      await screenshot(underwriterPage, '08_invoice_approved');
    }

    // Disburse button
    const disburseBtn = await underwriterPage.locator('button:has-text("Disburse")').first();
    if (await disburseBtn.isVisible()) {
      await disburseBtn.click();
      await underwriterPage.waitForTimeout(1500);
      await screenshot(underwriterPage, '09_invoice_disbursed');
    }

    console.log('✓ Underwriter approved and disbursed\n');
  } catch(e) {
    console.error('Underwriter flow error:', e.message);
  }

  await underwriterCtx.close();

  // ========================================
  // Scene 3: Admin views ledger
  // ========================================
  console.log('\n[Scene 3] Admin views ledger\n');
  const adminCtx = await browser.newContext({
    recordVideo: { dir: MEDIA_DIR }
  });
  const adminPage = await adminCtx.newPage();

  try {
    await login(adminPage, 'admin');
    await screenshot(adminPage, '10_admin_dashboard');

    // Go to chart of accounts
    await adminPage.goto(`${BASE}/accounts/`, { waitUntil: 'load', timeout: 20000 });
    await adminPage.waitForTimeout(1000);
    await screenshot(adminPage, '11_chart_of_accounts');

    // Go to ledger
    await adminPage.goto(`${BASE}/ledger/`, { waitUntil: 'load', timeout: 20000 });
    await adminPage.waitForTimeout(1000);
    await screenshot(adminPage, '12_ledger_entries');

    // Scroll to see more entries if needed
    await adminPage.evaluate(() => window.scrollBy(0, 500));
    await adminPage.waitForTimeout(500);
    await screenshot(adminPage, '13_ledger_detail');

    console.log('✓ Admin viewed ledger\n');
  } catch(e) {
    console.error('Admin flow error:', e.message);
  }

  await adminCtx.close();

  await browser.close();

  console.log('\n=== Media Capture Complete ===');
  console.log(`Saved ${screenshotCount} screenshots to ${MEDIA_DIR}/\n`);
})();
