import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  evaluateEntitlement,
  isBeforePaywall,
  getPaywallStartAt,
  DEFAULT_PAYWALL_START_AT,
} from './entitlement'
import type { SubscriptionStatus } from './subscription-types'

// The changeover instant under test (1 Sep 2026 00:00 Europe/London = BST +01:00).
const PAYWALL = new Date(DEFAULT_PAYWALL_START_AT)

// Helpers to build instants relative to the changeover.
const beforeInstant = new Date('2026-08-31T23:59:00+01:00') // 31 Aug 23:59 BST
const atInstant = new Date('2026-09-01T00:00:00+01:00') // 1 Sep 00:00 BST
const afterInstant = new Date('2026-09-02T12:00:00+01:00') // well after

function profile(
  status: SubscriptionStatus,
  currentPeriodEnd: string | null = null,
) {
  return { subscription_status: status, current_period_end: currentPeriodEnd }
}

describe('paywall clock boundary', () => {
  it('parses the default changeover instant', () => {
    expect(getPaywallStartAt().toISOString()).toBe(PAYWALL.toISOString())
  })

  it('31 Aug 23:59 is before the paywall', () => {
    expect(isBeforePaywall(beforeInstant)).toBe(true)
  })

  it('1 Sep 00:00 is NOT before the paywall (enforcement begins exactly then)', () => {
    expect(isBeforePaywall(atInstant)).toBe(false)
  })
})

describe('free phase (before 1 Sep 2026)', () => {
  it('allows any logged-in user with no subscription', () => {
    const r = evaluateEntitlement({ now: beforeInstant, profile: profile('free'), email: 'user@example.com' })
    expect(r.allowed).toBe(true)
    expect(r.phase).toBe('free')
    expect(r.reason).toBe('free-phase')
  })

  it('allows a user with no profile at all', () => {
    const r = evaluateEntitlement({ now: beforeInstant, profile: null, email: 'user@example.com' })
    expect(r.allowed).toBe(true)
    expect(r.reason).toBe('free-phase')
  })
})

describe('paywall phase (from 1 Sep 2026)', () => {
  it('blocks an existing free user with no trial/subscription', () => {
    const r = evaluateEntitlement({ now: atInstant, profile: profile('free'), email: 'user@example.com' })
    expect(r.allowed).toBe(false)
    expect(r.phase).toBe('paywall')
    expect(r.reason).toBe('blocked-no-entitlement')
  })

  it('blocks a user with no profile', () => {
    const r = evaluateEntitlement({ now: afterInstant, profile: null, email: 'user@example.com' })
    expect(r.allowed).toBe(false)
    expect(r.reason).toBe('blocked-no-entitlement')
  })

  it('allows a trialing user', () => {
    const r = evaluateEntitlement({ now: atInstant, profile: profile('trialing'), email: 'user@example.com' })
    expect(r.allowed).toBe(true)
    expect(r.reason).toBe('trialing')
  })

  it('allows an active subscriber', () => {
    const r = evaluateEntitlement({ now: afterInstant, profile: profile('active'), email: 'user@example.com' })
    expect(r.allowed).toBe(true)
    expect(r.reason).toBe('active')
  })

  it('allows a canceled user still inside the paid period (grace)', () => {
    const future = new Date(afterInstant.getTime() + 5 * 24 * 3600 * 1000).toISOString()
    const r = evaluateEntitlement({ now: afterInstant, profile: profile('canceled', future), email: 'user@example.com' })
    expect(r.allowed).toBe(true)
    expect(r.reason).toBe('grace')
  })

  it('blocks a canceled user whose paid period has ended', () => {
    const past = new Date(afterInstant.getTime() - 1000).toISOString()
    const r = evaluateEntitlement({ now: afterInstant, profile: profile('canceled', past), email: 'user@example.com' })
    expect(r.allowed).toBe(false)
    expect(r.reason).toBe('blocked-expired')
  })

  it('allows a past_due user still inside the paid period (grace)', () => {
    const future = new Date(afterInstant.getTime() + 2 * 24 * 3600 * 1000).toISOString()
    const r = evaluateEntitlement({ now: afterInstant, profile: profile('past_due', future), email: 'user@example.com' })
    expect(r.allowed).toBe(true)
    expect(r.reason).toBe('grace')
  })

  it('blocks a past_due user past the grace period', () => {
    const r = evaluateEntitlement({ now: afterInstant, profile: profile('past_due', null), email: 'user@example.com' })
    expect(r.allowed).toBe(false)
    expect(r.reason).toBe('blocked-expired')
  })

  it('blocks an incomplete subscription', () => {
    const r = evaluateEntitlement({ now: afterInstant, profile: profile('incomplete'), email: 'user@example.com' })
    expect(r.allowed).toBe(false)
    expect(r.reason).toBe('blocked-no-entitlement')
  })
})

describe('admin override', () => {
  const ADMIN = 'admin@eqho.test'

  beforeEach(() => {
    process.env.ADMIN_EMAILS = ADMIN
  })
  afterEach(() => {
    delete process.env.ADMIN_EMAILS
  })

  it('allows an admin even with no subscription in the paywall phase', () => {
    const r = evaluateEntitlement({ now: afterInstant, profile: profile('free'), email: ADMIN })
    expect(r.allowed).toBe(true)
    expect(r.reason).toBe('admin')
  })

  it('is case-insensitive on the admin email', () => {
    const r = evaluateEntitlement({ now: afterInstant, profile: null, email: 'ADMIN@EQHO.TEST' })
    expect(r.allowed).toBe(true)
    expect(r.reason).toBe('admin')
  })
})

describe('custom PAYWALL_START_AT env override', () => {
  afterEach(() => {
    delete process.env.PAYWALL_START_AT
  })

  it('honours an env-provided instant', () => {
    process.env.PAYWALL_START_AT = '2027-01-01T00:00:00+00:00'
    expect(getPaywallStartAt().toISOString()).toBe(new Date('2027-01-01T00:00:00Z').toISOString())
    // A date that is after the default but before the override is still "free".
    expect(isBeforePaywall(new Date('2026-12-31T00:00:00Z'))).toBe(true)
  })
})
