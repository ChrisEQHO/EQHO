'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

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
      // Scroll target for the "Try the demo below" indicator. ~96% width, capped
      // and centred; a comfortable desktop height (the real player fills it). The
      // player supplies its own responsive layout on tablet/mobile viewports.
      className="mx-auto w-[96%] max-w-[1600px] scroll-mt-28 overflow-hidden rounded-2xl border border-white/10 bg-[#050814] shadow-[0_0_60px_rgba(255,79,163,0.12)] h-[clamp(640px,82vh,920px)]"
    >
      <EqhoPlayer demoMode presentation="embedded" />
    </div>
  )
}
