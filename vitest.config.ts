import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Minimal Vitest setup for pure server-side logic (no DOM needed). The `@`
// alias mirrors tsconfig so tests can import `@/lib/...` like the app does.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
