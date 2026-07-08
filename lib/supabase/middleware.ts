import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Login is REQUIRED (but the app is free - there is no subscription/trial check).
// Logged-out users hitting a protected route are redirected to /login; logged-in
// users are allowed through. Set to true only to fully disable auth gating.
const BYPASS_AUTH = false

export async function updateSession(request: NextRequest) {
  // TEMPORARY bypass: skip all auth/subscription gating entirely
  if (BYPASS_AUTH) {
    return NextResponse.next()
  }

  // V0 Preview bypass: skip auth entirely in development
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_V0_PREVIEW === "true"
  ) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/auth/callback', '/auth/confirm', '/auth/error', '/pricing', '/subscription-success', '/subscription/success', '/complete-signup', '/upgrade', '/privacy-policy', '/api/webhooks', '/api/create-checkout-session', '/api/create-profile', '/api/verify-checkout', '/api/check-email', '/api/debug', '/debug']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If Supabase is not configured, redirect protected routes to login
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not logged in and trying to access a protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, keep them out of the auth pages (send to the player).
  // Login alone grants access - there is no subscription/trial check.
  if (user) {
    if (pathname === '/login' || pathname === '/signup') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
