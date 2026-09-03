import { CREATORS } from "@/lib/music/seed/creators"
import { getTracksByCreator } from "@/lib/music/seed/tracks"
import { CreatorCard } from "@/components/music/creator-card"

export const metadata = {
  title: "Creators — EQHO Music",
  description: "Independent artists building their catalogue on EQHO Music.",
}

export default function CreatorsPage() {
  return (
    <div className="flex flex-col gap-6 pb-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">Creators</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-white/55">
          Independent artists licensing their work through EQHO Music. Every licence you buy pays the creator who made
          the track.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CREATORS.map((creator) => (
          <CreatorCard key={creator.id} creator={creator} trackCount={getTracksByCreator(creator.id).length} />
        ))}
      </div>
    </div>
  )
}
