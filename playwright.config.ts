import { defineConfig, devices } from '@playwright/test'

// WebKit (real Safari engine) end-to-end config, used to verify the iOS/iPadOS
// Play-button gesture behaviour that jsdom cannot prove.
//
// This suite is intentionally OPT-IN. It only runs when RUN_WEBKIT_E2E=1 and it
// targets a deployed URL with published audio (E2E_STORE_URL), because the
// local preview has no seeded tracks and this sandbox cannot install the WebKit
// browser (missing OS libraries). Run it where WebKit + a seeded track exist:
//
//   pnpm exec playwright install webkit
//   RUN_WEBKIT_E2E=1 E2E_STORE_URL="https://<preview>/store/<slug>" pnpm test:e2e:webkit
//
// It never runs in the default `pnpm test` (Vitest) or the production build.
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.webkit\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_STORE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      // iPad running the real WebKit engine, with touch enabled so taps go
      // through the same user-gesture path as iPadOS Safari.
      name: 'ipad-webkit',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],
})
