import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const LIVE_URL = 'https://michaelwegter.com/demos/bowling-shirt-designer/';
const RUN_DIR = '/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/upwork-runs/bowling-shirt-designer';
const OUT_DIR = `${RUN_DIR}/captures`;
const FRAMES_DIR = `${OUT_DIR}/frames`;
const VIDEO_PATH = `${OUT_DIR}/hero-flow.webm`;

// Create output dirs
fs.mkdirSync(FRAMES_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext();

// Start recording early so we capture the entire flow
const page = await context.newPage({
  viewport: { width: 1400, height: 900 },
  recordVideo: { dir: OUT_DIR }
});

console.log('Loading live demo...');
await page.goto(LIVE_URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000); // Let 3D scene stabilize

// Screenshot 1: Initial state
const frame1 = `${FRAMES_DIR}/01-initial-state.png`;
await page.screenshot({ path: frame1 });
console.log(`Captured: ${frame1}`);

// Upload a test image (create a simple test PNG in memory)
const testImagePath = '/tmp/test-pattern.png';
// Create a simple 400x400 PNG gradient for testing
const canvas = await page.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 400;
  c.height = 400;
  const ctx = c.getContext('2d');
  // Create a gradient pattern
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `hsl(${i}, 100%, 50%)`;
    ctx.fillRect(i, 0, 1, 400);
  }
  return c.toDataURL('image/png');
});

// Download data URL as file
const base64 = canvas.split(',')[1];
const buffer = Buffer.from(base64, 'base64');
fs.writeFileSync(testImagePath, buffer);
console.log(`Created test image: ${testImagePath}`);

// Find and interact with upload input
const uploadInput = await page.$('input[type="file"]');
if (uploadInput) {
  console.log('Found file input, uploading test image...');
  await uploadInput.setInputFiles(testImagePath);
  await page.waitForTimeout(1500); // Let upload and compositor process
  
  // Screenshot 2: After upload
  const frame2 = `${FRAMES_DIR}/02-after-upload.png`;
  await page.screenshot({ path: frame2 });
  console.log(`Captured: ${frame2}`);
  
  // Click Smart Align button if it exists
  const smartAlignBtn = await page.$('button:has-text("Smart Align")').catch(() => null);
  if (smartAlignBtn) {
    console.log('Clicking Smart Align...');
    await smartAlignBtn.click();
    await page.waitForTimeout(2000); // Let alignment compute + WebGPU run
    
    // Screenshot 3: After Smart Align
    const frame3 = `${FRAMES_DIR}/03-after-smart-align.png`;
    await page.screenshot({ path: frame3 });
    console.log(`Captured: ${frame3}`);
  }
  
  // Adjust zoom slider
  const zoomSlider = await page.$('input[type="range"][aria-label*="zoom" i]').catch(() => null);
  if (zoomSlider) {
    console.log('Adjusting zoom slider...');
    await zoomSlider.evaluate(el => el.value = 1.5);
    await zoomSlider.dispatchEvent('input');
    await page.waitForTimeout(1000);
    
    // Screenshot 4: After zoom adjustment
    const frame4 = `${FRAMES_DIR}/04-after-zoom.png`;
    await page.screenshot({ path: frame4 });
    console.log(`Captured: ${frame4}`);
  }
  
  // Try to toggle front/back mode if present
  const frontBackToggle = await page.$('button:has-text("Front-Back")').catch(() => null);
  if (frontBackToggle) {
    console.log('Toggling Front-Back mode...');
    await frontBackToggle.click();
    await page.waitForTimeout(1000);
    
    // Screenshot 5: Front-Back mode
    const frame5 = `${FRAMES_DIR}/05-front-back-mode.png`;
    await page.screenshot({ path: frame5 });
    console.log(`Captured: ${frame5}`);
  }
} else {
  console.log('No file input found, capturing initial state only');
}

// Wait a bit for any final renders
await page.waitForTimeout(1000);

// Get video path before closing
let videoRecordingPath = null;
if (page.video()) {
  videoRecordingPath = await page.video().path();
  console.log(`Video recording path: ${videoRecordingPath}`);
}

await context.close();

// Move video to output dir after context closes
if (videoRecordingPath && fs.existsSync(videoRecordingPath)) {
  fs.copyFileSync(videoRecordingPath, VIDEO_PATH);
  console.log(`Copied video to: ${VIDEO_PATH}`);
}

await browser.close();

// Report on captures
const frames = fs.readdirSync(FRAMES_DIR).filter(f => f.endsWith('.png'));
console.log(`\n=== Capture Report ===`);
console.log(`Frames captured: ${frames.length}`);
frames.forEach(f => {
  const stat = fs.statSync(path.join(FRAMES_DIR, f));
  console.log(`  ${f}: ${(stat.size / 1024).toFixed(1)} KB`);
});

if (fs.existsSync(VIDEO_PATH)) {
  const videoStat = fs.statSync(VIDEO_PATH);
  console.log(`Video: ${(videoStat.size / 1024 / 1024).toFixed(1)} MB`);
} else {
  console.log('Video: not generated');
}
