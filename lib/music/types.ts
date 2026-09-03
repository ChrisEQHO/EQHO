// EQHO Music — shared types for the Phase-1 prototype.
//
// These describe the SEED catalog used by the prototype and mirror the proposed
// production schema documented in docs/eqho-music-architecture.md. No real
// database tables are created in this phase.

export type LicenceTierId = "personal" | "creator" | "commercial" | "exclusive"

export interface LicenceTier {
  id: LicenceTierId
  name: string
  /** One-line summary shown on the tier selector. */
  tagline: string
  /** What the buyer is allowed to do under this licence. */
  rights: string[]
  /** Base price in pence (GBP). Server-authoritative source of truth. */
  pricePence: number
  /** True for the one-and-only exclusive/limited licence (removes track from sale). */
  exclusive: boolean
}

export interface MusicCreator {
  id: string
  slug: string
  name: string
  /** Short tagline shown under the name. */
  tagline: string
  bio: string
  /** Country of origin (ISO-ish display name), used in discovery. */
  country: string
  /** Local generated avatar image path. */
  avatar: string
  /** Genres this creator is known for. */
  genres: string[]
  /** True when this is a spotlighted / featured creator. */
  featured: boolean
}

export interface MusicTrack {
  id: string
  slug: string
  title: string
  creatorId: string
  /** Primary genre + descriptive moods/tags used by discovery filters. */
  genre: string
  moods: string[]
  bpm: number
  durationSeconds: number
  /** Musical key, shown on the detail page. */
  musicalKey: string
  description: string
  /** Local generated cover art path. */
  artwork: string
  /**
   * Watermarked/preview audio URL only. Master files never ship in the
   * prototype (see spec §33/§46 — preview vs master separation).
   */
  previewUrl: string
  /** Which licence tiers are offered for this track. */
  availableTiers: LicenceTierId[]
  /** Release date (ISO) for sorting "new" vs catalog. */
  releasedAt: string
  /**
   * Illustrative popularity signal used only to demonstrate the discovery UX.
   * NEVER represents real sales. Always rendered behind a "Sample" label.
   */
  sample: TrackSampleSignals
}

// All fields here are explicitly illustrative. The `sampleOnly` discriminant is
// carried through to the UI so components can label the data honestly and can
// never be mistaken for real purchase records.
export interface TrackSampleSignals {
  sampleOnly: true
  /** Illustrative licence count used to sort "popular" vs "less used" rails. */
  illustrativeLicences: number
  /** Illustrative per-country breakdown (percentages summing to ~100). */
  illustrativeCountries: { country: string; percent: number }[]
}

export interface MusicTrackWithCreator extends MusicTrack {
  creator: MusicCreator
}

// A single line in the basket: a track + the chosen licence tier.
export interface BasketLine {
  trackId: string
  tierId: LicenceTierId
}

// Server-computed price quote returned by /api/music/price. The client renders
// this but never computes or trusts its own totals (spec §27).
export interface PriceQuoteLine {
  trackId: string
  trackTitle: string
  tierId: LicenceTierId
  tierName: string
  basePence: number
  /** Applied subscriber discount in pence (0 when not a verified subscriber). */
  discountPence: number
  pricePence: number
}

export interface PriceQuote {
  currency: "gbp"
  lines: PriceQuoteLine[]
  subtotalPence: number
  discountPence: number
  totalPence: number
  /** True when the caller is a verified EQHO subscriber getting the 10% discount. */
  subscriberDiscountApplied: boolean
}
