import type { MusicTrack } from "@/lib/music/types"
import type { GymnasticsCategoryId, MusicGenre } from "@/lib/music/taxonomy"

// EQHO Music — track PLACEHOLDERS.
//
// Per the spec revision, the prototype must NOT present fabricated music as
// genuine catalogue inventory. These are neutral, clearly-numbered slots
// ("Track 01") that demonstrate the browsing/discovery LAYOUT with real
// structural attributes (discipline, genre, duration, BPM, key) so the UI is
// ready for real data.
//
// The `sample` block remains ILLUSTRATIVE ONLY (spec §21/§31): the
// `illustrativeLicences` and `illustrativeCountries` values exist purely to
// demonstrate the popularity/country UX and are always shown behind a visible
// "Sample — illustrative only" label. They are never written to or read from
// any real purchase records.
//
// `previewUrl` reuses the existing silent clip so the player transport
// (play/pause/seek) is fully functional for review without shipping any master
// audio. Real audible-watermarked previews are a Phase-2 upload concern.
const PREVIEW = "/silence.wav"

interface SeedSpec {
  cats: GymnasticsCategoryId[]
  genre: MusicGenre
  moods: string[]
  bpm: number
  duration: number
  key: string
  creator: number // 1-based creator slot
  released: string
  licences: number
  countries: { country: string; percent: number }[]
}

const SPECS: SeedSpec[] = [
  {
    cats: ["individual-rhythmic"],
    genre: "Instrumental",
    moods: ["Expressive", "Building", "Elegant"],
    bpm: 96,
    duration: 82,
    key: "C minor",
    creator: 1,
    released: "2026-08-18",
    licences: 214,
    countries: [
      { country: "United Kingdom", percent: 32 },
      { country: "United States", percent: 24 },
      { country: "Canada", percent: 18 },
      { country: "Australia", percent: 15 },
      { country: "Germany", percent: 11 },
    ],
  },
  {
    cats: ["artistic"],
    genre: "Pop / Upbeat",
    moods: ["Energetic", "Bright", "Confident"],
    bpm: 124,
    duration: 88,
    key: "A major",
    creator: 2,
    released: "2026-08-02",
    licences: 187,
    countries: [
      { country: "United States", percent: 30 },
      { country: "United Kingdom", percent: 26 },
      { country: "France", percent: 16 },
      { country: "Canada", percent: 15 },
      { country: "Japan", percent: 13 },
    ],
  },
  {
    cats: ["group-rhythmic"],
    genre: "Soundtrack",
    moods: ["Cinematic", "Dramatic", "Sweeping"],
    bpm: 110,
    duration: 148,
    key: "D minor",
    creator: 3,
    released: "2026-07-22",
    licences: 163,
    countries: [
      { country: "United Kingdom", percent: 28 },
      { country: "Spain", percent: 22 },
      { country: "Italy", percent: 18 },
      { country: "United States", percent: 17 },
      { country: "Bulgaria", percent: 15 },
    ],
  },
  {
    cats: ["individual-rhythmic", "artistic"],
    genre: "Classical",
    moods: ["Graceful", "Emotional", "Flowing"],
    bpm: 84,
    duration: 90,
    key: "G major",
    creator: 4,
    released: "2026-07-05",
    licences: 142,
    countries: [
      { country: "Russia", percent: 24 },
      { country: "United Kingdom", percent: 22 },
      { country: "United States", percent: 20 },
      { country: "Ukraine", percent: 18 },
      { country: "Germany", percent: 16 },
    ],
  },
  {
    cats: ["acrobatic"],
    genre: "Latin",
    moods: ["Playful", "Rhythmic", "Warm"],
    bpm: 116,
    duration: 132,
    key: "E minor",
    creator: 5,
    released: "2026-06-28",
    licences: 118,
    countries: [
      { country: "Brazil", percent: 30 },
      { country: "Spain", percent: 22 },
      { country: "Mexico", percent: 18 },
      { country: "United States", percent: 16 },
      { country: "Portugal", percent: 14 },
    ],
  },
  {
    cats: ["artistic"],
    genre: "Pop / Upbeat",
    moods: ["Punchy", "Modern", "Fun"],
    bpm: 128,
    duration: 86,
    key: "F major",
    creator: 6,
    released: "2026-06-10",
    licences: 96,
    countries: [
      { country: "United States", percent: 34 },
      { country: "United Kingdom", percent: 20 },
      { country: "Netherlands", percent: 16 },
      { country: "Canada", percent: 15 },
      { country: "Sweden", percent: 15 },
    ],
  },
  {
    cats: ["group-rhythmic"],
    genre: "Soundtrack",
    moods: ["Powerful", "Building", "Bold"],
    bpm: 104,
    duration: 156,
    key: "B minor",
    creator: 7,
    released: "2026-05-24",
    licences: 78,
    countries: [
      { country: "Bulgaria", percent: 26 },
      { country: "Italy", percent: 22 },
      { country: "United Kingdom", percent: 20 },
      { country: "Japan", percent: 17 },
      { country: "United States", percent: 15 },
    ],
  },
  {
    cats: ["individual-rhythmic"],
    genre: "Instrumental",
    moods: ["Delicate", "Precise", "Light"],
    bpm: 92,
    duration: 78,
    key: "A minor",
    creator: 8,
    released: "2026-05-08",
    licences: 61,
    countries: [
      { country: "United Kingdom", percent: 27 },
      { country: "United States", percent: 24 },
      { country: "Canada", percent: 19 },
      { country: "Australia", percent: 16 },
      { country: "France", percent: 14 },
    ],
  },
  {
    cats: ["acrobatic", "artistic"],
    genre: "Folk",
    moods: ["Uplifting", "Acoustic", "Warm"],
    bpm: 100,
    duration: 120,
    key: "D major",
    creator: 9,
    released: "2026-04-19",
    licences: 44,
    countries: [
      { country: "Ireland", percent: 30 },
      { country: "United Kingdom", percent: 26 },
      { country: "United States", percent: 20 },
      { country: "Canada", percent: 13 },
      { country: "New Zealand", percent: 11 },
    ],
  },
  {
    cats: ["group-rhythmic"],
    genre: "Classical",
    moods: ["Majestic", "Synchronised", "Grand"],
    bpm: 88,
    duration: 150,
    key: "C major",
    creator: 10,
    released: "2026-04-02",
    licences: 33,
    countries: [
      { country: "Russia", percent: 25 },
      { country: "Ukraine", percent: 21 },
      { country: "Italy", percent: 20 },
      { country: "United Kingdom", percent: 18 },
      { country: "Spain", percent: 16 },
    ],
  },
  {
    cats: ["artistic", "acrobatic"],
    genre: "Latin",
    moods: ["Fiery", "Dynamic", "Sharp"],
    bpm: 120,
    duration: 94,
    key: "F minor",
    creator: 2,
    released: "2026-03-15",
    licences: 27,
    countries: [
      { country: "Spain", percent: 28 },
      { country: "Brazil", percent: 24 },
      { country: "United States", percent: 18 },
      { country: "Mexico", percent: 16 },
      { country: "Argentina", percent: 14 },
    ],
  },
  {
    cats: ["individual-rhythmic"],
    genre: "Other",
    moods: ["Atmospheric", "Unusual", "Textured"],
    bpm: 72,
    duration: 84,
    key: "E major",
    creator: 5,
    released: "2026-02-26",
    licences: 18,
    countries: [
      { country: "United Kingdom", percent: 26 },
      { country: "United States", percent: 22 },
      { country: "Japan", percent: 20 },
      { country: "Germany", percent: 17 },
      { country: "Canada", percent: 15 },
    ],
  },
]

