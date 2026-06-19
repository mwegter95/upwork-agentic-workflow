import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://michaelwegter.com/demos/audio-software-engineer-needed-for/');
});