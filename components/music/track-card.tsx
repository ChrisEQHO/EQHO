"use client"

import Image from "next/image"
import Link from "next/link"
import { Play, Pause, Plus, Check } from "lucide-react"
import { useMusicStore } from "./music-store"
import type { MusicTrack } from "@/lib/music/types"
import { getLicenceTier } from "@/lib/music/seed/licence-tiers"
import { getCreatorById } from "@/lib/music/seed/creators"
import { formatGBP } from "@/lib/music/pricing"

export function TrackCard({ track }: { track: MusicTrack }) {
  const { nowPlayingId, isPlaying, playTrack, isInBasket, addToBasket } = useMusicStore()
  const isCurrent = nowPlayingId === track.id
  const isThisPlaying = isCurrent && isPlaying
  const inBasket = isInBasket(track.id)

  const creator = getCreatorById(track.creatorId)

  // Cheapest available licence tier drives the "from" price on the card.
  const fromPence = Math.min(...track.availableTiers.map((id) => getLicenceTier(id).pricePence))
  // The lowest tier is the default the "Licence" quick-add uses.
  const defaultTier = track.availableTiers.reduce((lowest, id) =>
    getLicenceTier(id).pricePence < getLicenceTier(lowest).pricePence ? id : lowest,
  )

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-[var(--eqho-purple)]/40">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={track.artwork || "/placeholder.svg"}
          alt={`Artwork for ${track.title} by ${creator?.name ?? "unknown artist"}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={() => playTrack(track.id, track.previewUrl)}
          aria-label={isThisPlaying ? `Pause preview of ${track.title}` : `Play preview of ${track.title}`}
          className="absolute inset-0 flex items-center justify-center bg-[#020617]/40 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:outline-none"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--eqho-purple)] text-white shadow-lg">
            {isThisPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <Link
            href={`/music/track/${track.slug}`}
            className="block truncate text-sm font-medium text-white hover:text-[var(--eqho-purple)]"
          >
            {track.title}
          </Link>
          <Link
            href={`/music/creator/${creator?.slug ?? ""}`}
            className="block truncate text-xs text-white/50 hover:text-white/80"
          >
            {creator?.name ?? "Unknown artist"}
          </Link>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-white/70">
            from <span className="font-semibold text-white">{formatGBP(fromPence)}</span>
          </span>
          <button
            type="button"
            onClick={() => addToBasket(track.id, defaultTier)}
            disabled={inBasket}
            className="flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/80 transition-colors hover:border-[var(--eqho-purple)]/50 hover:text-white disabled:opacity-60"
          >
            {inBasket ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {inBasket ? "Added" : "Licence"}
          </button>
        </div>
      </div>
    </div>
  )
}
