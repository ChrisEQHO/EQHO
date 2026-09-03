// EQHO Music — pure, server-authoritative pricing.
//
// Mirrors the guarantees of lib/store/pricing.ts: every price shown in the UI
// and every amount charged at checkout is derived HERE from the single Personal
// Licence and the caller's verified subscription status. The browser never
// sends a price; the checkout route recomputes the quote from these functions
// so the display and the charge can never disagree (spec §27, §29).

import type { BasketLine, PriceQuote, PriceQuoteLine } from "@/lib/music/types"
import { PERSONAL_LICENCE } from "@/lib/music/seed/licence-tiers"
import { getTrackById } from "@/lib/music/seed/tracks"

// Verified EQHO subscribers get 10% off (spec §"SUBSCRIBER DISCOUNT"). This is
// only ever applied after the caller's subscription is confirmed server-side.
export const SUBSCRIBER_DISCOUNT_RATE = 0.1

export function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100)
}

// The price for a single Personal Licence given subscriber status. The discount
// is calculated (not hard-coded) from the flat licence price.
export function priceForLicence(isVerifiedSubscriber: boolean): {
  basePence: number
  discountPence: number
  pricePence: number
} {
  const basePence = PERSONAL_LICENCE.pricePence
  const discountPence = isVerifiedSubscriber
    ? Math.round(basePence * SUBSCRIBER_DISCOUNT_RATE)
    : 0
  return { basePence, discountPence, pricePence: basePence - discountPence }
}

// Build a full, authoritative quote for a basket. Unknown tracks are silently
// dropped so a tampered basket can never produce a charge for something that
// isn't really for sale. Every line is one Personal Licence.
export function quoteBasket(
  lines: BasketLine[],
  isVerifiedSubscriber: boolean,
): PriceQuote {
  const quoteLines: PriceQuoteLine[] = []
  // De-duplicate: one Personal Licence per track in a basket.
  const seen = new Set<string>()

  for (const line of lines) {
    if (seen.has(line.trackId)) continue
    const track = getTrackById(line.trackId)
    if (!track) continue
    seen.add(line.trackId)

    const { basePence, discountPence, pricePence } = priceForLicence(
      isVerifiedSubscriber,
    )

    quoteLines.push({
      trackId: track.id,
      trackTitle: track.title,
      licenceName: PERSONAL_LICENCE.name,
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
