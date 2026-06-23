import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'https://michaelwegter.com/demos/solo-law/',
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: [
        '--headless=new', '--use-angle=vulkan',
        '--enable-features=Vulkan,WebGPU', '--disable-vulkan-surface',
        '--enable-unsafe-webgpu', '--ignore-gpu-blocklist',
      ],
    },
  },
});
