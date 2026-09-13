'use client'

/**
 * Analytics consent state.
 *
 * Session replay and any enriched capture stay OFF until the user explicitly
 * opts in. This is deliberately strict for the gymnastics context, where minors
 * are frequently on screen and in audio.
 *
 * Consent is persisted in localStorage so the choice survives reloads, and a
 * lightweight subscription lets the provider react immediately when it changes.
 */

export type ConsentValue = "granted" | "denied" | "unset"

const STORAGE_KEY = "eqho_analytics_consent"

type Listener = (value: ConsentValue) => void
const listeners = new Set<Listener>()

/** Read the persisted consent choice. Safe during SSR (returns "unset"). */
export function getConsent(): ConsentValue {
  if (typeof window === "undefined") return "unset"
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === "granted" || raw === "denied") return raw
    return "unset"
  } catch {
    return "unset"
  }
}

/** Persist a consent choice and notify subscribers. */
export function setConsent(value: Exclude<ConsentValue, "unset">): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore storage failures (private mode, quota) — treated as "unset" next read
  }
  for (const listener of listeners) {
    try {
      listener(value)
    } catch {
      // a broken listener must never break consent propagation
    }
  }
}

export function hasConsent(): boolean {
  return getConsent() === "granted"
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function onConsentChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
