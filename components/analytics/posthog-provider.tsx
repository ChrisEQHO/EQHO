'use client'

/**
 * Mounts PostHog for the website and the Capacitor apps and wires:
 * - one-time init (no-op when not allowed / unconfigured / blocked),
 * - app_opened once per launch,
 * - identify on auth (Supabase user UUID + coarse subscription tier only),
 * - reset when an identified user disappears without the explicit logout path,
 * - consent-driven replay toggling (existing behaviour).
 *
 * It renders nothing and never wraps the tree, so a failure here can never take
 * down the app or the Player.
 */

import { useEffect, useState } from "react"
import { useSubscription } from "@/lib/subscription-context"
import {
  initPostHog,
  identifyUser,
  isUserIdentified,
  resetUser,
  applyConsent,
  trackAppOpened,
} from "@/lib/analytics/posthog-client"
import { onConsentChange } from "@/lib/analytics/consent"

export function PostHogProvider() {
  const { profile } = useSubscription()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let unsub = () => {}
    void initPostHog().then((ph) => {
      if (!ph || cancelled) return
      trackAppOpened()
      unsub = onConsentChange(() => applyConsent())
      setReady(true)
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const userId = profile?.id ?? null
  const tier = profile?.subscription_status ?? null

  useEffect(() => {
    if (!ready) return
    if (userId) {
      identifyUser(userId, tier)
    } else if (isUserIdentified()) {
      resetUser()
    }
  }, [ready, userId, tier])

  return null
}
