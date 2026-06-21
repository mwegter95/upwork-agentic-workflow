import { chromium } from '@playwright/test';

const DEMO_URL = 'https://michaelwegter.com/demos/adverteyes/';

async function debugPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    console.log('Loading demo...');
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });

    console.log('\n=== Page Content ===');
    const html = await page.content();
    console.log(html.substring(0, 2000));

    console.log('\n=== Looking for inputs ===');
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} inputs`);
    for (let i = 0; i < inputs.length && i < 5; i++) {
      const attrs = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      const id = await inputs[i].getAttribute('id');
      console.log(`  Input ${i}: type=${attrs}, name=${name}, id=${id}`);
    }

    console.log('\n=== Looking for forms ===');
    const forms = await page.locator('form').all();
    console.log(`Found ${forms.length} forms`);

    console.log('\n=== Looking for buttons ===');
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    for (let i = 0; i < buttons.length && i < 5; i++) {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i}: "${text}"`);
    }

    console.log('\n=== Screenshot saved ===');
    await page.screenshot({ path: 'upwork-runs/adverteyes/debug-page.png', fullPage: true });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugPage();
