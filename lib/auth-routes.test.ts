import { describe, expect, it } from 'vitest'
import { isPublicRoute, resolveAuthRedirect, safeInternalPath } from './auth-routes'

describe('isPublicRoute', () => {
  it('treats the homepage as public only as an exact match', () => {
    expect(isPublicRoute('/')).toBe(true)
    expect(isPublicRoute('/app')).toBe(false)
  })

  it('keeps the player, account and debug areas protected', () => {
    for (const path of ['/app', '/app/settings', '/account', '/billing', '/debug', '/api/debug/env-check', '/api/playlists/update']) {
      expect(isPublicRoute(path)).toBe(false)
    }
  })

  it('allows auth, marketing and SEO routes', () => {
    for (const path of ['/login', '/signup', '/signup/success', '/forgot-password', '/auth/callback', '/pricing', '/robots.txt', '/sitemap.xml']) {
      expect(isPublicRoute(path)).toBe(true)
    }
  })

  it('scopes the demo exception to /api/demo only', () => {
    expect(isPublicRoute('/api/demo')).toBe(true)
    expect(isPublicRoute('/api/demo/publish')).toBe(true)
    expect(isPublicRoute('/api/demolition')).toBe(false)
  })
})

describe('resolveAuthRedirect', () => {
  it('sends a logged-out visitor on /app to login, remembering the destination', () => {
    expect(resolveAuthRedirect({ pathname: '/app', search: '?tab=cloud', hasUser: false })).toEqual({
      type: 'redirect',
      pathname: '/login',
      search: '?next=%2Fapp%3Ftab%3Dcloud',
    })
  })

  it('lets a logged-out visitor see public pages', () => {
    expect(resolveAuthRedirect({ pathname: '/signup', search: '', hasUser: false })).toEqual({ type: 'none' })
    expect(resolveAuthRedirect({ pathname: '/login', search: '', hasUser: false })).toEqual({ type: 'none' })
  })

  it('moves an authenticated user off /login to the player', () => {
    expect(resolveAuthRedirect({ pathname: '/login', search: '', hasUser: true })).toEqual({
      type: 'redirect',
      pathname: '/app',
      search: '',
    })
  })

  it('never redirects /signup, even when authenticated', () => {
    expect(resolveAuthRedirect({ pathname: '/signup', search: '', hasUser: true })).toEqual({ type: 'none' })
  })

  it('lets an authenticated user through to the player', () => {
    expect(resolveAuthRedirect({ pathname: '/app', search: '', hasUser: true })).toEqual({ type: 'none' })
  })
})

describe('safeInternalPath', () => {
  it('accepts internal paths with a query', () => {
    expect(safeInternalPath('/app?tab=cloud')).toBe('/app?tab=cloud')
  })

  it('falls back when missing', () => {
    expect(safeInternalPath(null)).toBe('/app')
    expect(safeInternalPath('', '/signup/success')).toBe('/signup/success')
  })

  it('rejects open-redirect shapes', () => {
    for (const raw of ['//evil.com', 'https://evil.com', 'evil.com', '/\\evil.com', '/x?u=https://evil.com']) {
      expect(safeInternalPath(raw)).toBe('/app')
    }
  })
})
