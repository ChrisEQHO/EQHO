// ─────────────────────────────────────────────────────────────────────────────
// EQHO Player — single server-side entitlement authority
//
// This module is the ONE place that decides "is this user allowed into the
// player right now?". Middleware, protected APIs and the mobile client gate all
// defer to `evaluateEntitlement` so the rule can never drift between surfaces.
//
// Two phases, driven by a single instant (`PAYWALL_START_AT`, default
// 1 Oct 2026 00:00 Europe/London):
//   • BEFORE the instant  → "free" phase: any authenticated user is allowed,
//                            no card, no Stripe.
//   • FROM the instant on → "paywall" phase: the user needs a live entitlement
//                            (their own Stripe trial/subscription) or a valid
//                            grace window. Each user's 30-day trial starts only
//                            when THEY complete Checkout.
//
// The decision is always made from TRUSTED SERVER TIME. Clients never decide
// from their own clock — they ask `/api/entitlement`.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProfileSubscription, SubscriptionStatus } from "@/lib/subscription-types"
import { isAdminEmail } from "@/lib/access"

// Default changeover instant. `+01:00` is British Summer Time, which is the
// London offset on 1 October 2026 (UK clocks don't go back until 25 Oct 2026).
// This equals 2026-09-30T23:00:00.000Z in UTC. Overridable via env without code.
export const DEFAULT_PAYWALL_START_AT = "2026-10-01T00:00:00+01:00"

export type EntitlementPhase = "free" | "paywall"

export type EntitlementReason =
  | "admin"
  | "free-phase"
  | "trialing"
  | "active"
  | "grace" // canceled / past_due but still inside a paid period
  | "blocked-no-entitlement"
  | "blocked-expired"

export interface EntitlementResult {
  allowed: boolean
  phase: EntitlementPhase
  reason: EntitlementReason
}

// Parse `PAYWALL_START_AT`; fall back to the default if unset or invalid.
export function getPaywallStartAt(): Date {
  const raw = process.env.PAYWALL_START_AT
  if (raw) {
    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return new Date(DEFAULT_PAYWALL_START_AT)
}

// True on any deployed build (production AND preview deployments); false only
// during genuine local `next dev`. This gates the test-clock injection, so it
// must never be spoofable in production.
//
// We deliberately do NOT read `NEXT_PUBLIC_V0_PREVIEW`: that public flag is set
// (and currently malformed) in this project's PRODUCTION environment, so trusting
// it would let a bad env value flip production into "non-production" and expose
// the injectable clock. NODE_ENV is set by the framework and cannot be spoofed
// this way, so it is the only signal used here.
export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV !== "development"
}

// Minimal shape shared by NextRequest (middleware) and the Web `Request`
// (route handlers) so we can read an injected test clock from either.
interface ClockCarrier {
  headers: { get(name: string): string | null }
  url?: string
  nextUrl?: { searchParams: URLSearchParams }
}

// Trusted "now".
//   • Production: always the real server clock — injection is IGNORED.
//   • Non-production (dev / v0 preview / tests): allow an injected instant via
//     the `x-eqho-now` header or `?now=` query so we can exercise the changeover
//     boundary and each subscription state without waiting for real time.
export function getServerNow(req?: ClockCarrier): Date {
  if (!isProductionRuntime() && req) {
    const header = req.headers.get("x-eqho-now")
    let raw: string | null = header
    if (!raw) {
      try {
        const qp =
          req.nextUrl?.searchParams ??
          (req.url ? new URL(req.url).searchParams : undefined)
        raw = qp?.get("now") ?? null
      } catch {
        raw = null
      }
    }
    if (raw) {
      const injected = new Date(raw)
      if (!Number.isNaN(injected.getTime())) return injected
    }
  }
  return new Date()
}

export function isBeforePaywall(now: Date = new Date()): boolean {
  return now.getTime() < getPaywallStartAt().getTime()
}

// Is a stored ISO date still in the future relative to `now`? Used for the
// single cancellation / grace rule (access lasts until `current_period_end`).
function isFuture(dateStr: string | null | undefined, now: Date): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() > now.getTime()
}

export interface EvaluateArgs {
  now: Date
  // Only the two fields the decision needs. Both optional/nullable because a
  // freshly-created profile (free phase) legitimately has neither yet (Supabase
  // returns SQL NULLs), and the function reads them defensively.
  profile:
    | {
        subscription_status?: SubscriptionStatus | null
        current_period_end?: string | null
      }
    | null
  email?: string | null
}

// THE decision. Deterministic and side-effect free so it can be unit-tested
// with an injected clock.
export function evaluateEntitlement({
  now,
  profile,
  email,
}: EvaluateArgs): EntitlementResult {
  // 1. Admins always have access, in either phase.
  if (isAdminEmail(email)) {
    return { allowed: true, phase: isBeforePaywall(now) ? "free" : "paywall", reason: "admin" }
  }

  // 2. Before the changeover instant, the player is free for any logged-in user.
  if (isBeforePaywall(now)) {
    return { allowed: true, phase: "free", reason: "free-phase" }
  }

  // 3. Paywall phase — a real entitlement is required.
  const status: SubscriptionStatus | undefined = profile?.subscription_status ?? undefined

  if (status === "trialing") return { allowed: true, phase: "paywall", reason: "trialing" }
  if (status === "active") return { allowed: true, phase: "paywall", reason: "active" }

  // Single grace rule: a canceled or past-due subscription keeps access until
  // the end of the period the user already paid for. Never show "active" after
  // that instant — once the period end passes, access is fully blocked.
  if (
    (status === "canceled" || status === "past_due") &&
    isFuture(profile?.current_period_end, now)
  ) {
    return { allowed: true, phase: "paywall", reason: "grace" }
  }

  if (status === "canceled" || status === "past_due") {
    return { allowed: false, phase: "paywall", reason: "blocked-expired" }
  }

  return { allowed: false, phase: "paywall", reason: "blocked-no-entitlement" }
}
