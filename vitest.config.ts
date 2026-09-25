import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Vitest setup. Pure server-side logic runs in the default `node` environment.
// Component tests opt into `jsdom` per-file via a `// @vitest-environment jsdom`
// docblock, so DOM setup never slows down the lib suite.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  // The app's tsconfig sets jsx:"preserve" for Next. Component tests need the
  // JSX compiled to the automatic React runtime, so override esbuild here.
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'components/**/*.test.tsx'],
  },
})
