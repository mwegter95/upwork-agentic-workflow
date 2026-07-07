import { chromium } from 'playwright';
import fs from 'fs';

const LIVE_URL = 'https://michaelwegter.com/demos/bowling-shirt-designer/';
const OUT_DIR = '/tmp/pw-video';
const VIDEO_OUT = '/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/upwork-runs/bowling-shirt-designer/captures/hero-flow.webm';

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();

try {
  const context = await browser.newContext({
    recordVideo: { dir: OUT_DIR }
  });
  
  const page = await context.newPage({ viewport: { width: 1400, height: 900 } });
  
  console.log('Loading demo...');
  await page.goto(LIVE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Create a test image
  const testImagePath = '/tmp/test-pattern.png';
  const canvas = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400;
    c.height = 400;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `hsl(${i}, 100%, 50%)`;
      ctx.fillRect(i, 0, 1, 400);
    }
    return c.toDataURL('image/png');
  });
  
  const base64 = canvas.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(testImagePath, buffer);
  
  // Upload
  const uploadInput = await page.$('input[type="file"]');
  if (uploadInput) {
    console.log('Uploading...');
    await uploadInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1500);
    
    // Click smart align
    const btn = await page.$('button:has-text("Smart Align")').catch(() => null);
    if (btn) {
      console.log('Smart aligning...');
      await btn.click();
      await page.waitForTimeout(2000);
    }
  }
  
  await page.waitForTimeout(1000);
  
  // Close and get video path
  const video = page.video();
  let videoPath = null;
  if (video) {
    videoPath = await video.path();
    console.log(`Video path: ${videoPath}`);
  }
  
  await context.close();
  
  if (videoPath && fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, VIDEO_OUT);
    console.log(`Video saved to ${VIDEO_OUT}`);
    console.log(`Size: ${(fs.statSync(VIDEO_OUT).size / 1024 / 1024).toFixed(1)} MB`);
  } else {
    console.log('No video path or file not found');
  }
} catch (err) {
  console.error('Error:', err.message);
}

await browser.close();
