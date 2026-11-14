import { defineConfig, devices } from '@playwright/test';

// E2E chạy trên hệ thống thật (web + api + PostgreSQL), ví dụ sau khi `docker compose up`.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
});
