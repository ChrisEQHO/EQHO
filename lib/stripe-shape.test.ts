import { describe, expect, it } from 'vitest'
import {
  getInvoiceSubscriptionId,
  getSubscriptionPeriodEnd,
  getSubscriptionPeriodEndDate,
} from './stripe-shape'

describe('getSubscriptionPeriodEnd', () => {
  it('reads item-level period end (basil+)', () => {
    expect(getSubscriptionPeriodEnd({ items: { data: [{ current_period_end: 100 }] } })).toBe(100)
  })
  it('uses the latest item period end', () => {
    expect(
      getSubscriptionPeriodEnd({ items: { data: [{ current_period_end: 100 }, { current_period_end: 250 }] } })
    ).toBe(250)
  })
  it('falls back to legacy top-level field', () => {
    expect(getSubscriptionPeriodEnd({ current_period_end: 42, items: { data: [] } })).toBe(42)
  })
  it('returns null when absent', () => {
    expect(getSubscriptionPeriodEnd({})).toBeNull()
    expect(getSubscriptionPeriodEndDate({})).toBeNull()
  })
  it('converts to a Date', () => {
    expect(getSubscriptionPeriodEndDate({ current_period_end: 1 })?.toISOString()).toBe(
      '1970-01-01T00:00:01.000Z'
    )
  })
})

describe('getInvoiceSubscriptionId', () => {
  it('reads parent.subscription_details (basil+)', () => {
    expect(getInvoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_1' } } })).toBe('sub_1')
  })
  it('reads expanded objects', () => {
    expect(getInvoiceSubscriptionId({ parent: { subscription_details: { subscription: { id: 'sub_2' } } } })).toBe('sub_2')
  })
  it('falls back to legacy invoice.subscription', () => {
    expect(getInvoiceSubscriptionId({ subscription: 'sub_3' })).toBe('sub_3')
  })
  it('returns null for one-off invoices', () => {
    expect(getInvoiceSubscriptionId({ parent: null })).toBeNull()
  })
})
