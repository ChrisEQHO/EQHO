import type { LicenceTier, LicenceTierId } from "@/lib/music/types"

// Licence tiers offered across EQHO Music. Prices are in pence (GBP) and are the
// SERVER-AUTHORITATIVE source of truth — the checkout route recomputes every
// total from these values and never trusts a price sent by the browser.
export const LICENCE_TIERS: Record<LicenceTierId, LicenceTier> = {
  personal: {
    id: "personal",
    name: "Personal",
    tagline: "Non-commercial personal projects and practice.",
    rights: [
      "Personal, non-commercial use",
      "Unlimited private streams",
      "No resale or redistribution",
    ],
    pricePence: 1500,
    exclusive: false,
  },
  creator: {
    id: "creator",
    name: "Creator",
    tagline: "Social content, podcasts and monetised channels.",
    rights: [
      "Use in monetised social & video content",
      "One channel / handle per licence",
      "Worldwide, in perpetuity",
      "Credit appreciated, not required",
    ],
    pricePence: 3900,
    exclusive: false,
  },
  commercial: {
    id: "commercial",
    name: "Commercial",
    tagline: "Ads, brand films and client work.",
    rights: [
      "Commercial & advertising use",
      "Broadcast and paid media",
      "Multi-platform campaign rights",
      "Worldwide, in perpetuity",
    ],
    pricePence: 12900,
    exclusive: false,
  },
  exclusive: {
    id: "exclusive",
    name: "Exclusive (Limited)",
    tagline: "Buy the track outright — it is removed from sale for everyone else.",
    rights: [
      "Full exclusive ownership of the licence",
      "Track is permanently removed from the marketplace",
      "All commercial & broadcast rights",
      "Certificate of exclusivity issued",
    ],
    pricePence: 95000,
    exclusive: true,
  },
}

export const LICENCE_TIER_ORDER: LicenceTierId[] = [
  "personal",
  "creator",
  "commercial",
  "exclusive",
]

export function getLicenceTier(id: LicenceTierId): LicenceTier {
  return LICENCE_TIERS[id]
}
