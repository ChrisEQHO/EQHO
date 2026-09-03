// Canonical API transport for the app. This is the ONE place that knows how to
// reach the backend from BOTH build targets:
//
//   - Web:    same-origin requests. getApiBase() === '' so a path like
//             '/api/entitlement' stays '/api/entitlement' and the browser sends
//             the Supabase cookie session automatically.
//   - Mobile: the Capacitor build is a STATIC EXPORT with no /api routes and no
//             middleware (see scripts/prepare-mobile-build.js). A relative
//             '/api/...' fetch would resolve against capacitor://localhost /
//             http://localhost — the WebView's own origin — and return the SPA
//             index.html (text/html) or fail. So on mobile getApiBase() points at
//             the DEPLOYED HTTPS backend and we authenticate with the Supabase
//             access token as a Bearer header (cross-origin carries no cookies).
//
// Previously this logic lived only in lib/r2-storage.ts. It now lives here and
// r2-storage re-uses it, so there is exactly ONE implementation of the mobile
// API base + auth-header behaviour.

import { createClient } from '@/lib/supabase/client'

// Read the build target at call time (not module load) so tests and any runtime
// env changes are honoured.
function isMobileBuild(): boolean {
  return process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'
}

/**
 * The origin to prefix API paths with.
 *   Web    -> '' (same-origin; cookie session).
 *   Mobile -> NEXT_PUBLIC_API_BASE_URL, else the canonical production origin.
 * Any trailing slash is stripped so `${base}/api/x` never doubles the slash.
 */
export function getApiBase(): string {
  if (isMobileBuild()) {
    return (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.eqho-player.com').replace(/\/+$/, '')
  }
  return ''
}

/**
 * Authorization header derived from the current Supabase session.
 * Returns `{ Authorization: 'Bearer <token>' }` when a session exists, otherwise
 * an empty object. Harmless on web (the API route still prefers the cookie
 * session); required on mobile where there is no cookie. Never logs the token.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createClient()
    if (!supabase) return {}
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

/**
 * fetch() wrapper that is correct on both web and mobile.
 *   - Prepends getApiBase() to relative '/api/...' paths (absolute URLs are left
 *     untouched).
 *   - Attaches the Supabase Bearer token, WITHOUT overwriting an Authorization
 *     header the caller supplied explicitly.
 *   - Preserves all caller-supplied headers and RequestInit options, so GET,
 *     POST, PUT, DELETE, body, cache, signal, etc. all work.
 *   - Never logs the access token.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = /^https?:\/\//i.test(path) ? path : `${getApiBase()}${path}`

  // Merge headers: start from the caller's, then add auth headers only when the
  // caller did not already set that header (caller wins).
  const headers = new Headers(init.headers as HeadersInit | undefined)
  const authHeaders = await getAuthHeaders()
  for (const [key, value] of Object.entries(authHeaders)) {
    if (!headers.has(key)) headers.set(key, value)
  }

  return fetch(url, { ...init, headers })
}
