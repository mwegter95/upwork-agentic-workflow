import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEMO_URL = 'https://michaelwegter.com/demos/telehealthy/';
const MEDIA_DIR = __dirname + '/media';

(async () => {
  const browser = await chromium.launch();

  // First context for screenshots
  const context1 = await browser.newContext();
  const page = await context1.newPage();

  // Set viewport for consistent captures
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    console.log('Loading demo...');
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Screenshot 1: Hero landing
    console.log('Capturing 01-hero-landing.png...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '01-hero-landing.png'), fullPage: false });

    // Screenshot 2: Click Simulate Inbound Call, capture intent options
    console.log('Clicking "Simulate Inbound Call"...');
    const simulateBtn = await page.locator('button:has-text("Simulate Inbound Call")');
    await simulateBtn.click();
    await page.waitForTimeout(1000);

    console.log('Capturing 02-intent-options.png...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '02-intent-options.png'), fullPage: false });

    // Screenshot 3: Click "Book an appointment" and capture booking flow
    console.log('Clicking "Book an appointment"...');
    const bookBtn = await page.locator('button, [role="button"]').filter({ hasText: /^Book/ }).first();
    await bookBtn.click();
    await page.waitForTimeout(1200);

    console.log('Capturing 03-booking-intent.png...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '03-booking-intent.png'), fullPage: false });

    // Screenshot 4: Click "New Patient" and progress conversation
    console.log('Clicking "New Patient"...');
    const newPatientChip = await page.locator('[role="button"], button').filter({ hasText: /New Patient/ }).first();
    await newPatientChip.click();
    await page.waitForTimeout(1200);

    console.log('Capturing 04-new-patient-response.png...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '04-new-patient-response.png'), fullPage: false });

    // Screenshot 5: End current call and start warm-transfer demo
    console.log('Clicking "End Call"...');
    const endCallBtn = await page.locator('button:has-text("End Call")').first();
    await endCallBtn.click();
    await page.waitForTimeout(1200);

    // Reload page for warm-transfer demo
    console.log('Reloading page for warm-transfer demo...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Click Simulate Inbound Call again to show intent buttons
    console.log('Simulating inbound call for warm-transfer demo...');
    const simulateBtn3 = await page.locator('button:has-text("Simulate Inbound Call")');
    await simulateBtn3.click();
    await page.waitForTimeout(1000);

    // Click "This is urgent" to trigger escalation
    console.log('Clicking "This is urgent" for escalation...');
    const urgentBtn = await page.locator('button, [role="button"]').filter({ hasText: /urgent|Urgent/ }).first();
    await urgentBtn.click();
    await page.waitForTimeout(1500);

    console.log('Capturing 05-warm-transfer-escalation.png...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '05-warm-transfer-escalation.png'), fullPage: false });

    // Screenshot 6: Navigate to Analytics tab
    console.log('Clicking Analytics tab...');
    const analyticsTab = await page.locator('[role="tab"], button').filter({ hasText: /Analytics|📊/ }).first();
    await analyticsTab.click();
    await page.waitForTimeout(1200);

    console.log('Capturing 06-analytics-dashboard.png...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '06-analytics-dashboard.png'), fullPage: false });

    // Screenshot 7: Navigate to Outbound/CRM tab to show contact list
    console.log('Clicking Outbound tab...');
    const outboundTab = await page.locator('[role="tab"], button').filter({ hasText: /Outbound|📤/ }).first();
    await outboundTab.click();
    await page.waitForTimeout(1200);

    console.log('Capturing 07-outbound-crm-contacts.png...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '07-outbound-crm-contacts.png'), fullPage: false });

    await context1.close();

    // Second context for video recording
    console.log('Starting video recording of hero flow...');
    const videoPath = path.join(MEDIA_DIR, 'hero-flow-demo.webm');
    const context2 = await browser.newContext({
      recordVideo: { dir: MEDIA_DIR, size: { width: 1400, height: 900 } }
    });
    const page2 = await context2.newPage();
    await page2.setViewportSize({ width: 1400, height: 900 });

    console.log('Loading demo for video capture...');
    await page2.goto(DEMO_URL, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(1500);

    // Perform the hero booking flow on video
    console.log('Executing booking flow for video...');
    const simBtn = await page2.locator('button:has-text("Simulate Inbound Call")');
    await simBtn.click();
    await page2.waitForTimeout(800);

    const bBtn = await page2.locator('button, [role="button"]').filter({ hasText: /^Book/ }).first();
    await bBtn.click();
    await page2.waitForTimeout(1000);

    const npChip = await page2.locator('[role="button"], button').filter({ hasText: /New Patient/ }).first();
    await npChip.click();
    await page2.waitForTimeout(1000);

    // Scroll to show SMS log and transcript
    await page2.evaluate(() => {
      const transcript = document.querySelector('[class*="transcript"], [class*="messages"], [class*="log"]');
      if (transcript) transcript.scrollTop = transcript.scrollHeight;
    });
    await page2.waitForTimeout(800);

    // End call and show summary
    const endBtn = await page2.locator('button:has-text("End Call")').first();
    await endBtn.click();
    await page2.waitForTimeout(600);

    console.log('Finalizing video...');
    await context2.close();

    // Find and rename the video file
    const files = fs.readdirSync(MEDIA_DIR);
    const webmFile = files.find(f => f.endsWith('.webm'));
    if (webmFile) {
      fs.renameSync(
        path.join(MEDIA_DIR, webmFile),
        videoPath
      );
    }

    console.log('\n✓ Media capture complete');
    console.log('Screenshots: 01-hero-landing.png, 02-intent-options.png, 03-booking-intent.png, 04-new-patient-response.png, 05-warm-transfer-escalation.png, 06-analytics-dashboard.png, 07-outbound-crm-contacts.png');
    console.log('Video: hero-flow-demo.webm');

  } catch (error) {
    console.error('Media capture failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
