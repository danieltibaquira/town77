import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8077',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/five-player-simulation.spec.ts',
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: '**/five-player-simulation.spec.ts',
    },
    {
      name: 'simulation',
      use: {
        ...devices['Desktop Chrome'],
        trace: 'on',
        screenshot: 'on',
      },
      testMatch: '**/five-player-simulation.spec.ts',
      timeout: 600000,
    },
  ],
  webServer: {
    command: 'cd ../.. && docker compose up --build',
    url: 'http://localhost:8077/health',
    timeout: 300000,
    reuseExistingServer: !process.env.CI,
  },
})
