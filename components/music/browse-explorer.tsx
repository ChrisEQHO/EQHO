"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { TrackCard } from "./track-card"
import { filterTracks, type SortKey } from "@/lib/music/catalog"

const SORTS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Most licensed" },
  { key: "less-used", label: "Hidden gems" },
  { key: "newest", label: "Newest" },
  { key: "title", label: "A–Z" },
]

export function BrowseExplorer({ genres, moods }: { genres: string[]; moods: string[] }) {
  const [query, setQuery] = useState("")
  const [genre, setGenre] = useState("all")
  const [mood, setMood] = useState("all")
  const [sort, setSort] = useState<SortKey>("popular")

  const results = useMemo(() => filterTracks({ query, genre, mood, sort }), [query, genre, mood, sort])

  const hasFilters = query.trim() !== "" || genre !== "all" || mood !== "all"
  const reset = () => {
    setQuery("")
    setGenre("all")
    setMood("all")
    setSort("popular")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks, artists, genres or moods"
            aria-label="Search the catalogue"
            className="w-full rounded-full border border-white/12 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-[var(--eqho-purple)]/60 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="music-sort" className="sr-only">
            Sort by
          </label>
          <select
            id="music-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-[var(--eqho-purple)]/60 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key} className="bg-[#0a0820]">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-col gap-3">
        <FilterRow label="Genre" value={genre} onChange={setGenre} options={genres} />
        <FilterRow label="Mood" value={mood} onChange={setMood} options={moods} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50" aria-live="polite">
          {results.length} {results.length === 1 ? "track" : "tracks"}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-16 text-center">
          <p className="text-sm text-white/60">No tracks match those filters.</p>
          <button type="button" onClick={reset} className="mt-2 text-sm text-[var(--eqho-purple)] hover:underline">
            Reset and show everything
          </button>
        </div>
      )}
    </div>
  )
}

function FilterRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  const all = ["all", ...options]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs uppercase tracking-wide text-white/40">{label}</span>
      {all.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={
              active
                ? "rounded-full bg-[var(--eqho-purple)] px-3 py-1 text-xs font-medium text-white"
                : "rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-xs text-white/70 transition-colors hover:border-white/25 hover:text-white"
            }
          >
            {opt === "all" ? `All ${label.toLowerCase()}s` : opt}
          </button>
        )
      })}
    </div>
  )
}
