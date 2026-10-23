import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e/production',
  outputDir: './playwright/.cache/pwa-results',
  workers: 1,
  reporter: 'line',
  use: { baseURL: 'http://127.0.0.1:4175', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
})
