// Single source of truth for "is this user allowed into the player?"
//
// Access is granted when ANY of these is true:
//   1. The user is an admin (email in the ADMIN_EMAILS allowlist)
//   2. The user has an active paid subscription (subscription_status === 'active')
//   3. The user is inside an active trial (subscription_status === 'trialing')
//
// On mobile/desktop Capacitor builds the Next.js middleware never runs (static
// export), so the player page enforces this client-side as well. When the device
// is offline we fall back to a grace window based on the last successful online
// verification, so previously-downloaded playlists keep working on a plane / in a
// gym basement without giving away indefinite free access.

import type { ProfileSubscription, SubscriptionStatus } from "@/lib/subscription-types"

// Comma-separated allowlist. NEXT_PUBLIC_* is readable in the browser (needed for
// the client gate on mobile); ADMIN_EMAILS is the server-side equivalent used by
// middleware. Either may be set.
function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function getAdminEmails(): string[] {
  // Merge both vars so it works whether configured for client or server.
  return Array.from(
    new Set([
      ...parseAdminEmails(process.env.NEXT_PUBLIC_ADMIN_EMAILS),
      ...parseAdminEmails(process.env.ADMIN_EMAILS),
    ])
  )
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

// Core entitlement check for an online, freshly-fetched profile.
export function hasActiveEntitlement(
  status: SubscriptionStatus | null | undefined,
  email?: string | null
): boolean {
  if (isAdminEmail(email)) return true
  return status === "active" || status === "trialing"
}

export function profileHasEntitlement(
  profile: ProfileSubscription | null,
  email?: string | null
): boolean {
  if (isAdminEmail(email)) return true
  return hasActiveEntitlement(profile?.subscription_status, email)
}

// ---- Offline grace handling ---------------------------------------------------

const LAST_VERIFIED_KEY = "eqho-entitlement-verified-at"
// How long downloaded content keeps playing without a fresh online check.
export const OFFLINE_GRACE_DAYS = 7
const OFFLINE_GRACE_MS = OFFLINE_GRACE_DAYS * 24 * 60 * 60 * 1000

// Call this whenever we successfully verify entitlement while ONLINE.
export function recordEntitlementVerified(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LAST_VERIFIED_KEY, String(Date.now()))
  } catch {
    /* ignore storage errors */
  }
}

// Clear the cached verification (e.g. on sign-out or when access is revoked).
export function clearEntitlementVerified(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(LAST_VERIFIED_KEY)
  } catch {
    /* ignore */
  }
}

export function getLastVerifiedAt(): number | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LAST_VERIFIED_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

// True if we previously verified entitlement online within the grace window.
export function isWithinOfflineGrace(now: number = Date.now()): boolean {
  const last = getLastVerifiedAt()
  if (last == null) return false
  return now - last <= OFFLINE_GRACE_MS
}

export function offlineGraceDaysRemaining(now: number = Date.now()): number {
  const last = getLastVerifiedAt()
  if (last == null) return 0
  const remaining = OFFLINE_GRACE_MS - (now - last)
  return remaining > 0 ? Math.ceil(remaining / (24 * 60 * 60 * 1000)) : 0
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true
  return navigator.onLine !== false
}
