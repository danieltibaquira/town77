import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@town77/shared-types': fileURLToPath(new URL('../packages/shared-types/src/index.ts', import.meta.url)),
      '@town77/game-engine': fileURLToPath(new URL('../packages/game-engine/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['scripts/__tests__/**/*.test.ts'],
    root: fileURLToPath(new URL('..', import.meta.url)),
  },
})
