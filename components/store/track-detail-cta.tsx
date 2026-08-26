'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Loader2, Lock, ArrowRight, Check } from 'lucide-react'
import type { EntitlementReason } from '@/lib/store/types'

/**
 * Context-aware action for a track detail page.
 *
 *  - Entitled (admin / subscription / completed purchase) -> Download clean master.
 *  - Signed out                                           -> Sign in to continue.
 *  - Signed in, subscription-included, not subscribed     -> Start subscription.
 *  - Signed in, purchasable, not entitled                 -> Buy (checkout lands
 *    in a later phase, so this is disabled with a clear note for now).
 */
export function TrackDetailCta({
  slug,
  hasPrice,
  includedInSubscription,
  signedIn,
  entitled,
  reason,
}: {
  slug: string
  hasPrice: boolean
  includedInSubscription: boolean
  signedIn: boolean
  entitled: boolean
  reason: EntitlementReason
}) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = async () => {
    setError(null)
    setDownloading(true)
    try {
      // Hit the gated master endpoint as an attachment; the browser saves it.
      const res = await fetch(
        `/api/store/audio?slug=${encodeURIComponent(slug)}&type=master&download=1`,
        { credentials: 'include' },
      )
      if (!res.ok) {
        if (res.status === 401) setError('Please sign in again to download.')
        else if (res.status === 403) setError('This track is not in your library.')
        else setError('Download failed. Please try again.')
        setDownloading(false)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}.mp3`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  // Entitled: allow download.
  if (entitled) {
    return (
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-6 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03] disabled:opacity-70"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {downloading ? 'Preparing…' : 'Download track'}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-[#86efac]">
          <Check className="h-3.5 w-3.5" />
          {reason === 'purchase'
            ? 'In your library'
            : reason === 'admin'
              ? 'Admin access'
              : 'Included with your subscription'}
        </span>
        {error ? <span className="text-xs text-[#ff8a8a]">{error}</span> : null}
      </div>
    )
  }

  // Signed out: prompt sign in (return here after login).
  if (!signedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/store/${slug}`)}`}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-6 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
      >
        Sign in to get this track
        <ArrowRight className="h-4 w-4" />
      </Link>
    )
  }

  // Signed in but not entitled. Prefer the subscription path when applicable.
  if (includedInSubscription) {
    return (
      <Link
        href="/pricing"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-6 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
      >
        Subscribe to unlock
        <ArrowRight className="h-4 w-4" />
      </Link>
    )
  }

  // Purchasable but individual checkout is not wired up yet (later phase).
  if (hasPrice) {
    return (
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <button
          type="button"
          disabled
          className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-sm font-semibold text-white/60"
        >
          <Lock className="h-4 w-4" />
          Buy — coming soon
        </button>
        <span className="text-xs text-[#7c8596]">Individual purchases open soon.</span>
      </div>
    )
  }

  // Subscription-only track, not subscribed.
  return (
    <Link
      href="/pricing"
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-6 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
    >
      Subscribe to unlock
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}
