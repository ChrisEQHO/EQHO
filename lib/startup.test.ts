import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetNavigationGuard,
  makeReferenceCode,
  navigateOnce,
  resolveAuthStatus,
  routeFor,
  STARTUP_TIMEOUT_SENTINEL,
  withTimeout,
} from './startup'

describe('resolveAuthStatus', () => {
  it('is checking until the bootstrap settles, regardless of user', () => {
    expect(resolveAuthStatus(false, false)).toBe('checking')
    expect(resolveAuthStatus(false, true)).toBe('checking')
  })
  it('resolves to signed-in / signed-out once settled', () => {
    expect(resolveAuthStatus(true, true)).toBe('signed-in')
    expect(resolveAuthStatus(true, false)).toBe('signed-out')
  })
})

describe('withTimeout', () => {
  it('resolves when the promise wins', async () => {
    await expect(withTimeout(Promise.resolve(7), 50)).resolves.toBe(7)
  })
  it('rejects with the sentinel when the promise hangs', async () => {
    await expect(withTimeout(new Promise(() => {}), 10)).rejects.toThrow(STARTUP_TIMEOUT_SENTINEL)
  })
})

describe('routeFor', () => {
  it('leaves web paths untouched', () => {
    expect(routeFor('/login', false)).toBe('/login')
  })
  it('adds a trailing slash on mobile and keeps the query', () => {
    expect(routeFor('/login', true)).toBe('/login/')
    expect(routeFor('/app/', true)).toBe('/app/')
    expect(routeFor('/', true)).toBe('/')
    expect(routeFor('/login?next=/app', true)).toBe('/login/?next=/app')
  })
})

describe('navigateOnce', () => {
  const replace = vi.fn()
  beforeEach(() => {
    __resetNavigationGuard()
    replace.mockReset()
    vi.stubGlobal('window', { location: { pathname: '/app/', replace } })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('navigates only once even if called repeatedly', () => {
    expect(navigateOnce('/login', true)).toBe(true)
    expect(navigateOnce('/login', true)).toBe(false)
    expect(navigateOnce('/upgrade', true)).toBe(false)
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith('/login/')
  })
  it('does not reload when already on the target path', () => {
    expect(navigateOnce('/app', true)).toBe(false)
    expect(replace).not.toHaveBeenCalled()
  })
})

describe('makeReferenceCode', () => {
  it('contains only the kind and a timestamp', () => {
    const code = makeReferenceCode('timeout', new Date(1_700_000_000_000))
    expect(code).toMatch(/^EQ-TIM-[0-9A-Z]{1,6}$/)
  })
})
