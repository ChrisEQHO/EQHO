// Canonical origin resolution for auth redirect URLs (email confirmation,
// password reset, OAuth callbacks).
//
// Why this exists: signup previously used `window.location.origin` directly. If
// a visitor loaded the bare apex `https://eqho-player.com`, that origin was baked
// into the Supabase confirmation email as the redirect target. The apex then
// 307-redirects to `https://www.eqho-player.com`, and a cross-origin/redirected
// hop is exactly where the auth `code` (and PKCE cookie) can be lost — so the
// verification link "worked" but dropped the user back on a logged-out page.
//
// The production canonical origin is ALWAYS `https://www.eqho-player.com`, which
// is also the origin registered in Supabase's redirect allowlist. Sending every
// production/mobile auth redirect there keeps verification on one stable origin.

const CANONICAL_ORIGIN = 'https://www.eqho-player.com'

// Hosts where the *actual* current origin is the right redirect target (local
// dev and v0 preview). Anything else in the browser resolves to canonical www.
function isDevOrPreviewHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.vercel.run') ||
    hostname.endsWith('.v0.dev') ||
    hostname.endsWith('.v0.build') ||
    hostname.endsWith('.vusercontent.net')
  )
}

/**
 * Returns the origin that auth email links / callbacks should point back to.
 * - Server / build time: canonical production origin (never references `window`).
 * - Local dev + v0 preview: the live origin, so callbacks resolve on that host.
 * - Mobile (Capacitor) + bare apex + www + any production host: canonical www.
 */
export function getSiteOrigin(): string {
  if (typeof window === 'undefined') {
    return CANONICAL_ORIGIN
  }

  const { origin, hostname, protocol } = window.location

  if (isDevOrPreviewHost(hostname)) {
    return origin
  }

  // Capacitor WebView (capacitor://localhost) and the static mobile export have
  // no valid public origin — always use the canonical production site.
  if (protocol === 'capacitor:' || process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile') {
    return CANONICAL_ORIGIN
  }

  // Production web: normalise the bare apex (and anything unexpected) to www so
  // the verification link never has to survive an apex→www redirect hop.
  return CANONICAL_ORIGIN
}

export { CANONICAL_ORIGIN }
