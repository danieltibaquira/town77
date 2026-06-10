import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
      testTimeout: 10000,
      passWithNoTests: true,
    },
  }),
)
