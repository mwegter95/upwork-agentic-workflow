const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DEMO_URL = 'http://localhost:5173/demos/edtech-school-connect-web-portal/index.html';
const MEDIA_DIR = path.join(__dirname, 'media');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureDemo() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: MEDIA_DIR }
  });
  const page = await context.newPage();

  try {
    console.log('📹 Starting media capture...');
    console.log(`Loading demo from: ${DEMO_URL}`);

    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
    await sleep(1000);

    // Screenshot 1: Login screen
    console.log('📸 Capturing login screen...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '01-login.png'), fullPage: true });

    // Fill parent login (demo hint shows in UI)
    console.log('🔐 Logging in as parent...');
    await page.fill('input[type="email"]', 'parent@demo.edu');
    await page.fill('input[type="password"]', 'ParentDemo1');
    await page.click('button[type="submit"]');

    await sleep(2000); // Wait for auth and page load

    // Screenshot 2: Parent dashboard
    console.log('📸 Capturing parent dashboard...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '02-dashboard.png'), fullPage: true });

    // Click on Grades tab
    console.log('📊 Navigating to grades...');
    await page.click('[data-tab="grades"]');
    await sleep(1500);

    // Screenshot 3: Grades view with chart
    console.log('📸 Capturing grades view with chart...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '03-grades-chart.png'), fullPage: true });

    // Click on Messages tab
    console.log('💬 Navigating to messages...');
    await page.click('[data-tab="messages"]');
    await sleep(1500);

    // Screenshot 4: Messages
    console.log('📸 Capturing messages view...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '04-messages.png'), fullPage: true });

    // Try to scroll and compose a message
    console.log('✍️ Testing message composition...');
    const messageInput = await page.$('[data-test="message-input"]');
    if (messageInput) {
      await messageInput.click();
      await page.keyboard.type('Great update, thank you!');
      await sleep(500);
      await page.screenshot({ path: path.join(MEDIA_DIR, '05-message-compose.png'), fullPage: true });
      // Don't actually send to avoid clutter
    }

    // Now test teacher flow - logout first
    console.log('🚪 Logging out...');
    await page.click('[data-test="logout-btn"], button:has-text("Logout"), [aria-label="Logout"]');
    await sleep(1500);

    // Screenshot 5: Back to login after logout
    console.log('📸 Capturing login screen again...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '06-login-again.png'), fullPage: true });

    // Teacher login
    console.log('🔐 Logging in as teacher...');
    await page.fill('input[type="email"]', 'teacher@demo.edu');
    await page.fill('input[type="password"]', 'TeachDemo1');
    await page.click('button[type="submit"]');
    await sleep(2000);

    // Screenshot 6: Teacher dashboard
    console.log('📸 Capturing teacher dashboard...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '07-teacher-dashboard.png'), fullPage: true });

    // Navigate to grades management
    console.log('✏️ Navigating to grade management...');
    await page.click('[data-tab="grades"]');
    await sleep(1500);

    // Screenshot 7: Grade management view
    console.log('📸 Capturing grade management interface...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '08-grade-management.png'), fullPage: true });

    // Navigate to activities
    console.log('📢 Navigating to activities...');
    await page.click('[data-tab="activities"]');
    await sleep(1500);

    // Screenshot 8: Teacher activities/updates view
    console.log('📸 Capturing activities view...');
    await page.screenshot({ path: path.join(MEDIA_DIR, '09-activities.png'), fullPage: true });

    // Test posting an activity
    const postBtn = await page.$('[data-test="post-activity-btn"], button:has-text("Post Update")');
    if (postBtn) {
      console.log('📝 Testing activity post...');
      await postBtn.click();
      await sleep(500);
      const textArea = await page.$('textarea');
      if (textArea) {
        await textArea.click();
        await page.keyboard.type('Reminder: Math quiz on Friday');
        await sleep(500);
        await page.screenshot({ path: path.join(MEDIA_DIR, '10-post-activity.png'), fullPage: true });
      }
    }

    console.log('✅ Media capture complete!');

  } catch (error) {
    console.error('❌ Error during media capture:', error);
  } finally {
    const video = await context.close();
    await browser.close();

    // The video file is auto-saved by Playwright
    const videoFiles = fs.readdirSync(MEDIA_DIR).filter(f => f.endsWith('.webm'));
    if (videoFiles.length > 0) {
      console.log(`📹 Video saved: ${videoFiles[0]}`);
    }
  }
}

captureDemo();
