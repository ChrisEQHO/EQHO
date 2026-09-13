'use client'

/**
 * Mounts PostHog under the SAME production/web gate as <Analytics /> and wires:
 * - lazy init on mount (no-op when not allowed / no key),
 * - manual App-Router pageviews,
 * - identify on auth (Supabase user id + coarse subscription status only),
 * - reset on logout,
 * - consent-driven replay toggling.
 *
 * It renders nothing. It never blocks or wraps the tree, so a failure here can
 * never take down the app or the Player.
 */

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useSubscription } from "@/lib/subscription-context"
import {
  initPostHog,
  capturePageview,
  identifyUser,
  resetUser,
  applyConsent,
} from "@/lib/analytics/posthog-client"
import { onConsentChange } from "@/lib/analytics/consent"

export function PostHogProvider() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { profile } = useSubscription()

  // Init once, then react to consent changes.
  useEffect(() => {
    let unsub = () => {}
    void initPostHog().then((ph) => {
      if (!ph) return
      unsub = onConsentChange(() => applyConsent())
    })
    return () => unsub()
  }, [])

  // Manual pageviews. Query string is included only as the raw path PostHog
  // reads; we never attach custom PII props here.
  useEffect(() => {
    if (!pathname) return
    const qs = searchParams?.toString()
    capturePageview(qs ? `${pathname}?${qs}` : pathname)
  }, [pathname, searchParams])

  // Identify strictly by internal user id; reset when signed out.
  useEffect(() => {
    if (profile?.id) {
      identifyUser(profile.id, profile.subscription_status ?? undefined)
    } else {
      resetUser()
    }
  }, [profile?.id, profile?.subscription_status])

  return null
}
