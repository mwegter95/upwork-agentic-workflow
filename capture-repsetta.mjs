#!/usr/bin/env node

import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

const URL = 'http://localhost:8099/demos/repsetta-fitness/';
const OUT_DIR = '/Users/michaelwegter/Desktop/Projects/upwork-agentic-workflow/upwork-runs/repsetta-fitness/proposal/media';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
  });

  try {
    // Ensure output directory exists
    await fs.mkdir(OUT_DIR, { recursive: true });

    // 1. Load Today screen
    console.log('Loading demo at', URL);
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('Capturing today.png...');
    await page.screenshot({ path: path.join(OUT_DIR, 'today.png') });

    // 2. Click "Start Session"
    console.log('Clicking "Start Session" button...');
    await page.locator('text=Start Session').first().click();
    await page.waitForTimeout(1500);

    // 3. Capture Log screen
    console.log('Capturing log.png...');
    await page.screenshot({ path: path.join(OUT_DIR, 'log.png') });

    // 4. Fill first set and log it
    console.log('Filling and logging first set...');
    const inputs = await page.locator('input[placeholder="0"]').all();
    if (inputs.length >= 2) {
      await inputs[0].click();
      await inputs[0].fill('185');
      await page.waitForTimeout(300);

      await inputs[1].click();
      await inputs[1].fill('5');
      await page.waitForTimeout(300);

      const logBtns = await page.locator('text=Log').all();
      if (logBtns.length > 0) {
        console.log('Clicking Log button...');
        await logBtns[0].click();

        // Wait for RestTimer to render (it's a conditional render)
        console.log('Waiting for RestTimer component to appear...');
        await page.waitForTimeout(2500);

        // Try to wait for the timer's SVG or text element
        try {
          await page.locator('text=/[0-9]{1,3}/', { timeout: 1000 }).first();
          console.log('Timer countdown found');
        } catch (e) {
          console.log('Timer not found via text, but continuing...');
        }
      }
    }

    console.log('Capturing rest-timer.png...');
    await page.screenshot({ path: path.join(OUT_DIR, 'rest-timer.png') });

    // 5. Click Progress tab
    console.log('Clicking Progress tab...');
    await page.getByText('Progress', { exact: true }).click();
    await page.waitForTimeout(1500);
    console.log('Capturing progress.png...');
    await page.screenshot({ path: path.join(OUT_DIR, 'progress.png') });

    // 6. Verify files
    console.log('\nVerifying captured files...');
    const files = ['today.png', 'log.png', 'rest-timer.png', 'progress.png'];

    for (const file of files) {
      const filepath = path.join(OUT_DIR, file);
      const stat = await fs.stat(filepath);
      console.log(`${file}: ${stat.size} bytes`);
    }

    console.log('\nCapture complete!');
    for (const file of files) {
      console.log(`  - ${path.join(OUT_DIR, file)}`);
    }

  } catch (err) {
    console.error('Capture failed:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
