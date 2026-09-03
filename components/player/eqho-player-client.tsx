'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

/**
 * Client-only mount of the authenticated production player.
 *
 * WHY ssr:false: <EqhoPlayer /> is a ~10k-line browser-first component. It
 * mutates refs during render, seeds state from browser-only APIs (window,
 * navigator, localStorage, IndexedDB) and drives audio/canvas/timers. When it
 * is server-rendered and then hydrated (the default for a client component
 * imported directly into a Server Component page), the server HTML and the
 * first client render can diverge, which surfaces in production as a minified
 * React hydration error (#310/#418-class) on /app — a crash that static hook
 * analysis can never explain because it is a hydration mismatch, not a rules-of-
 * hooks violation.
 *
 * The public /features demo already mounts this exact component via
 * next/dynamic({ ssr:false }) and never crashes. This wrapper gives the
 * authenticated /app route the same client-only treatment so both paths render
 * identically. See components/marketing/demo-player-lazy.tsx for the sibling.
 */
const EqhoPlayer = dynamic(
  () => import('@/components/player/eqho-player').then((m) => m.EqhoPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#020617]">
        <p className="flex items-center gap-2 text-[#94a3b8]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading…
        </p>
      </div>
    ),
  },
)

export function EqhoPlayerClient() {
  return <EqhoPlayer />
}
