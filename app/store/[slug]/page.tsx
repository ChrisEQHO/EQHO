import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, Clock, Gauge, Tag } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { TrackPreviewPlayer } from '@/components/store/track-preview-player'
import { TrackDetailCta } from '@/components/store/track-detail-cta'
import { getTrackBySlug } from '@/lib/store/catalog'
import { resolveEntitlement, hasCompletedPurchase } from '@/lib/store/entitlement'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { formatPrice, formatDuration } from '@/lib/store/format'
import { SITE } from '@/lib/marketing-config'
import type { SubscriptionStatus } from '@/lib/subscription-types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const track = await getTrackBySlug(slug)
  if (!track) return { title: `Track not found | ${SITE.name}` }
  return {
    title: `${track.title}${track.artist ? ` — ${track.artist}` : ''} | ${SITE.name} store`,
    description: track.description || `Preview and get ${track.title} for your training sessions.`,
    alternates: { canonical: `/store/${track.slug}` },
  }
}

// Resolve the signed-in user's entitlement for this track, server-side.
async function getViewerEntitlement(track: {
  id: string
  included_in_subscription: boolean
}) {
  const supabase = await createClient()
  if (!supabase) return { signedIn: false, entitled: false, reason: 'none' as const }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { signedIn: false, entitled: false, reason: 'none' as const }

  const admin = (() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  })()

  let subscriptionStatus: SubscriptionStatus | null = null
  if (admin) {
    const { data: profile } = await admin
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .maybeSingle()
    subscriptionStatus = (profile?.subscription_status as SubscriptionStatus) ?? null
  }
  const hasPurchase = await hasCompletedPurchase(user.id, track.id)
  const entitlement = resolveEntitlement({
    track,
    email: user.email,
    subscriptionStatus,
    hasPurchase,
  })
  return { signedIn: true, entitled: entitlement.entitled, reason: entitlement.reason }
}

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const track = await getTrackBySlug(slug)
  if (!track) notFound()

  const viewer = await getViewerEntitlement(track)
  const price = track.price_cents != null ? formatPrice(track.price_cents, track.currency) : null

  return (
    <div className="flex min-h-screen flex-col bg-[#020617]">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#94a3b8] transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </Link>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            {track.category ? (
              <Link
                href="/store"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#aeb9d4] transition-colors hover:text-white"
              >
                <Tag className="h-3 w-3" />
                {track.category.name}
              </Link>
            ) : null}

            <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {track.title}
            </h1>
            {track.artist ? (
              <p className="mt-1 text-base text-[#94a3b8]">{track.artist}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#7c8596]">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span className="tabular-nums">{formatDuration(track.duration_seconds)}</span>
              </span>
              {track.bpm ? (
                <span className="inline-flex items-center gap-1.5">
                  <Gauge className="h-4 w-4" />
                  {track.bpm} BPM
                </span>
              ) : null}
              {track.included_in_subscription ? (
                <span className="inline-flex items-center gap-1.5 text-[#86efac]">
                  <Check className="h-4 w-4" />
                  Included with subscription
                </span>
              ) : null}
            </div>

            {track.description ? (
              <p className="mt-6 max-w-2xl text-pretty leading-relaxed text-[#cbd5e1]">
                {track.description}
              </p>
            ) : null}

            {/* Preview player */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                Listen to the preview
              </p>
              <TrackPreviewPlayer slug={track.slug} durationSeconds={track.duration_seconds} />
            </div>

            {/* Context-aware CTA */}
            <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {price ? (
                  <p className="text-2xl font-bold text-white">{price}</p>
                ) : (
                  <p className="text-lg font-semibold text-white">Subscription only</p>
                )}
                <p className="mt-1 text-sm text-[#94a3b8]">
                  {track.included_in_subscription
                    ? 'Included free with an active EQHO subscription.'
                    : 'Available as an individual purchase.'}
                </p>
              </div>
              <TrackDetailCta
                slug={track.slug}
                hasPrice={price != null}
                includedInSubscription={track.included_in_subscription}
                signedIn={viewer.signedIn}
                entitled={viewer.entitled}
                reason={viewer.reason}
              />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