export const TRACKS: MusicTrack[] = SPECS.map((spec, i) => {
  const n = (i + 1).toString().padStart(2, "0")
  const creatorSlot = spec.creator.toString().padStart(2, "0")
  return {
    id: `tr_${n}`,
    slug: `track-${n}`,
    title: `Track ${n}`,
    creatorId: `cr_${creatorSlot}`,
    gymnasticsCategories: spec.cats,
    genre: spec.genre,
    moods: spec.moods,
    bpm: spec.bpm,
    durationSeconds: spec.duration,
    musicalKey: spec.key,
    description:
      "Placeholder track slot. Real EQHO Music tracks — with audible watermarked previews and full details — will appear here at launch. Structural details below illustrate the browsing layout.",
    accent: i,
    previewUrl: PREVIEW,
    releasedAt: spec.released,
    sample: {
      sampleOnly: true,
      illustrativeLicences: spec.licences,
      illustrativeCountries: spec.countries,
    },
  }
})

export function getTrackBySlug(slug: string): MusicTrack | undefined {
  return TRACKS.find((t) => t.slug === slug)
}

export function getTrackById(id: string): MusicTrack | undefined {
  return TRACKS.find((t) => t.id === id)
}

export function getTracksByCreator(creatorId: string): MusicTrack[] {
  return TRACKS.filter((t) => t.creatorId === creatorId)
}
