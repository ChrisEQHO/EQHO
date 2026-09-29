import { describe, expect, it } from 'vitest'
import { describeManifestError, isUuid, sanitizeTrackOrder } from './playlist-manifest'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'

describe('sanitizeTrackOrder', () => {
  it('preserves exact multi-track order', () => {
    expect(sanitizeTrackOrder([C, A, B])).toEqual([C, A, B])
  })

  it('drops values Postgres UUID[] would reject', () => {
    expect(sanitizeTrackOrder([A, '', 'local-track-7', null, 42, undefined, B])).toEqual([A, B])
  })

  it('removes duplicates, keeping the first position (case-insensitive)', () => {
    expect(sanitizeTrackOrder([A, B, A, B.toUpperCase(), C])).toEqual([A, B, C])
  })

  it('returns an empty array for non-arrays', () => {
    expect(sanitizeTrackOrder(undefined)).toEqual([])
    expect(sanitizeTrackOrder('abc')).toEqual([])
  })
})

describe('isUuid', () => {
  it('validates ids', () => {
    expect(isUuid(A)).toBe(true)
    expect(isUuid('1700000000000')).toBe(false)
  })
})

describe('describeManifestError', () => {
  it('maps expired sessions to a sign-in message', () => {
    expect(describeManifestError({ success: false, status: 401, stage: 'auth' })).toMatch(/sign in again/)
  })

  it('maps entitlement failures', () => {
    expect(describeManifestError({ success: false, status: 402, stage: 'entitlement' })).toMatch(/subscription/)
  })

  it('includes the safe stage and code only', () => {
    const msg = describeManifestError({ success: false, status: 500, stage: 'update', code: '22P02' })
    expect(msg).toContain('(update:22P02)')
  })

  it('falls back to the HTTP status when no code is present', () => {
    expect(describeManifestError({ success: false, status: 404, stage: 'lookup' })).toContain('(lookup:404)')
  })
})
