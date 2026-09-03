import type { LicenceTierId, MusicTrack } from "@/lib/music/types"

// Seed tracks for the EQHO Music prototype.
//
// IMPORTANT (spec §21/§31): every `sample` block is ILLUSTRATIVE ONLY. The
// `illustrativeLicences` and `illustrativeCountries` values are invented purely
// to demonstrate the discovery/popularity UX and are always rendered behind a
// visible "Sample — illustrative only" label. They are never written to or read
// from any real purchase records.
//
// `previewUrl` points at short, watermark-intended preview audio. No master
// files exist in this phase.

const ALL_TIERS: LicenceTierId[] = ["personal", "creator", "commercial", "exclusive"]
const NO_EXCLUSIVE: LicenceTierId[] = ["personal", "creator", "commercial"]

// Preview audio source. The prototype intentionally ships NO real music: a real
// audible-watermarked preview per track is a Phase-2 (upload pipeline) concern.
// We reuse the existing silent clip so the player transport (play/pause/seek)
// is fully functional for review without fabricating any master audio.
const PREVIEW = "/silence.wav"

export const TRACKS: MusicTrack[] = [
  {
    id: "tr_glass_horizon",
    slug: "glass-horizon",
    title: "Glass Horizon",
    creatorId: "cr_aurelia",
    genre: "Cinematic",
    moods: ["Reflective", "Emotional", "Slow"],
    bpm: 70,
    durationSeconds: 184,
    musicalKey: "C minor",
    description:
      "A patient build of felt piano, tape hiss and swelling strings — made for title cards, trailers and quiet emotional beats.",
    artwork: "/music/tracks/glass-horizon.png",
    previewUrl: PREVIEW,
    availableTiers: ALL_TIERS,
    releasedAt: "2026-07-12",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 128,
      illustrativeCountries: [
        { country: "United Kingdom", percent: 34 },
        { country: "United States", percent: 28 },
        { country: "Germany", percent: 18 },
        { country: "Canada", percent: 12 },
        { country: "Australia", percent: 8 },
      ],
    },
  },
  {
    id: "tr_accra_sunrise",
    slug: "accra-sunrise",
    title: "Accra Sunrise",
    creatorId: "cr_kojo",
    genre: "Afrobeat",
    moods: ["Uplifting", "Warm", "Danceable"],
    bpm: 108,
    durationSeconds: 201,
    musicalKey: "A major",
    description:
      "Bright highlife guitars over a rolling Afrobeat groove. Perfect for travel films, brand stories and feel-good montages.",
    artwork: "/music/tracks/accra-sunrise.png",
    previewUrl: PREVIEW,
    availableTiers: ALL_TIERS,
    releasedAt: "2026-08-02",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 96,
      illustrativeCountries: [
        { country: "Ghana", percent: 30 },
        { country: "Nigeria", percent: 24 },
        { country: "United Kingdom", percent: 20 },
        { country: "United States", percent: 16 },
        { country: "France", percent: 10 },
      ],
    },
  },
  {
    id: "tr_dust_and_vinyl",
    slug: "dust-and-vinyl",
    title: "Dust & Vinyl",
    creatorId: "cr_lin",
    genre: "Lo-fi",
    moods: ["Chill", "Nostalgic", "Focused"],
    bpm: 82,
    durationSeconds: 156,
    musicalKey: "F major",
    description:
      "Tape-saturated keys, brushed drums and gentle crackle. A calm bed for study playlists, vlogs and product demos.",
    artwork: "/music/tracks/dust-and-vinyl.png",
    previewUrl: PREVIEW,
    availableTiers: NO_EXCLUSIVE,
    releasedAt: "2026-06-20",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 214,
      illustrativeCountries: [
        { country: "Japan", percent: 26 },
        { country: "United States", percent: 24 },
        { country: "South Korea", percent: 18 },
        { country: "United Kingdom", percent: 17 },
        { country: "Brazil", percent: 15 },
      ],
    },
  },
  {
    id: "tr_neon_freeway",
    slug: "neon-freeway",
    title: "Neon Freeway",
    creatorId: "cr_sable",
    genre: "Synthwave",
    moods: ["Energetic", "Retro", "Driving"],
    bpm: 118,
    durationSeconds: 223,
    musicalKey: "E minor",
    description:
      "Widescreen arpeggios and punchy gated drums. Built for tech reveals, gaming edits and high-energy montages.",
    artwork: "/music/tracks/neon-freeway.png",
    previewUrl: PREVIEW,
    availableTiers: ALL_TIERS,
    releasedAt: "2026-08-15",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 172,
      illustrativeCountries: [
        { country: "United States", percent: 38 },
        { country: "United Kingdom", percent: 19 },
        { country: "Germany", percent: 16 },
        { country: "Netherlands", percent: 14 },
        { country: "Sweden", percent: 13 },
      ],
    },
  },
  {
    id: "tr_paper_boats",
    slug: "paper-boats",
    title: "Paper Boats",
    creatorId: "cr_ottoline",
    genre: "Folk",
    moods: ["Intimate", "Hopeful", "Acoustic"],
    bpm: 92,
    durationSeconds: 168,
    musicalKey: "G major",
    description:
      "Fingerpicked guitar and hushed vocals recorded in a warm room. Made for heartfelt adverts and documentary beds.",
    artwork: "/music/tracks/paper-boats.png",
    previewUrl: PREVIEW,
    availableTiers: NO_EXCLUSIVE,
    releasedAt: "2026-05-30",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 47,
      illustrativeCountries: [
        { country: "Ireland", percent: 32 },
        { country: "United Kingdom", percent: 27 },
        { country: "United States", percent: 21 },
        { country: "Canada", percent: 12 },
        { country: "New Zealand", percent: 8 },
      ],
    },
  },
  {
    id: "tr_black_sea_pulse",
    slug: "black-sea-pulse",
    title: "Black Sea Pulse",
    creatorId: "cr_dmitri",
    genre: "Techno",
    moods: ["Hypnotic", "Dark", "Driving"],
    bpm: 128,
    durationSeconds: 246,
    musicalKey: "A minor",
    description:
      "Analogue-grit techno with a hypnotic rolling bassline. For fashion films, nightlife reels and bold brand edits.",
    artwork: "/music/tracks/black-sea-pulse.png",
    previewUrl: PREVIEW,
    availableTiers: ALL_TIERS,
    releasedAt: "2026-07-28",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 63,
      illustrativeCountries: [
        { country: "Germany", percent: 33 },
        { country: "Georgia", percent: 22 },
        { country: "United Kingdom", percent: 18 },
        { country: "Spain", percent: 15 },
        { country: "Italy", percent: 12 },
      ],
    },
  },
  {
    id: "tr_still_water",
    slug: "still-water",
    title: "Still Water",
    creatorId: "cr_aurelia",
    genre: "Ambient",
    moods: ["Calm", "Spacious", "Meditative"],
    bpm: 60,
    durationSeconds: 212,
    musicalKey: "D major",
    description:
      "Drifting pads and distant piano for meditation apps, wellness content and gentle establishing shots.",
    artwork: "/music/tracks/still-water.png",
    previewUrl: PREVIEW,
    availableTiers: NO_EXCLUSIVE,
    releasedAt: "2026-04-18",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 39,
      illustrativeCountries: [
        { country: "United States", percent: 30 },
        { country: "United Kingdom", percent: 22 },
        { country: "Australia", percent: 20 },
        { country: "Canada", percent: 15 },
        { country: "Japan", percent: 13 },
      ],
    },
  },
  {
    id: "tr_midnight_market",
    slug: "midnight-market",
    title: "Midnight Market",
    creatorId: "cr_kojo",
    genre: "World",
    moods: ["Groovy", "Vibrant", "Percussive"],
    bpm: 102,
    durationSeconds: 189,
    musicalKey: "B minor",
    description:
      "Layered percussion and call-and-response horns that bring a bustling night market to life. Great for food and travel content.",
    artwork: "/music/tracks/midnight-market.png",
    previewUrl: PREVIEW,
    availableTiers: NO_EXCLUSIVE,
    releasedAt: "2026-06-05",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 54,
      illustrativeCountries: [
        { country: "Ghana", percent: 26 },
        { country: "United States", percent: 22 },
        { country: "United Kingdom", percent: 20 },
        { country: "France", percent: 18 },
        { country: "Senegal", percent: 14 },
      ],
    },
  },
  {
    id: "tr_arcade_heart",
    slug: "arcade-heart",
    title: "Arcade Heart",
    creatorId: "cr_sable",
    genre: "Electronic",
    moods: ["Playful", "Bright", "Retro"],
    bpm: 112,
    durationSeconds: 176,
    musicalKey: "C major",
    description:
      "Chiptune-tinged synths with a big pop chorus. Made for playful product launches, app promos and gaming content.",
    artwork: "/music/tracks/arcade-heart.png",
    previewUrl: PREVIEW,
    availableTiers: NO_EXCLUSIVE,
    releasedAt: "2026-03-22",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 88,
      illustrativeCountries: [
        { country: "United States", percent: 35 },
        { country: "Japan", percent: 21 },
        { country: "United Kingdom", percent: 18 },
        { country: "Germany", percent: 14 },
        { country: "Canada", percent: 12 },
      ],
    },
  },
  {
    id: "tr_low_tide_letters",
    slug: "low-tide-letters",
    title: "Low Tide Letters",
    creatorId: "cr_ottoline",
    genre: "Acoustic",
    moods: ["Wistful", "Gentle", "Warm"],
    bpm: 78,
    durationSeconds: 195,
    musicalKey: "A major",
    description:
      "A slow acoustic waltz with brushed snare and soft harmonies for reflective montages and end credits.",
    artwork: "/music/tracks/low-tide-letters.png",
    previewUrl: PREVIEW,
    availableTiers: NO_EXCLUSIVE,
    releasedAt: "2026-02-14",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 22,
      illustrativeCountries: [
        { country: "Ireland", percent: 30 },
        { country: "United Kingdom", percent: 28 },
        { country: "United States", percent: 20 },
        { country: "Germany", percent: 12 },
        { country: "Canada", percent: 10 },
      ],
    },
  },
  {
    id: "tr_signal_lost",
    slug: "signal-lost",
    title: "Signal Lost",
    creatorId: "cr_dmitri",
    genre: "Electronic",
    moods: ["Tense", "Modern", "Cinematic"],
    bpm: 120,
    durationSeconds: 208,
    musicalKey: "F minor",
    description:
      "Glitching textures and a relentless pulse for thrillers, tech teasers and dramatic sport edits.",
    artwork: "/music/tracks/signal-lost.png",
    previewUrl: PREVIEW,
    availableTiers: ALL_TIERS,
    releasedAt: "2026-08-20",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 31,
      illustrativeCountries: [
        { country: "Germany", percent: 29 },
        { country: "United States", percent: 24 },
        { country: "United Kingdom", percent: 21 },
        { country: "Poland", percent: 14 },
        { country: "Georgia", percent: 12 },
      ],
    },
  },
  {
    id: "tr_kyoto_rain",
    slug: "kyoto-rain",
    title: "Kyoto Rain",
    creatorId: "cr_lin",
    genre: "Chillhop",
    moods: ["Cozy", "Mellow", "Rainy"],
    bpm: 76,
    durationSeconds: 162,
    musicalKey: "E major",
    description:
      "Rain-soaked lo-fi with jazzy chords and a sleepy swing. A perfect bed for study streams and calm storytelling.",
    artwork: "/music/tracks/kyoto-rain.png",
    previewUrl: PREVIEW,
    availableTiers: NO_EXCLUSIVE,
    releasedAt: "2026-07-01",
    sample: {
      sampleOnly: true,
      illustrativeLicences: 143,
      illustrativeCountries: [
        { country: "Japan", percent: 28 },
        { country: "United States", percent: 22 },
        { country: "South Korea", percent: 19 },
        { country: "United Kingdom", percent: 16 },
        { country: "Taiwan", percent: 15 },
      ],
    },
  },
]

export function getTrackBySlug(slug: string): MusicTrack | undefined {
  return TRACKS.find((t) => t.slug === slug)
}

export function getTrackById(id: string): MusicTrack | undefined {
  return TRACKS.find((t) => t.id === id)
}

export function getTracksByCreator(creatorId: string): MusicTrack[] {
  return TRACKS.filter((t) => t.creatorId === creatorId)
}
