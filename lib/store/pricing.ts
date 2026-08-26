// Single source of truth for what a given viewer pays for a track.
//
// EQHO customers (anyone with an active/trialing subscription, plus admins) get
// the reduced customer_price_cents; everyone else pays the standard price_cents.
// This is PURE and used in two places that must never disagree:
//   1. The storefront display ("Your EQHO customer price").
//   2. The checkout route, which recomputes the amount server-side and charges
//      exactly what this returns — the browser never supplies a price.

import { hasActiveEntitlement } from '@/lib/access'
import type { SubscriptionStatus } from '@/lib/subscription-types'
import type { StoreTrack } from './types'

export interface TrackPricing {
  /** True when this viewer can buy the track one-off (an applicable price exists). */
  purchasable: boolean
  currency: string
  /** Standard public price (smallest unit), or null if not individually priced. */
  standardCents: number | null
  /** Configured reduced customer price (smallest unit), or null if none set. */
  customerCents: number | null
  /** What THIS viewer would actually pay right now (smallest unit). */
  applicableCents: number | null
  /** True when applicableCents is the reduced customer price (viewer is a customer). */
  isCustomerPrice: boolean
  /** True when the viewer is eligible for the customer price (subscriber/admin). */
  eligibleForCustomerPrice: boolean
  /** True when a reduced customer price is configured and lower than standard. */
  hasCustomerDiscount: boolean
}

/**
 * Resolve pricing for a track and a specific viewer. Callers fetch the viewer's
 * subscription status first (or pass null for anonymous / unknown).
 */
export function resolveTrackPricing(params: {
  track: Pick<StoreTrack, 'price_cents' | 'customer_price_cents' | 'currency'>
  email?: string | null
  subscriptionStatus?: SubscriptionStatus | null
}): TrackPricing {
  const { track, email, subscriptionStatus } = params
  const standardCents = track.price_cents ?? null
  const customerCents = track.customer_price_cents ?? null

  // A customer discount only counts if it is actually cheaper than standard
  // (or standard is unset). Prevents a mis-keyed higher "discount" from applying.
  const hasCustomerDiscount =
    customerCents != null && (standardCents == null || customerCents < standardCents)

  const eligibleForCustomerPrice = hasActiveEntitlement(subscriptionStatus, email)

  let applicableCents = standardCents
  let isCustomerPrice = false
  if (eligibleForCustomerPrice && hasCustomerDiscount) {
    applicableCents = customerCents
    isCustomerPrice = true
  }

  return {
    purchasable: applicableCents != null,
    currency: track.currency,
    standardCents,
    customerCents,
    applicableCents,
    isCustomerPrice,
    eligibleForCustomerPrice,
    hasCustomerDiscount,
  }
}
