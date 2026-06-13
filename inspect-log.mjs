#!/usr/bin/env node

import { chromium } from 'playwright';

const URL = 'http://localhost:8099/demos/repsetta-fitness/';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
  });

  try {
    console.log('Loading demo...');
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Clicking Log tab...');
    await page.getByText('Log', { exact: true }).click();
    await page.waitForTimeout(1000);

    // Dump the HTML structure
    const html = await page.content();
    const lines = html.split('\n');

    // Find relevant sections
    console.log('\n=== Inspecting Log screen HTML ===\n');

    // Look for buttons, inputs, divs with click handlers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('<button') || line.includes('onClick') || line.includes('onPress')) {
        console.log(`Line ${i}: ${line.substring(0, 150)}`);
      }
    }

    // Also try to get all visible text
    console.log('\n=== All visible text in Log screen ===\n');
    const texts = await page.locator('*').allTextContents();
    for (const text of texts) {
      const trimmed = text.trim();
      if (trimmed && trimmed.length < 100 && trimmed.length > 0) {
        console.log(`  "${trimmed}"`);
      }
    }

    // Look for any interactive elements
    console.log('\n=== Interactive elements ===\n');
    const buttons = await page.locator('button').all();
    console.log(`Buttons: ${buttons.length}`);

    const inputs = await page.locator('input').all();
    console.log(`Inputs: ${inputs.length}`);

    const divs = await page.locator('div[role="button"]').all();
    console.log(`Divs with role=button: ${divs.length}`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
