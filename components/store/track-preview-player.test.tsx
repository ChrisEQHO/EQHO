// @vitest-environment jsdom
//
// iPad Play-button regression test for the /store/[slug] TrackPreviewPlayer.
//
// IMPORTANT: this runs in jsdom (a Node DOM implementation), NOT in Safari /
// WebKit. It cannot prove real iOS gesture behaviour — only WebKit or a
// physical iPad can do that. What it DOES lock in is the source-level contract
// that makes iOS playback work and that a future refactor could silently break:
//
//   1. A single tap fires the click handler exactly once.
//   2. HTMLMediaElement.play() is invoked SYNCHRONOUSLY inside that handler
//      (no `await` before it — awaiting "spends" the iOS user-gesture token).
//   3. Playback entering the playing state flips the button to Pause, driven by
//      the element's own `play` event (not optimistic state).
//   4. A rejected play() promise is caught — no unhandled promise rejection.
//   5. State stays accurate when the OS pauses playback with no click
//      (backgrounding / another app / Control Centre).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import { TrackPreviewPlayer } from './track-preview-player'

// jsdom does not implement media playback, so we install controllable
// play()/pause() mocks that also emit the real element events the component
// listens to — mirroring how a browser drives state.
let playImpl: () => Promise<void> | undefined

function installMediaMocks() {
  Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
    configurable: true,
    get() {
      return (this as any)._paused ?? true
    },
  })
  HTMLMediaElement.prototype.play = vi.fn(function (this: HTMLMediaElement) {
    return playImpl.call(this)
  }) as unknown as HTMLMediaElement['play']
  HTMLMediaElement.prototype.pause = vi.fn(function (this: HTMLMediaElement) {
    ;(this as any)._paused = true
    this.dispatchEvent(new Event('pause'))
  }) as unknown as HTMLMediaElement['pause']
}

// Default: play() succeeds — element becomes unpaused and fires `play`.
function playSucceeds(this: HTMLMediaElement) {
  ;(this as any)._paused = false
  this.dispatchEvent(new Event('play'))
  return Promise.resolve()
}

// Simulate an iPad tap: the OS synthesizes a click from touchstart/touchend,
// and the component's onClick is what actually runs.
function tap(el: HTMLElement) {
  fireEvent.touchStart(el)
  fireEvent.touchEnd(el)
  fireEvent.click(el)
}

beforeEach(() => {
  // Mark the environment as a touch-capable iPad for good measure.
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 })
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1366 })
  playImpl = playSucceeds
  installMediaMocks()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('TrackPreviewPlayer — iPad Play button (jsdom, not WebKit)', () => {
  it('a single tap synchronously calls play(), enters playing, flips to Pause, no unhandled rejection', () => {
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)

    render(<TrackPreviewPlayer slug="demo-track" durationSeconds={30} />)
    const btn = screen.getByRole('button', { name: /play preview/i })

    tap(btn)

    // (1)+(2): play() was called exactly once, synchronously during the tap —
    // asserted immediately after tap() returns, before any await.
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)
    // (3): the element's `play` event drove the button to its Pause state.
    expect(screen.getByRole('button', { name: /pause preview/i })).toBeTruthy()

    process.off('unhandledRejection', unhandled)
    // (4): no rejection escaped.
    expect(unhandled).not.toHaveBeenCalled()
  })

  it('pauses and resumes from taps, tracking the element events each time', () => {
    render(<TrackPreviewPlayer slug="demo-track" durationSeconds={30} />)

    tap(screen.getByRole('button', { name: /play preview/i }))
    expect(screen.getByRole('button', { name: /pause preview/i })).toBeTruthy()

    // Tap while playing -> pause() called, `pause` event -> Play label.
    tap(screen.getByRole('button', { name: /pause preview/i }))
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /play preview/i })).toBeTruthy()

    // Resume.
    tap(screen.getByRole('button', { name: /play preview/i }))
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: /pause preview/i })).toBeTruthy()
  })

  it('after playback finishes, tapping plays again', () => {
    const { container } = render(<TrackPreviewPlayer slug="demo-track" durationSeconds={30} />)
    const audio = container.querySelector('audio') as HTMLMediaElement

    tap(screen.getByRole('button', { name: /play preview/i }))
    expect(screen.getByRole('button', { name: /pause preview/i })).toBeTruthy()

    // Element finishes on its own.
    act(() => {
      ;(audio as any)._paused = true
      audio.dispatchEvent(new Event('ended'))
    })
    expect(screen.getByRole('button', { name: /play preview/i })).toBeTruthy()

    // Play again works.
    tap(screen.getByRole('button', { name: /play preview/i }))
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: /pause preview/i })).toBeTruthy()
  })

  it('keeps the button state accurate when the OS pauses playback with no click', () => {
    const { container } = render(<TrackPreviewPlayer slug="demo-track" durationSeconds={30} />)
    const audio = container.querySelector('audio') as HTMLMediaElement

    tap(screen.getByRole('button', { name: /play preview/i }))
    expect(screen.getByRole('button', { name: /pause preview/i })).toBeTruthy()

    // Simulate iOS backgrounding: element emits `pause` with no user click.
    act(() => {
      ;(audio as any)._paused = true
      audio.dispatchEvent(new Event('pause'))
    })
    expect(screen.getByRole('button', { name: /play preview/i })).toBeTruthy()
  })

  it('handles a rejected play() promise without an unhandled rejection', async () => {
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)

    // iOS blocks playback: play() rejects and no `play` event fires.
    playImpl = function (this: HTMLMediaElement) {
      return Promise.reject(new Error('NotAllowedError'))
    }

    render(<TrackPreviewPlayer slug="demo-track" durationSeconds={30} />)
    tap(screen.getByRole('button', { name: /play preview/i }))

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)
    // Let the rejection microtask settle so the component's .catch runs.
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    process.off('unhandledRejection', unhandled)
    expect(unhandled).not.toHaveBeenCalled()
    // The catch path surfaced the error state to the user.
    expect(screen.getByText(/preview unavailable/i)).toBeTruthy()
  })
})
