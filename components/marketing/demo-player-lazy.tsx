'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Loader2, ArrowRight } from 'lucide-react'

/**
 * Public inline embed of the REAL EQHO player running in read-only demo mode.
 *
 * The exact same <EqhoPlayer /> component that powers the authenticated /app
 * player is mounted here with `demoMode` (logged-out: no Supabase auth, playlists
 * seeded from the public /api/demo snapshot, every cloud/account/upload path
 * disabled) and `presentation="embedded"` (fills THIS container instead of the
 * viewport; see EqhoPlayer for how the size-container + --eqho-vh remap works).
 *
 * The player is ALWAYS mounted directly in the page flow — there is NO launch
 * card, NO full-screen overlay, NO close button and NO static image/screenshot
 * fallback. Data loading, empty and error states (with Retry) are handled INSIDE
 * <EqhoPlayer demoMode /> against the same-origin /api/demo endpoint, so
 * production (which has the published R2 snapshot) always gets the real,
 * interactive player. The bundle is code-split (next/dynamic, ssr:false).
 *
 * Sizing: ~96% of the browser width (capped) and a comfortable desktop height on
 * large screens; the player's own responsive layout takes over on tablet/mobile.
 * No scaling transform is used, so the interface stays crisp and fully usable.
 */

const EqhoPlayer = dynamic(
  () => import('@/components/player/eqho-player').then((m) => m.EqhoPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#050814]">
        <p className="flex items-center gap-2 text-[#94a3b8]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading the demo…
        </p>
      </div>
    ),
  },
)

export function DemoPlayerLazy() {
  return (
    <div
      id="eqho-embedded-player"
      // Scroll target for the "Try the demo below" indicator. The block is sized
      // to FILL the viewport below the sticky site header (h-16 = 4rem), and
      // scroll-mt-16 makes the anchor jump land its top exactly beneath that
      // header — so clicking "Try the demo below" snaps the whole demo to fit the
      // screen. Flex column: the fixed toolbar sits on top, the player box takes
      // all remaining height. ~96% width, capped and centred; the player supplies
      // its own responsive layout on tablet/mobile viewports.
      className="mx-auto flex h-[calc(100svh-4rem)] w-[96%] max-w-[1600px] scroll-mt-16 flex-col"
    >
      {/* Branded toolbar above the player. The orange→pink "Start free trial"
          button (linking to /signup) is the primary conversion action right where
          the visitor is engaging with the live player. */}
      <div className="mb-3 flex flex-shrink-0 items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
          Interactive demo
        </span>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,79,163,0.35)] transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4fa3]"
        >
          Start free trial
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {/* The real player box — fills all remaining height so the demo fits the
          screen. min-h-0 lets the flex child shrink correctly.
          It is ALSO the named size container (`eqhoembed`): the embedded-mobile
          layout rules in globals.css (`@container eqhoembed (max-width:1023px)`)
          target the player root/shell/controls INSIDE this box. The container
          must sit on this PARENT box (not the player root) because a
          container-query cannot style the container element itself — only its
          descendants — so the player root needs an ancestor container to receive
          `display:flex`. */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#050814] shadow-[0_0_60px_rgba(255,79,163,0.12)] [container-type:size] [container-name:eqhoembed]">
        <EqhoPlayer demoMode presentation="embedded" />
      </div>
    </div>
  )
}
