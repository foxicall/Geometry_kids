import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1366, height: 950 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});
