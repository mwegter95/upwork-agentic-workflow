const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEMO_URL = 'https://michaelwegter.com/demos/construction-company-website/';
const OUTPUT_DIR = path.join(__dirname, 'media');

async function captureMedia() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  console.log('Starting media capture...\n');

  try {
    // 1. Homepage Hero
    console.log('1. Capturing homepage hero...');
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('video', { timeout: 5000 }).catch(() => null);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01-hero.png'),
      fullPage: false
    });
    console.log('   ✓ Homepage screenshot saved');

    // Scroll to show more of homepage
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02-hero-scrolled.png'),
      fullPage: false
    });
    console.log('   ✓ Homepage scrolled screenshot saved');

    // 2. Services Page
    console.log('\n2. Capturing services page...');
    await page.goto(`${DEMO_URL}services.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03-services.png'),
      fullPage: false
    });
    console.log('   ✓ Services page screenshot saved');

    // Scroll to show pricing tiers
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04-services-scrolled.png'),
      fullPage: false
    });
    console.log('   ✓ Services pricing screenshot saved');

    // 3. Projects Gallery
    console.log('\n3. Capturing projects page...');
    await page.goto(`${DEMO_URL}projects.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05-projects.png'),
      fullPage: false
    });
    console.log('   ✓ Projects page screenshot saved');

    // Filter interaction
    const filterButtons = await page.locator('[data-filter]').count().catch(() => 0);
    if (filterButtons > 0) {
      await page.click('[data-filter="residential"]').catch(() => null);
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '06-projects-filtered.png'),
        fullPage: false
      });
      console.log('   ✓ Filtered projects screenshot saved');
    }

    // 4. Contact Page
    console.log('\n4. Capturing contact page...');
    await page.goto(`${DEMO_URL}contact.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('form', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '07-contact.png'),
      fullPage: false
    });
    console.log('   ✓ Contact page screenshot saved');

    // 5. Navigation test (back to homepage)
    console.log('\n5. Testing navigation...');
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
    // Click services link
    await page.click('a[href="services.html"]').catch(() => null);
    await page.waitForURL('**/services.html', { timeout: 5000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '08-nav-to-services.png'),
      fullPage: false
    });
    console.log('   ✓ Navigation flow screenshot saved');

    console.log('\n✓ Media capture complete!\n');

  } catch (error) {
    console.error('Error during media capture:', error.message);
  } finally {
    // Get the video path
    const videos = await context.close();
    console.log('Video recording saved');
    await browser.close();
  }
}

captureMedia();
