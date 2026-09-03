"use client"

import Image from "next/image"
import Link from "next/link"
import { Play, Pause, X } from "lucide-react"
import { useMusicStore } from "@/components/music/music-store"
import { getTrackById } from "@/lib/music/seed/tracks"
import { getCreatorById } from "@/lib/music/seed/creators"

// Persistent bottom preview player. Fixed above the fold on every /music page so
// a chosen preview keeps playing across client navigation (the provider lives in
// the layout and never unmounts). Preview audio is a silent watermark clip in
// this phase, so the transport is fully functional without shipping any master.
export function MusicPlayerBar() {
  const { nowPlayingId, isPlaying, togglePlay, stopPlayback } = useMusicStore()

  if (!nowPlayingId) return null
  const track = getTrackById(nowPlayingId)
  if (!track) return null
  const creator = getCreatorById(track.creatorId)

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0820]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Image
          src={track.artwork || "/placeholder.svg"}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/music/tracks/${track.slug}`}
            className="block truncate text-sm font-semibold text-white hover:underline"
          >
            {track.title}
          </Link>
          <p className="truncate text-xs text-white/55">
            {creator?.name ?? "Unknown artist"}
            <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
              Preview
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
          className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#b86cff] to-[#ff4fa3] text-white transition-transform hover:scale-105"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={stopPlayback}
          aria-label="Close player"
          className="grid h-9 w-9 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
