const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DEMO_URL = 'https://michaelwegter.com/demos/ai-chatbot-for-customer-support/';
const ADMIN_URL = 'https://michaelwegter.com/demos/ai-chatbot-for-customer-support/admin.html';
const MEDIA_DIR = '/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/upwork-runs/ai-chatbot-for-customer-support/media';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: MEDIA_DIR }
  });

  try {
    // === DEMO PAGE CAPTURE ===
    const page = await context.newPage();
    console.log('Loading demo page...');
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });

    // Wait for WASM model to initialize (5-15s as per deploy-test notes)
    console.log('Waiting for WASM model initialization...');
    await page.waitForTimeout(12000);

    // Also wait for textarea to be enabled
    try {
      await page.waitForFunction(
        () => !document.querySelector('textarea').disabled,
        { timeout: 10000 }
      );
    } catch (e) {
      console.log('Textarea still disabled, proceeding anyway...');
    }

    // Screenshot 1: Full hero view with all feature sections visible
    console.log('Capturing hero screenshot...');
    await page.screenshot({
      path: path.join(MEDIA_DIR, '01-hero.png'),
      fullPage: true
    });

    // Wait a moment and interact with the chat
    await page.waitForTimeout(1000);

    // Screenshot 2: Chat input focused
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.focus();
      await page.screenshot({
        path: path.join(MEDIA_DIR, '02-chat-ready.png')
      });
    }

    // === INTERACTION RECORDING ===
    console.log('Starting interaction recording...');
    const page2 = await context.newPage();
    await page2.goto(DEMO_URL, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(12000);

    // Wait for textarea to be enabled
    try {
      await page2.waitForFunction(
        () => !document.querySelector('textarea').disabled,
        { timeout: 10000 }
      );
    } catch (e) {
      console.log('Textarea still disabled, attempting interaction anyway...');
    }

    // FAQ interaction: ask about shipping
    console.log('FAQ interaction: asking about shipping...');
    try {
      await page2.fill('textarea', 'How long does shipping take?');
      await page2.press('textarea', 'Enter');
    } catch (e) {
      console.log('Could not fill textarea, skipping FAQ interaction');
    }
    await page2.waitForTimeout(3000);

    // Scroll to see response
    await page2.evaluate(() => window.scrollBy(0, 300));
    await page2.waitForTimeout(1000);

    // Order lookup: search for ORD-1001
    console.log('Order lookup interaction...');
    try {
      await page2.fill('textarea', 'Check order ORD-1001');
      await page2.press('textarea', 'Enter');
      await page2.waitForTimeout(3000);
    } catch (e) {
      console.log('Order lookup interaction skipped');
    }

    // Escalation: trigger escalation
    console.log('Escalation interaction...');
    try {
      await page2.fill('textarea', 'I need to talk to a human agent');
      await page2.press('textarea', 'Enter');
      await page2.waitForTimeout(2000);
    } catch (e) {
      console.log('Escalation interaction skipped');
    }

    // Close page to save video
    const video = page2.video;
    await page2.close();
    if (video) {
      try {
        const videoPath = await video.path();
        console.log(`Recording saved to: ${videoPath}`);
        // Rename video for output
        if (fs.existsSync(videoPath)) {
          fs.renameSync(videoPath, path.join(MEDIA_DIR, 'demo-interaction.webm'));
        }
      } catch (e) {
        console.log('Video recording not available, skipping...');
      }
    }

    // Close first page before admin
    await page.close();

    // === ADMIN PANEL ===
    console.log('Capturing admin panel...');
    const adminPage = await context.newPage();
    await adminPage.goto(ADMIN_URL, { waitUntil: 'networkidle' });

    // Wait for page to load
    await adminPage.waitForTimeout(2000);

    try {
      const passwordInput = await adminPage.$('input[type="password"]');
      if (passwordInput) {
        await adminPage.fill('input[type="password"]', 'admin123');
        await adminPage.click('button');
        await adminPage.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('Admin login interaction skipped');
    }

    await adminPage.screenshot({
      path: path.join(MEDIA_DIR, '03-admin-dashboard.png'),
      fullPage: true
    });

    await adminPage.close();

    console.log('Media capture complete.');

  } catch (error) {
    console.error('Error during media capture:', error);
    process.exit(1);
  } finally {
    await context.close();
    await browser.close();
  }
})();
