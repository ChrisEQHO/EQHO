import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, Gauge, Music2 } from "lucide-react"
import { TRACKS, getTrackBySlug, getTracksByCreator } from "@/lib/music/seed/tracks"
import { getCreatorById } from "@/lib/music/seed/creators"
import { LicenceSelector } from "@/components/music/licence-selector"
import { PopularityPanel } from "@/components/music/popularity-panel"
import { TrackPreviewButton } from "@/components/music/track-preview-button"
import { TrackCard } from "@/components/music/track-card"
import { isMusicSubscriber } from "@/lib/music/subscriber"

export function generateStaticParams() {
  return TRACKS.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const track = getTrackBySlug(slug)
  if (!track) return { title: "Track — EQHO Music" }
  return { title: `${track.title} — EQHO Music`, description: track.description }
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default async function TrackDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const track = getTrackBySlug(slug)
  if (!track) notFound()

  const creator = getCreatorById(track.creatorId)
  const subscriber = await isMusicSubscriber()
  const moreFromCreator = getTracksByCreator(track.creatorId)
    .filter((t) => t.id !== track.id)
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-10 pb-16">
      <Link
        href="/music/browse"
        className="inline-flex w-fit items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to browse
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left: artwork + details */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="relative aspect-square w-full max-w-[240px] shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Image
                src={track.artwork || "/placeholder.svg"}
                alt={`Artwork for ${track.title}`}
                fill
                sizes="240px"
                className="object-cover"
              />
              <div className="absolute bottom-3 left-3">
                <TrackPreviewButton trackId={track.id} previewUrl={track.previewUrl} title={track.title} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <h1 className="text-3xl font-semibold text-white">{track.title}</h1>
                {creator && (
                  <Link
                    href={`/music/creator/${creator.slug}`}
                    className="mt-1 inline-block text-sm text-[var(--eqho-purple)] hover:underline"
                  >
                    {creator.name}
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">{track.genre}</span>
                {track.moods.map((m) => (
                  <span key={m} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/55">
                    {m}
                  </span>
                ))}
              </div>

              <dl className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/60">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-white/40" />
                  <dt className="sr-only">Duration</dt>
                  <dd>{formatDuration(track.durationSeconds)}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-white/40" />
                  <dt className="sr-only">Tempo</dt>
                  <dd>{track.bpm} BPM</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <Music2 className="h-3.5 w-3.5 text-white/40" />
                  <dt className="sr-only">Key</dt>
                  <dd>{track.musicalKey}</dd>
                </div>
              </dl>

              <p className="mt-1 max-w-md text-pretty text-sm leading-relaxed text-white/65">{track.description}</p>

              <p className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-white/45">
                Preview is a watermarked clip — the licensed master is delivered after purchase.
              </p>
            </div>
          </div>

          <PopularityPanel sample={track.sample} />
        </div>

        {/* Right: licence selector */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <LicenceSelector trackId={track.id} availableTiers={track.availableTiers} isSubscriber={subscriber} />
        </aside>
      </div>

      {moreFromCreator.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white">More from {creator?.name}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {moreFromCreator.map((t) => (
              <TrackCard key={t.id} track={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
