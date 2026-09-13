'use client'

/**
 * Client-side PostHog wrapper.
 *
 * Mirrors the EXACT gate used for <Analytics /> in app/layout.tsx: web
 * production build only — never in the Capacitor/mobile build, never in dev,
 * never in the v0 preview. Without a configured key it no-ops entirely, so the
 * app is fully functional before PostHog is provisioned.
 *
 * Privacy posture:
 * - `person_profiles: 'identified_only'` — anonymous visitors get no profile.
 * - autocapture and DOM/heatmap capture OFF — we only send explicit, sanitized
 *   events from the catalogue.
 * - pageviews captured manually (App Router has no full page loads).
 * - session replay is preconfigured but DISABLED until explicit consent, and
 *   even then masks all inputs + text and blocks audio/file nodes.
 */

import type { PostHog } from "posthog-js"
import { sanitizeProps, type AnalyticsEvent } from "./events"
import { hasConsent } from "./consent"
import { getDeviceContext } from "./device"

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com"
const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile"
const isV0Preview = process.env.NEXT_PUBLIC_V0_PREVIEW === "true"

let instance: PostHog | null = null
let initPromise: Promise<PostHog | null> | null = null

/** True only where the existing <Analytics /> is allowed to run. */
export function analyticsAllowed(): boolean {
  if (typeof window === "undefined") return false
  if (isMobileBuild) return false
  if (isV0Preview) return false
  if (process.env.NODE_ENV !== "production") return false
  return Boolean(KEY)
}

/** Lazily initialise PostHog. Resolves to null when analytics is not allowed. */
export async function initPostHog(): Promise<PostHog | null> {
  if (!analyticsAllowed()) return null
  if (instance) return instance
  if (initPromise) return initPromise

  initPromise = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(KEY as string, {
      api_host: HOST,
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: true, // enabled only after consent, see applyConsent()
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "*",
        blockSelector: '[data-ph-no-capture],audio,video,input[type="file"]',
      },
      // Low sample rate: replay is a rare, consented diagnostic — not default-on.
      loaded: (ph) => {
        applyConsent(ph)
      },
    })
    instance = posthog
    return posthog
  })

  return initPromise
}

/** Turn replay on/off to match the current consent choice. */
export function applyConsent(ph: PostHog | null = instance): void {
  if (!ph) return
  try {
    if (hasConsent()) {
      ph.startSessionRecording()
    } else {
      ph.stopSessionRecording()
    }
  } catch {
    // never break the app over replay toggling
  }
}

/** Capture a catalogue event with sanitized, device-tagged properties. */
export function captureEvent(
  event: AnalyticsEvent,
  props?: Record<string, unknown>,
): void {
  if (!instance) return
  try {
    instance.capture(event, {
      ...sanitizeProps(props),
      ...getDeviceContext(),
    })
  } catch {
    // analytics must never surface an error to the product
  }
}

/** Manual App-Router pageview. `path` must not contain query PII. */
export function capturePageview(path: string): void {
  if (!instance) return
  try {
    instance.capture("$pageview", { $current_url: path })
  } catch {
    /* no-op */
  }
}

/**
 * Identify by the internal Supabase user id ONLY. The single allowed person
 * property is a coarse subscription status. Never pass email/name/free text.
 */
export function identifyUser(
  userId: string,
  subscriptionStatus?: string,
): void {
  if (!instance || !userId) return
  try {
    instance.identify(
      userId,
      subscriptionStatus ? { subscription_status: subscriptionStatus } : undefined,
    )
  } catch {
    /* no-op */
  }
}

export function resetUser(): void {
  if (!instance) return
  try {
    instance.reset()
  } catch {
    /* no-op */
  }
}

/**
 * Group analytics by club. No-op today (no club model exists yet). When a club
 * id is available, calling this associates the user with that group with zero
 * refactor elsewhere.
 */
export function groupClub(clubId?: string | null): void {
  if (!instance || !clubId) return
  try {
    instance.group("club", clubId)
  } catch {
    /* no-op */
  }
}

export function getPostHog(): PostHog | null {
  return instance
}
