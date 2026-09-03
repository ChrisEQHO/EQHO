import { TrackCard } from "./track-card"
import type { MusicTrack } from "@/lib/music/types"

export function TrackRail({
  title,
  description,
  tracks,
}: {
  title: string
  description?: string
  tracks: MusicTrack[]
}) {
  if (tracks.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description && <p className="text-sm text-white/50">{description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </section>
  )
}
