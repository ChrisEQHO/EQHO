import Link from 'next/link'
import { ArrowRight, Music2 } from 'lucide-react'
import { formatPrice, formatDuration } from '@/lib/store/format'
import type { StoreTrackWithCategory } from '@/lib/store/types'
import { TrackPreviewPlayer } from '@/components/store/track-preview-player'

/**
 * Storefront grid card for a single track: title/artist, meta (duration, BPM,
 * category), an inline watermarked-preview player, and a price + detail CTA.
 */
export function TrackCard({ track }: { track: StoreTrackWithCategory }) {
  const price = track.price_cents != null ? formatPrice(track.price_cents, track.currency) : null

  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">{track.title}</h3>
          {track.artist ? (
            <p className="mt-0.5 truncate text-sm text-[#94a3b8]">{track.artist}</p>
          ) : null}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#aeb9d4]">
          <Music2 className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7c8596]">
        <span className="tabular-nums">{formatDuration(track.duration_seconds)}</span>
        {track.bpm ? (
          <>
            <span aria-hidden="true">•</span>
            <span>{track.bpm} BPM</span>
          </>
        ) : null}
        {track.category ? (
          <>
            <span aria-hidden="true">•</span>
            <span>{track.category.name}</span>
          </>
        ) : null}
      </div>

      <div className="mt-4">
        <TrackPreviewPlayer slug={track.slug} durationSeconds={track.duration_seconds} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="text-sm">
          {price ? (
            <span className="font-semibold text-white">{price}</span>
          ) : (
            <span className="text-[#94a3b8]">Included with subscription</span>
          )}
          {price && track.included_in_subscription ? (
            <span className="ml-2 text-xs text-[#7c8596]">or with subscription</span>
          ) : null}
        </div>
        <Link
          href={`/store/${track.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          View
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
