// EQHO Music — shared types for the Phase-1 prototype.
//
// These describe the SEED catalog used by the prototype and mirror the proposed
// production schema documented in docs/eqho-music-architecture.md. No real
// database tables are created in this phase.
//
// COMMERCIAL MODEL: there is exactly ONE licence — the Personal Licence at a
// single flat price. There are no tiers and the customer never chooses a
// licence type (spec revision §"CRITICAL COMMERCIAL CORRECTION").

import type { GymnasticsCategoryId, MusicGenre } from "@/lib/music/taxonomy"

export interface PersonalLicence {
  id: "personal"
  name: string
  /** One-line summary shown on the purchase card. */
  tagline: string
  /** What the buyer is allowed to do under the Personal Licence. */
  rights: string[]
  /** Flat price in pence (GBP). Server-authoritative source of truth. */
  pricePence: number
}

export interface MusicCreator {
  id: string
  slug: string
  /** Neutral slot label, e.g. "Creator 01" — NOT a real or invented name. */
  name: string
  /** Placeholder tagline shown under the label. */
  tagline: string
  /** Placeholder copy describing where real creator info will appear. */
  bio: string
  /** Accent index (0-based) driving the branded gradient placeholder artwork. */
  accent: number
  /** True when this placeholder is surfaced in the featured rail. */
  featured: boolean
}

export interface MusicTrack {
  id: string
  slug: string
  /** Neutral slot label, e.g. "Track 01" — NOT invented catalogue inventory. */
  title: string
  creatorId: string
  /** Gymnastics disciplines this placeholder is filed under (discovery axis). */
  gymnasticsCategories: GymnasticsCategoryId[]
  /** Primary musical genre + descriptive moods used by discovery filters. */
  genre: MusicGenre
  moods: string[]
  bpm: number
  durationSeconds: number
  /** Musical key, shown on the detail page. */
  musicalKey: string
  /** Placeholder description shown on the detail page. */
  description: string
  /** Accent index (0-based) driving the branded gradient placeholder artwork. */
  accent: number
  /**
   * Watermarked/preview audio URL only. Master files never ship in the
   * prototype (see spec §33/§46 — preview vs master separation).
   */
  previewUrl: string
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

// A single line in the basket. Because every track uses the one Personal
// Licence, a line is just a track reference.
export interface BasketLine {
  trackId: string
}

// Server-computed price quote returned by /api/music/quote. The client renders
// this but never computes or trusts its own totals (spec §27).
export interface PriceQuoteLine {
  trackId: string
  trackTitle: string
  /** Always "Personal Licence" in this model — carried for display only. */
  licenceName: string
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
