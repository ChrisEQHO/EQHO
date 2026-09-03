import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the Supabase browser client so getAuthHeaders() is deterministic and
// never touches the network. Individual tests override the session value.
let mockSession: { access_token: string } | null = null
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: mockSession } }),
    },
  }),
}))

// Import AFTER the mock is registered.
import { getApiBase, getAuthHeaders, apiFetch } from './api-client'

const ORIGINAL_ENV = { ...process.env }

describe('getApiBase', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('returns empty string (same-origin) on the web build', () => {
    delete process.env.NEXT_PUBLIC_BUILD_TARGET
    expect(getApiBase()).toBe('')
  })

  it('returns the canonical production origin on mobile when no base is set', () => {
    process.env.NEXT_PUBLIC_BUILD_TARGET = 'mobile'
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    expect(getApiBase()).toBe('https://www.eqho-player.com')
  })

  it('uses NEXT_PUBLIC_API_BASE_URL on mobile and strips a trailing slash', () => {
    process.env.NEXT_PUBLIC_BUILD_TARGET = 'mobile'
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com/'
    expect(getApiBase()).toBe('https://api.example.com')
  })
})

describe('getAuthHeaders', () => {
  beforeEach(() => {
    mockSession = null
  })

  it('returns an empty object when there is no session', async () => {
    mockSession = null
    expect(await getAuthHeaders()).toEqual({})
  })

  it('returns a Bearer header when a session exists', async () => {
    mockSession = { access_token: 'tok_123' }
    expect(await getAuthHeaders()).toEqual({ Authorization: 'Bearer tok_123' })
  })
})

describe('apiFetch', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    mockSession = null
    vi.restoreAllMocks()
  })
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('keeps relative paths same-origin on web', async () => {
    delete process.env.NEXT_PUBLIC_BUILD_TARGET
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await apiFetch('/api/entitlement')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/entitlement')
  })

  it('prefixes the deployed origin on mobile', async () => {
    process.env.NEXT_PUBLIC_BUILD_TARGET = 'mobile'
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await apiFetch('/api/entitlement')
    expect(fetchSpy.mock.calls[0][0]).toBe('https://www.eqho-player.com/api/entitlement')
  })

  it('attaches the Supabase Bearer token when a session exists', async () => {
    mockSession = { access_token: 'tok_abc' }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await apiFetch('/api/entitlement')
    const headers = fetchSpy.mock.calls[0][1]?.headers as Headers
    expect(headers.get('authorization')).toBe('Bearer tok_abc')
  })

  it('does not overwrite an Authorization header supplied by the caller', async () => {
    mockSession = { access_token: 'tok_session' }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await apiFetch('/api/entitlement', { headers: { Authorization: 'Bearer caller_wins' } })
    const headers = fetchSpy.mock.calls[0][1]?.headers as Headers
    expect(headers.get('authorization')).toBe('Bearer caller_wins')
  })

  it('leaves absolute URLs untouched', async () => {
    process.env.NEXT_PUBLIC_BUILD_TARGET = 'mobile'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await apiFetch('https://cdn.example.com/thing.json')
    expect(fetchSpy.mock.calls[0][0]).toBe('https://cdn.example.com/thing.json')
  })

  it('preserves method and body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await apiFetch('/api/create-profile', { method: 'POST', body: JSON.stringify({ a: 1 }) })
    const init = fetchSpy.mock.calls[0][1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ a: 1 }))
  })
})
