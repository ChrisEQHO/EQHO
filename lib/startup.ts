// Shared startup / auth-routing primitives used by the player gate, login and
// the mobile entry. Kept framework-free so they are unit-testable.

export type AuthStatus = 'checking' | 'signed-in' | 'signed-out'

/**
 * The ONE place that turns raw auth bootstrap state into the three explicit
 * states. Redirect decisions must only ever be made from 'signed-in' or
 * 'signed-out' — never while 'checking'.
 */
export function resolveAuthStatus(authChecked: boolean, hasUser: boolean): AuthStatus {
  if (!authChecked) return 'checking'
  return hasUser ? 'signed-in' : 'signed-out'
}

export const STARTUP_TIMEOUT_SENTINEL = 'STARTUP_TIMEOUT'

/** Reject after `ms` so no startup await can hang the UI forever. */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(STARTUP_TIMEOUT_SENTINEL)), ms)
    }),
  ])
}

/**
 * Normalise an internal route for the current build target. The Capacitor build
 * is a static export with `trailingSlash: true` (login/index.html), so a hard
 * navigation to a bare '/login' can fall back to the root index.html — which
 * bounces to /app/ and, with no session, back to /login: a reload loop. Mobile
 * paths therefore always carry a trailing slash. Query strings are preserved.
 */
export function routeFor(path: string, isMobile: boolean): string {
  if (!isMobile) return path
  const [pathname, query] = path.split('?')
  const withSlash = pathname === '/' || pathname.endsWith('/') ? pathname : `${pathname}/`
  return query ? `${withSlash}?${query}` : withSlash
}

function samePath(a: string, b: string): boolean {
  const strip = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p)
  return strip(a.split('?')[0]) === strip(b.split('?')[0])
}

let navigationInFlight: string | null = null

/**
 * Hard-navigate at most once per page lifetime. Prevents the gate, auth events
 * and retry paths from stacking multiple location.replace() calls (each one a
 * full WebView reload on iPad). No-ops when already on the target path.
 */
export function navigateOnce(path: string, isMobile: boolean): boolean {
  if (typeof window === 'undefined') return false
  const target = routeFor(path, isMobile)
  if (navigationInFlight) return false
  if (samePath(window.location.pathname, target)) return false
  navigationInFlight = target
  window.location.replace(target)
  return true
}

/** Test-only reset of the module-level navigation guard. */
export function __resetNavigationGuard(): void {
  navigationInFlight = null
}

/**
 * Short, non-sensitive code the user can quote to support. Encodes the failure
 * kind and a timestamp only — never tokens, emails or user ids.
 */
export function makeReferenceCode(kind: string, now: Date = new Date()): string {
  const prefix = kind.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || 'ERR'
  const stamp = now.getTime().toString(36).toUpperCase().slice(-6)
  return `EQ-${prefix}-${stamp}`
}
