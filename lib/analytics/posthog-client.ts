'use client'

/**
 * Client-side PostHog wrapper — the single PostHog instance for the website AND
 * the installed Capacitor (iOS/iPadOS/Android) apps.
 *
 * Runs only in production builds (web or mobile), never in development,
 * automated tests (NODE_ENV=test) or the v0 preview. Without both
 * NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST it no-ops entirely, so
 * the app is fully functional when PostHog is unconfigured, blocked or offline.
 *
 * Privacy posture:
 * - `person_profiles: 'identified_only'` — anonymous visitors get no profile.
 * - autocapture, pageviews and pageleave OFF — only the explicit PRODUCT_EVENTS.
 * - session replay stays disabled; the existing consent flow is the only thing
 *   that can turn it on, and even then it masks all inputs + text and blocks
 *   audio/file nodes.
 */

import type { PostHog } from "posthog-js"
import { isProductEvent, sanitizeProps } from "./events"
import { hasConsent } from "./consent"
import { getPlatformContext } from "./device"

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST
const isV0Preview = process.env.NEXT_PUBLIC_V0_PREVIEW === "true"

let instance: PostHog | null = null
let initPromise: Promise<PostHog | null> | null = null
let warnedMissingEnv = false
let appOpenedSent = false
let identifiedKey: string | null = null

const isDevelopment = () => process.env.NODE_ENV === "development"

/** Development-only diagnostics. Never prints keys, tokens or personal data. */
export function debugAnalytics(message: string, detail?: Record<string, unknown>): void {
  if (!isDevelopment()) return
  try {
    console.info(`[analytics] ${message}`, detail ?? "")
  } catch {
    /* no-op */
  }
}

function hasConfig(): boolean {
  return Boolean(KEY && HOST)
}

/** True only where PostHog is allowed to initialise. */
export function analyticsAllowed(): boolean {
  if (typeof window === "undefined") return false
  if (process.env.NODE_ENV !== "production") return false
  if (isV0Preview) return false
  return hasConfig()
}

/** Lazily initialise PostHog once. Resolves to null when not allowed or on failure. */
export async function initPostHog(): Promise<PostHog | null> {
  if (!hasConfig() && isDevelopment() && !warnedMissingEnv) {
    warnedMissingEnv = true
    console.warn(
      "[analytics] NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST is not set; PostHog is disabled.",
    )
  }
  if (!analyticsAllowed()) {
    debugAnalytics("PostHog not initialised", {
      reason: process.env.NODE_ENV !== "production" ? process.env.NODE_ENV : "unconfigured",
      ...pick(getPlatformContext()),
    })
    return null
  }
  if (instance) return instance
  if (initPromise) return initPromise

  initPromise = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(KEY as string, {
        api_host: HOST as string,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        person_profiles: "identified_only",
        persistence: "localStorage",
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "*",
          blockSelector: '[data-ph-no-capture],audio,video,input[type="file"]',
        },
        loaded: (ph) => {
          applyConsent(ph as unknown as PostHog)
        },
      })
      instance = posthog
      debugAnalytics("PostHog initialised", pick(getPlatformContext()))
      return posthog
    })
    .catch(() => {
      // Blocked/offline/failed chunk load: stay a silent no-op. Allow a retry later.
      initPromise = null
      return null
    })

  return initPromise
}

function pick(ctx: ReturnType<typeof getPlatformContext>) {
  return { platform: ctx.platform, native_app: ctx.native_app }
}

/** Turn replay on/off to match the existing consent choice. */
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

/** Capture a PRODUCT_EVENTS event with sanitized, platform-tagged properties. */
export function captureEvent(event: string, props?: Record<string, unknown>): void {
  try {
    if (!isProductEvent(event)) return
    const context = getPlatformContext()
    debugAnalytics(`capture ${event}`, {
      initialised: Boolean(instance),
      ...pick(context),
    })
    if (!instance) return
    instance.capture(event, {
      ...sanitizeProps(props),
      ...context,
    })
  } catch {
    // analytics must never surface an error to the product
  }
}

/** Send app_opened once per JS runtime (one app launch / browser page load). */
export function trackAppOpened(): void {
  if (appOpenedSent || !instance) return
  appOpenedSent = true
  captureEvent("app_opened")
}

/**
 * Identify by the internal Supabase user UUID ONLY. Person properties are
 * limited to platform, native_app and a coarse subscription tier. Repeated
 * calls with the same values are ignored.
 */
export function identifyUser(userId: string, subscriptionTier?: string | null): void {
  if (!instance || !userId) return
  const key = `${userId}|${subscriptionTier ?? ""}`
  if (identifiedKey === key) return
  try {
    const { platform, native_app } = getPlatformContext()
    instance.identify(userId, {
      platform,
      native_app,
      subscription_tier: subscriptionTier ?? "unknown",
    })
    identifiedKey = key
  } catch {
    /* no-op */
  }
}

export function isUserIdentified(): boolean {
  return identifiedKey !== null
}

/** Forget the identified user (call after logout_completed has been captured). */
export function resetUser(): void {
  identifiedKey = null
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
