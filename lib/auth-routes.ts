// Pure auth-routing rules shared by the middleware and the auth pages, so the
// redirect behaviour can be unit-tested without a Next.js request.
// See lib/supabase/middleware.ts for why each public route is listed.
export const PUBLIC_ROUTE_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/auth/confirm',
  '/auth/error',
  '/pricing',
  '/features',
  '/how-it-works',
  '/who-its-for',
  '/faq',
  '/terms',
  '/store',
  '/music',
  '/subscription-success',
  '/subscription/success',
  '/complete-signup',
  '/upgrade',
  '/privacy-policy',
  '/robots.txt',
  '/sitemap.xml',
  '/api/webhooks',
  '/api/create-checkout-session',
  '/api/create-profile',
  '/api/entitlement',
  '/api/verify-checkout',
  '/api/r2',
  '/api/store',
  '/api/music',
] as const

export function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/api/demo' || pathname.startsWith('/api/demo/')) return true
  return PUBLIC_ROUTE_PREFIXES.some(route => pathname.startsWith(route))
}

/**
 * Accepts only single-slash internal paths so `?next=` can never be an open
 * redirect (`//evil.com`, `https://…`, `/\evil.com`).
 */
export function safeInternalPath(raw: string | null | undefined, fallback = '/app'): string {
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  if (raw.includes('://') || raw.includes('\\')) return fallback
  return raw
}

export type AuthRedirect =
  | { type: 'none' }
  | { type: 'redirect'; pathname: string; search: string }

/**
 * Decides the auth-only redirect for a request. Entitlement gating for /app is
 * handled separately by the middleware.
 *  - Logged out on a protected route -> /login?next=<original path+query>
 *  - Logged in on /login -> /app
 *  - /signup is never redirected, even for an authenticated user.
 */
export function resolveAuthRedirect(input: {
  pathname: string
  search: string
  hasUser: boolean
}): AuthRedirect {
  const { pathname, search, hasUser } = input
  if (!hasUser && !isPublicRoute(pathname)) {
    const params = new URLSearchParams({ next: pathname + search })
    return { type: 'redirect', pathname: '/login', search: `?${params.toString()}` }
  }
  if (hasUser && pathname === '/login') {
    return { type: 'redirect', pathname: '/app', search: '' }
  }
  return { type: 'none' }
}
