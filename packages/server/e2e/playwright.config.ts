import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './',
  testMatch: '**/*.spec.ts',
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://localhost:3177',
    headless: true,
  },
  webServer: {
    command: 'npx tsx e2e/helpers/start-server.ts',
    cwd: '../',
    url: 'http://localhost:3177/health',
    reuseExistingServer: false,
    timeout: 30000,
    stderr: 'pipe',
  },
})
