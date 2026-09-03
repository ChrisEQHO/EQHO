// EQHO Music — pure, server-authoritative pricing.
//
// Mirrors the guarantees of lib/store/pricing.ts: every price shown in the UI
// and every amount charged at checkout is derived HERE from the seed licence
// tiers and the caller's verified subscription status. The browser never sends
// a price; the checkout route recomputes the quote from these functions so the
// display and the charge can never disagree (spec §27, §29).

import type {
  BasketLine,
  LicenceTierId,
  PriceQuote,
  PriceQuoteLine,
} from "@/lib/music/types"
import { getLicenceTier } from "@/lib/music/seed/licence-tiers"
import { getTrackById } from "@/lib/music/seed/tracks"

// Verified EQHO subscribers get 10% off every licence (spec §29). This is only
// ever applied after the caller's subscription is confirmed server-side.
export const SUBSCRIBER_DISCOUNT_RATE = 0.1

export function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100)
}

// The single-line price for one track + tier, given subscriber status.
export function priceForTier(
  tierId: LicenceTierId,
  isVerifiedSubscriber: boolean,
): { basePence: number; discountPence: number; pricePence: number } {
  const tier = getLicenceTier(tierId)
  const basePence = tier.pricePence
  const discountPence = isVerifiedSubscriber
    ? Math.round(basePence * SUBSCRIBER_DISCOUNT_RATE)
    : 0
  return { basePence, discountPence, pricePence: basePence - discountPence }
}

// Build a full, authoritative quote for a basket. Unknown tracks/tiers and
// tiers not offered for a track are silently dropped so a tampered basket can
// never produce a charge for something that isn't really for sale.
export function quoteBasket(
  lines: BasketLine[],
  isVerifiedSubscriber: boolean,
): PriceQuote {
  const quoteLines: PriceQuoteLine[] = []

  for (const line of lines) {
    const track = getTrackById(line.trackId)
    if (!track) continue
    if (!track.availableTiers.includes(line.tierId)) continue

    const tier = getLicenceTier(line.tierId)
    const { basePence, discountPence, pricePence } = priceForTier(
      line.tierId,
      isVerifiedSubscriber,
    )

    quoteLines.push({
      trackId: track.id,
      trackTitle: track.title,
      tierId: line.tierId,
      tierName: tier.name,
      basePence,
      discountPence,
      pricePence,
    })
  }

  const subtotalPence = quoteLines.reduce((sum, l) => sum + l.basePence, 0)
  const discountPence = quoteLines.reduce((sum, l) => sum + l.discountPence, 0)
  const totalPence = subtotalPence - discountPence

  return {
    currency: "gbp",
    lines: quoteLines,
    subtotalPence,
    discountPence,
    totalPence,
    subscriberDiscountApplied: isVerifiedSubscriber && discountPence > 0,
  }
}
