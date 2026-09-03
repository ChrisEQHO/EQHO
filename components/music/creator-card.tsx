import Link from "next/link"
import type { MusicCreator } from "@/lib/music/types"
import { ArtworkPlaceholder } from "./artwork-placeholder"

// A creator slot in the directory. Uses the branded ring placeholder (no
// fabricated photos) and neutral slot label copy.
export function CreatorCard({ creator, trackCount }: { creator: MusicCreator; trackCount: number }) {
  return (
    <Link
      href={`/music/creator/${creator.slug}`}
      className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center transition-colors hover:border-[#ff4fa3]/40"
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/10 transition-all group-hover:ring-[#ff4fa3]/50">
        <ArtworkPlaceholder accent={creator.accent} variant="creator" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white group-hover:text-[#ff4fa3]">{creator.name}</p>
        <p className="truncate text-xs text-white/50">{creator.tagline}</p>
      </div>
      <span className="mt-auto rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/60">
        {trackCount} {trackCount === 1 ? "slot" : "slots"}
      </span>
    </Link>
  )
}
