// EQHO Music — discovery taxonomy.
//
// The catalogue is organised first by GYMNASTICS DISCIPLINE (the market EQHO
// Music serves), then by musical GENRE, and is filterable by ROUTINE LENGTH.
// These lists define the discovery architecture so the UI is ready for real
// catalogue data — the prototype does not fabricate real inventory to fill them.

export type GymnasticsCategoryId =
  | "artistic"
  | "acrobatic"
  | "individual-rhythmic"
  | "group-rhythmic"

export interface GymnasticsCategory {
  id: GymnasticsCategoryId
  label: string
  /** Short customer-facing description of the discipline. */
  blurb: string
}

// The four disciplines EQHO Music organises music around. Wording is kept
// customer-facing and neutral (no fabricated catalogue counts).
export const GYMNASTICS_CATEGORIES: GymnasticsCategory[] = [
  {
    id: "artistic",
    label: "Artistic Gymnastics",
    blurb: "Floor routines with dynamic builds and strong emotional peaks.",
  },
  {
    id: "acrobatic",
    label: "Acrobatic Gymnastics",
    blurb: "Partner and group work with rhythmic accents and lifts.",
  },
  {
    id: "individual-rhythmic",
    label: "Individual Rhythmic",
    blurb: "Expressive solo pieces shaped to apparatus and choreography.",
  },
  {
    id: "group-rhythmic",
    label: "Group Rhythmic",
    blurb: "Longer ensemble arrangements built for synchronised group work.",
  },
]

export function getGymnasticsCategory(
  id: GymnasticsCategoryId,
): GymnasticsCategory | undefined {
  return GYMNASTICS_CATEGORIES.find((c) => c.id === id)
}

// Musical genres/styles used within each discipline. Deliberately concise and
// gymnastics-relevant rather than a generic stock-music taxonomy.
export const MUSIC_GENRES = [
  "Instrumental",
  "Pop / Upbeat",
  "Folk",
  "Classical",
  "Latin",
  "Soundtrack",
  "Other",
] as const

export type MusicGenre = (typeof MUSIC_GENRES)[number]

// Routine-length bands. Duration is one of the most important filters for a
// gymnastics customer, so it is a first-class discovery axis.
export interface DurationBand {
  id: string
  label: string
  /** Inclusive lower bound / exclusive upper bound in seconds. */
  minSeconds: number
  maxSeconds: number
}

export const DURATION_BANDS: DurationBand[] = [
  { id: "short", label: "Up to 1:00", minSeconds: 0, maxSeconds: 60 },
  { id: "individual", label: "1:00 – 1:30", minSeconds: 60, maxSeconds: 90 },
  { id: "floor", label: "1:30 – 2:15", minSeconds: 90, maxSeconds: 135 },
  { id: "group", label: "2:15 and over", minSeconds: 135, maxSeconds: Number.POSITIVE_INFINITY },
]

export function durationBandId(seconds: number): string | undefined {
  return DURATION_BANDS.find(
    (b) => seconds >= b.minSeconds && seconds < b.maxSeconds,
  )?.id
}

// m:ss formatter used everywhere durations are shown while browsing.
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.round(totalSeconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}
