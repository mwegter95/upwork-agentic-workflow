// Verify work-samples SPA shim renders correctly despite the 404 HTTP response
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('https://michaelwegter.com/work-samples/bowling-shirt-designer', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

const title = await page.title();
const bodyText = await page.locator('body').innerText().catch(() => '');
const iframeCount = await page.locator('iframe').count();
const hasNav = await page.locator('nav, header').count();

console.log('Title:', title);
console.log('Iframe count:', iframeCount);
console.log('Nav/header count:', hasNav);
console.log('Body snippet:', bodyText.slice(0, 200));

await browser.close();
