// EQHO Music — catalog selectors used by the discovery UI.
//
// Pure, synchronous helpers over the seed data. The "popularity" sort uses the
// illustrative sample signals ONLY to demonstrate the discovery UX — it never
// reflects real sales (see lib/music/types.ts).

import type { MusicTrack, MusicTrackWithCreator } from "@/lib/music/types"
import type { GymnasticsCategoryId } from "@/lib/music/taxonomy"
import { durationBandId } from "@/lib/music/taxonomy"
import { TRACKS } from "@/lib/music/seed/tracks"
import { CREATORS, getCreatorById } from "@/lib/music/seed/creators"

export type SortKey = "popular" | "less-used" | "newest" | "title"

export function withCreator(track: MusicTrack): MusicTrackWithCreator {
  const creator = getCreatorById(track.creatorId)
  if (!creator) throw new Error(`Missing creator ${track.creatorId} for ${track.id}`)
  return { ...track, creator }
}

export function allTracksWithCreators(): MusicTrackWithCreator[] {
  return TRACKS.map(withCreator)
}

// Distinct genres and moods across the catalog, for filter controls.
export function allGenres(): string[] {
  return Array.from(new Set(TRACKS.map((t) => t.genre))).sort()
}

export function allMoods(): string[] {
  return Array.from(new Set(TRACKS.flatMap((t) => t.moods))).sort()
}

export interface DiscoveryFilters {
  query?: string
  /** Gymnastics discipline — the primary discovery axis. */
  category?: GymnasticsCategoryId | "all"
  genre?: string
  /** Duration band id from taxonomy DURATION_BANDS. */
  duration?: string
  sort?: SortKey
}

export function filterTracks(filters: DiscoveryFilters): MusicTrackWithCreator[] {
  const { query, category, genre, duration, sort = "popular" } = filters
  let result = allTracksWithCreators()

  if (query && query.trim()) {
    const q = query.trim().toLowerCase()
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.creator.name.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q) ||
        t.moods.some((m) => m.toLowerCase().includes(q)),
    )
  }

  if (category && category !== "all") {
    result = result.filter((t) => t.gymnasticsCategories.includes(category))
  }

  if (genre && genre !== "all") {
    result = result.filter((t) => t.genre === genre)
  }

  if (duration && duration !== "all") {
    result = result.filter((t) => durationBandId(t.durationSeconds) === duration)
  }

  return sortTracks(result, sort)
}

export function sortTracks(
  tracks: MusicTrackWithCreator[],
  sort: SortKey,
): MusicTrackWithCreator[] {
  const copy = [...tracks]
  switch (sort) {
    case "popular":
      return copy.sort(
        (a, b) => b.sample.illustrativeLicences - a.sample.illustrativeLicences,
      )
    case "less-used":
      return copy.sort(
        (a, b) => a.sample.illustrativeLicences - b.sample.illustrativeLicences,
      )
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime(),
      )
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return copy
  }
}

// Tracks filed under a given gymnastics discipline.
export function tracksByCategory(
  category: GymnasticsCategoryId,
  limit?: number,
): MusicTrackWithCreator[] {
  const result = allTracksWithCreators().filter((t) =>
    t.gymnasticsCategories.includes(category),
  )
  return typeof limit === "number" ? result.slice(0, limit) : result
}

// Rails for the discover page.
export function popularRail(limit = 6): MusicTrackWithCreator[] {
  return sortTracks(allTracksWithCreators(), "popular").slice(0, limit)
}

// "Hidden gems" — the least-used tracks, surfaced so newer/quieter work gets a
// fair shot (spec §17). Uses illustrative sample counts only.
export function lessUsedRail(limit = 6): MusicTrackWithCreator[] {
  return sortTracks(allTracksWithCreators(), "less-used").slice(0, limit)
}

export function newestRail(limit = 6): MusicTrackWithCreator[] {
  return sortTracks(allTracksWithCreators(), "newest").slice(0, limit)
}

export function featuredCreators() {
  return CREATORS.filter((c) => c.featured)
}

export function allCreators() {
  return CREATORS
}
