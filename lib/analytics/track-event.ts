'use client'

// Safe wrapper around Vercel Analytics custom events.
//
// This is the ONLY place the app calls `track()` from @vercel/analytics. It
// exists so that:
//   1. Analytics can NEVER break the website or Player — every call is wrapped
//      in try/catch and can throw nothing to the caller.
//   2. Custom events respect the SAME architecture as the existing <Analytics />
//      component in app/layout.tsx: production web build only. They are excluded
//      from the Capacitor/mobile build and from dev/preview, exactly like the
//      page-view tracking already is.
//
// It does NOT install or mount Analytics — the single <Analytics /> instance in
// the root layout is untouched. `track()` simply forwards anonymous, aggregate
// events to that existing pipeline once the site is deployed to production web.
//
// PRIVACY: only pass anonymous, non-identifying data. Never pass email, user id,
// track/playlist/routine names, file names, URLs, tokens or free-text input.

import { track } from '@vercel/analytics'

// Matches the gate used for <Analytics /> in app/layout.tsx.
const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

// Only non-sensitive, low-cardinality string labels are ever allowed.
type EventProps = Record<string, string>

export function trackEvent(name: string, props?: EventProps): void {
  try {
    // Client-only. Never attempt to track during SSR/build.
    if (typeof window === 'undefined') return
    // Respect the existing architecture: web production build only.
    if (isMobileBuild) return
    if (process.env.NODE_ENV !== 'production') return

    if (props) track(name, props)
    else track(name)
  } catch {
    // Analytics must never surface an error to the product. Swallow everything.
  }
}
