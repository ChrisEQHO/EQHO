import { test, expect } from '@playwright/test'

// Real-WebKit regression for the iPad Play-button bug fixed in commit d29c000.
//
// The jsdom unit suite (components/store/track-preview-player.test.tsx) proves
// play() is invoked synchronously inside the tap handler, but jsdom is not
// WebKit and cannot prove iOS/iPadOS actually starts playback from the gesture.
// This spec closes that gap on the real Safari engine.
//
// OPT-IN: skipped unless RUN_WEBKIT_E2E=1 and E2E_STORE_URL point at a deployed
// /store/<slug> page that has a published, playable preview track.
const shouldRun = process.env.RUN_WEBKIT_E2E === '1' && !!process.env.E2E_STORE_URL

test.describe('TrackPreviewPlayer — iPad WebKit Play button', () => {
  test.skip(!shouldRun, 'Set RUN_WEBKIT_E2E=1 and E2E_STORE_URL to run on real WebKit')

  test('a single tap starts playback and the button flips to Pause', async ({ page }) => {
    await page.goto('/')

    // The preview player exposes a Play toggle labelled for accessibility.
    const playButton = page.getByRole('button', { name: /play|pause/i }).first()
    await expect(playButton).toBeVisible()

    // Tap (touch), not click — this is the gesture that failed on iPad.
    await playButton.tap()

    // Assert real playback started on the underlying <audio>/media element:
    // currentTime advances and the element is not paused. This is what jsdom
    // cannot verify.
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const media = document.querySelector('audio') as HTMLAudioElement | null
          return media ? { paused: media.paused, t: media.currentTime } : null
        }),
      )
      .toMatchObject({ paused: false })

    // And the control reflects the playing state.
    await expect(page.getByRole('button', { name: /pause/i }).first()).toBeVisible()
  })
})
