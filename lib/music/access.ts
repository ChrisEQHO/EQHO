// EQHO Music — access control for the hidden Phase-1 prototype.
//
// EQHO Music lives under /music and MUST stay invisible to the public until it
// is intentionally launched. Secrecy is enforced in two layers:
//
//   1. proxy.ts / lib/supabase/middleware.ts lists '/music' as a "public" route
//      ONLY so the auth middleware does not 307-redirect it to /login (which
//      would leak its existence by behaving differently from a 404).
//   2. app/music/layout.tsx (a server component) calls the checks below and
//      renders a real notFound() (HTTP 404) for anyone who is not allowed —
//      so to the public the whole area is indistinguishable from a route that
//      does not exist.
//
// This module is the single source of truth for "who may see EQHO Music".

import { isAdminEmail } from "@/lib/access"

// True during genuine local development or inside the v0 preview sandbox, where
// there is normally no real Supabase session but we still want to review the UI.
//
// SECURITY: we only trust NEXT_PUBLIC_V0_PREVIEW to OPEN the prototype when we
// are NOT in a production Node runtime. On the deployed site NODE_ENV is
// 'production', so this returns false there regardless of the public flag, and
// access falls through to the allowlist check below.
export function isMusicPreviewOpen(): boolean {
  if (process.env.NODE_ENV !== "production") return true
  return false
}

function parseEmails(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

// Emails explicitly allowed into EQHO Music in production. Comma-separated.
// Set EQHO_MUSIC_ALLOWED_EMAILS (server) and/or NEXT_PUBLIC_EQHO_MUSIC_ALLOWED_EMAILS.
export function getMusicAllowedEmails(): string[] {
  return Array.from(
    new Set([
      ...parseEmails(process.env.EQHO_MUSIC_ALLOWED_EMAILS),
      ...parseEmails(process.env.NEXT_PUBLIC_EQHO_MUSIC_ALLOWED_EMAILS),
    ]),
  )
}

// An email may see EQHO Music if it is on the dedicated Music allowlist OR is an
// existing EQHO site admin (they can always see in-development areas).
export function isMusicAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const lower = email.toLowerCase()
  if (getMusicAllowedEmails().includes(lower)) return true
  return isAdminEmail(email)
}

// The composite decision used by the layout gate and the API routes.
export function canAccessMusic(email: string | null | undefined): boolean {
  if (isMusicPreviewOpen()) return true
  return isMusicAllowedEmail(email)
}
