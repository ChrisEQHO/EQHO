import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(async () => null) }))
vi.mock('@/lib/access', () => ({
  isAdminEmail: (email: string | null | undefined) => email?.toLowerCase() === 'admin@eqho.test',
}))

import { debugNotFound, resolveDebugAccess } from './debug-guard'

const admin = async () => ({ id: 'admin-id', email: 'admin@eqho.test' })
const member = async () => ({ id: 'user-id', email: 'user@eqho.test' })
const anonymous = async () => null
const broken = async () => {
  throw new Error('auth down')
}

describe('resolveDebugAccess in production', () => {
  it('denies anonymous callers', async () => {
    expect(await resolveDebugAccess('production', anonymous)).toEqual({ allowed: false })
  })

  it('denies authenticated non-admins', async () => {
    expect(await resolveDebugAccess('production', member)).toEqual({ allowed: false })
  })

  it('denies when the auth lookup throws', async () => {
    expect(await resolveDebugAccess('production', broken)).toEqual({ allowed: false })
  })

  it('allows admins and scopes the result to their own account', async () => {
    expect(await resolveDebugAccess('production', admin)).toEqual({
      allowed: true,
      userId: 'admin-id',
      email: 'admin@eqho.test',
    })
  })
})

describe('resolveDebugAccess outside production', () => {
  it('allows local diagnostics with or without a session', async () => {
    expect(await resolveDebugAccess('development', anonymous)).toEqual({ allowed: true, userId: null, email: null })
    expect(await resolveDebugAccess('test', member)).toMatchObject({ allowed: true, userId: 'user-id' })
  })
})

describe('debugNotFound', () => {
  it('returns a bare 404 with no diagnostic detail', async () => {
    const res = debugNotFound()
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
  })
})
