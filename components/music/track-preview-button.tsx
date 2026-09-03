"use client"

import { Play, Pause } from "lucide-react"
import { useMusicStore } from "./music-store"

// Large play/pause overlay used on the track detail artwork. Drives the same
// shared preview player as the cards and the persistent bar.
export function TrackPreviewButton({
  trackId,
  previewUrl,
  title,
}: {
  trackId: string
  previewUrl: string
  title: string
}) {
  const { nowPlayingId, isPlaying, playTrack } = useMusicStore()
  const isThisPlaying = nowPlayingId === trackId && isPlaying

  return (
    <button
      type="button"
      onClick={() => playTrack(trackId, previewUrl)}
      aria-label={isThisPlaying ? `Pause preview of ${title}` : `Play preview of ${title}`}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-white shadow-lg shadow-[#ff4fa3]/30 transition-transform hover:scale-105"
    >
      {isThisPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
    </button>
  )
}
