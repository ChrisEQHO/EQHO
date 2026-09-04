"use client"

import Link from "next/link"
import { Play, Pause, Plus, Check } from "lucide-react"
import { useMusicStore } from "./music-store"
import type { MusicTrack } from "@/lib/music/types"
import { getCreatorById } from "@/lib/music/seed/creators"
import { PERSONAL_LICENCE } from "@/lib/music/seed/licence-tiers"
import { formatGBP } from "@/lib/music/pricing"
import { formatDuration } from "@/lib/music/taxonomy"
import { ArtworkPlaceholder } from "./artwork-placeholder"

// A single track slot in a grid/rail. Uses the branded CSS artwork placeholder
// (no fabricated cover art) and shows the single flat Personal Licence price.
export function TrackCard({ track }: { track: MusicTrack }) {
  const { nowPlayingId, isPlaying, playTrack, isInBasket, addToBasket } = useMusicStore()
  const isCurrent = nowPlayingId === track.id
  const isThisPlaying = isCurrent && isPlaying
  const inBasket = isInBasket(track.id)
  const creator = getCreatorById(track.creatorId)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-[#ff4fa3]/40">
      <div className="relative aspect-square overflow-hidden">
        <ArtworkPlaceholder
          accent={track.accent}
          label="Preview art"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={() => playTrack(track.id, track.previewUrl)}
          aria-label={isThisPlaying ? `Pause preview of ${track.title}` : `Play preview of ${track.title}`}
          className="absolute inset-0 flex items-center justify-center bg-[#020617]/40 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-white shadow-lg">
            {isThisPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
          </span>
        </button>
        <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white/85 backdrop-blur-sm">
          {formatDuration(track.durationSeconds)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <Link
            href={`/music/track/${track.slug}`}
            className="block truncate text-sm font-medium text-white hover:text-[#ff4fa3]"
          >
            {track.title}
          </Link>
          <Link
            href={`/music/creator/${creator?.slug ?? ""}`}
            className="block truncate text-xs text-white/50 hover:text-white/80"
          >
            {creator?.name ?? "Creator"}
          </Link>
        </div>

        <p className="truncate text-[11px] text-white/40">
          {track.genre} · {track.bpm} BPM
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold text-white">
            {formatGBP(PERSONAL_LICENCE.pricePence)}
          </span>
          <button
            type="button"
            onClick={() => addToBasket(track.id)}
            disabled={inBasket}
            className="flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/80 transition-colors hover:border-[#ff4fa3]/50 hover:text-white disabled:opacity-60"
          >
            {inBasket ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {inBasket ? "In basket" : "Add licence"}
          </button>
        </div>
      </div>
    </div>
  )
}
