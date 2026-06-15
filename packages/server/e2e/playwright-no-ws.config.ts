import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './',
  testMatch: '**/*.spec.ts',
  timeout: 120000,
  use: { baseURL: 'http://localhost:3177', headless: true },
})
