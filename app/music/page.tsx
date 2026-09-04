import Link from "next/link"
import { ArrowRight, Sparkles, Compass } from "lucide-react"
import { popularRail, lessUsedRail, newestRail, featuredCreators } from "@/lib/music/catalog"
import { TRACKS } from "@/lib/music/seed/tracks"
import { TrackRail } from "@/components/music/track-rail"
import { CreatorCard } from "@/components/music/creator-card"

export const metadata = {
  title: "EQHO Music — Licence music from independent creators",
  description: "A private preview of the EQHO Music marketplace.",
}

export default function MusicHomePage() {
  const popular = popularRail(5)
  const lessUsed = lessUsedRail(5)
  const newest = newestRail(5)
  const creators = featuredCreators()

  const trackCountByCreator = (creatorId: string) => TRACKS.filter((t) => t.creatorId === creatorId).length

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#ff4fa3]/20 via-[#020617] to-[#020617] px-6 py-12 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#ff8a00]/15 blur-3xl" />
        <div className="relative z-10 flex max-w-2xl flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#ff4fa3]/40 bg-[#ff4fa3]/10 px-3 py-1 text-xs font-medium text-[#ff8fc4]">
            <Sparkles className="h-3.5 w-3.5" />
            Private preview
          </span>
          <h1 className="text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Licence distinctive music from independent creators
          </h1>
          <p className="text-pretty text-base leading-relaxed text-white/60">
            Clear, honest licensing. Every track comes with a single Personal Licence, watermarked previews, and a fair
            spotlight for lesser-heard work — not just the top of the charts.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/music/browse"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#ff4fa3]/25 transition-transform hover:scale-[1.03]"
            >
              <Compass className="h-4 w-4" />
              Browse the catalogue
            </Link>
            <Link
              href="/music/creators"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
            >
              Meet the creators
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <TrackRail
        title="Popular this month"
        description="What other creators are licensing most. Sample data — illustrative only."
        tracks={popular}
      />

      <TrackRail
        title="Hidden gems"
        description="Fresh and lesser-used tracks that deserve a listen — surfaced fairly, not buried."
        tracks={lessUsed}
      />

      <TrackRail title="New arrivals" description="The latest additions to the catalogue." tracks={newest} />

      {/* Featured creators */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-white">Featured creators</h2>
            <p className="text-sm text-white/50">Independent artists building their catalogue on EQHO.</p>
          </div>
          <Link
            href="/music/creators"
            className="hidden shrink-0 items-center gap-1 text-sm text-[#ff4fa3] hover:underline sm:inline-flex"
          >
            All creators
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} trackCount={trackCountByCreator(creator.id)} />
          ))}
        </div>
      </section>
    </div>
  )
}
