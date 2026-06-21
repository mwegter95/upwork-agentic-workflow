import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const DEMO_URL = 'https://michaelwegter.com/demos/adverteyes/';
const MEDIA_DIR = path.join(process.cwd(), 'upwork-runs/adverteyes/media');

async function captureMedia() {
  // Create media directory
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: MEDIA_DIR, size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  try {
    // Navigate to demo
    console.log('Loading demo...');
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take login screenshot
    console.log('Capturing login screen...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '01-login.png'), fullPage: true });

    // Login as admin
    console.log('Logging in as admin...');
    await page.fill('input[type="email"]', 'admin@adverteyes.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Dashboard screenshot
    console.log('Capturing dashboard...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '02-dashboard.png'), fullPage: true });

    // Navigate to Campaigns
    console.log('Navigating to Campaigns...');
    await page.click('a:has-text("Campaigns")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(MEDIA_DIR, '03-campaigns.png'), fullPage: true });

    // Navigate to Inventory
    console.log('Navigating to Inventory...');
    await page.click('a:has-text("Inventory")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(MEDIA_DIR, '04-inventory.png'), fullPage: true });

    // Navigate to Bookings
    console.log('Navigating to Bookings...');
    await page.click('a:has-text("Bookings")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(MEDIA_DIR, '05-bookings.png'), fullPage: true });

    // Navigate to Analytics
    console.log('Navigating to Analytics...');
    await page.click('a:has-text("Analytics")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(MEDIA_DIR, '06-analytics.png'), fullPage: true });

    // Go back to campaigns and show detail
    console.log('Showing campaign detail...');
    await page.click('a:has-text("Campaigns")');
    await page.waitForTimeout(1000);
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(MEDIA_DIR, '07-campaign-detail.png'), fullPage: true });

    console.log('Closing browser...');
    const recordingPath = path.join(MEDIA_DIR, 'hero-flow.webm');

    await context.close();
    await browser.close();

    // Rename video if it exists
    const videos = fs.readdirSync(MEDIA_DIR).filter(f => f.endsWith('.webm'));
    if (videos.length > 0 && videos[0] !== 'hero-flow.webm') {
      fs.renameSync(
        path.join(MEDIA_DIR, videos[0]),
        recordingPath
      );
    }

    console.log(`\n✓ Media capture complete. Files in ${MEDIA_DIR}:`);
    fs.readdirSync(MEDIA_DIR).forEach(f => {
      const size = fs.statSync(path.join(MEDIA_DIR, f)).size;
      console.log(`  - ${f} (${(size / 1024 / 1024).toFixed(2)}MB)`);
    });

  } catch (error) {
    console.error('✗ Error during media capture:', error.message);
    console.error(error.stack);
    try {
      await context.close();
    } catch (e) {}
    await browser.close();
    process.exit(1);
  }
}

captureMedia();
