import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MapPin } from "lucide-react"
import { CREATORS, getCreatorBySlug } from "@/lib/music/seed/creators"
import { getTracksByCreator } from "@/lib/music/seed/tracks"
import { TrackCard } from "@/components/music/track-card"
import { CreatorAvatar } from "@/components/music/artwork-placeholder"

export function generateStaticParams() {
  return CREATORS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const creator = getCreatorBySlug(slug)
  if (!creator) return { title: "Creator — EQHO Music" }
  return { title: `${creator.name} — EQHO Music`, description: creator.tagline }
}

export default async function CreatorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const creator = getCreatorBySlug(slug)
  if (!creator) notFound()

  const tracks = getTracksByCreator(creator.id)

  return (
    <div className="flex flex-col gap-8 pb-16">
      <Link
        href="/music/creators"
        className="inline-flex w-fit items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All creators
      </Link>

      {/* Creator header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/10">
          <CreatorAvatar seed={creator.id} name={creator.name} className="h-full w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-white">{creator.name}</h1>
          <p className="text-sm text-[#ff4fa3]">{creator.tagline}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {creator.country}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {creator.genres.map((g) => (
              <span key={g} className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/60">
                {g}
              </span>
            ))}
          </div>
        </div>
      </header>

      <p className="max-w-2xl text-pretty text-sm leading-relaxed text-white/65">{creator.bio}</p>

      {/* Creator's library */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white">Tracks by {creator.name}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>
    </div>
  )
}
