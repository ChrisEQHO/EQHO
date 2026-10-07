'use client'

// The one shared analytics entry point for the website and the Capacitor apps.
//
//   - PRODUCT_EVENTS names (snake_case, see events.ts) go to PostHog on web AND
//     native builds, tagged with platform/native_app/app_version/build_target.
//   - Any other name is a legacy Vercel Analytics event and keeps its original
//     behaviour: production web build only.
//
// Every call is wrapped so analytics can never throw into the product or
// interrupt audio playback.
//
// PRIVACY: only pass anonymous, non-identifying data. Never pass email, user id,
// track/playlist/routine names, file names, URLs, tokens or free-text input.

import { track } from '@vercel/analytics'
import { captureEvent } from './posthog-client'
import { isProductEvent } from './events'

const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'

type EventProps = Record<string, string | number | boolean>

export function trackEvent(name: string, props?: EventProps): void {
  try {
    if (typeof window === 'undefined') return

    if (isProductEvent(name)) {
      captureEvent(name, props)
      return
    }

    if (isMobileBuild) return
    if (process.env.NODE_ENV !== 'production') return
    if (props) track(name, props)
    else track(name)
  } catch {
    // Analytics must never surface an error to the product. Swallow everything.
  }
}
