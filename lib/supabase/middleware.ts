import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// TEMPORARY: Set to true to allow direct access to the player without
// login, signup, or Stripe subscription checks. Set back to false to
// re-enable the full auth + subscription gating.
const BYPASS_AUTH = true

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

  // If user is logged in
  if (user) {
    console.log('[v0] Middleware: User logged in:', user.email, 'id:', user.id)
    
    // Check subscription status for protected routes (player)
    if (pathname === '/') {
      // Try fetching profile by 'id' first, then by email as fallback
      let profile = null
      let profileError = null
      
      const { data: profileById, error: err1 } = await supabase
        .from('profiles')
        .select('subscription_status, plan, email')
        .eq('id', user.id)
        .single()
      
      if (profileById) {
        profile = profileById
        console.log('[v0] Middleware: Profile found by id:', JSON.stringify(profile))
      } else {
        profileError = err1
        console.log('[v0] Middleware: No profile by id, error:', err1?.message)
        
        if (user.email) {
          // Try by email as fallback
          const { data: profileByEmail, error: err2 } = await supabase
            .from('profiles')
            .select('subscription_status, plan, email')
            .ilike('email', user.email)
            .single()
          
          if (profileByEmail) {
            profile = profileByEmail
            console.log('[v0] Middleware: Profile found by email:', JSON.stringify(profile))
          } else {
            console.log('[v0] Middleware: No profile by email, error:', err2?.message)
          }
        }
      }
      
      if (!profile) {
        console.log('[v0] Middleware: No profile found for user, redirecting to upgrade')
        const url = request.nextUrl.clone()
        url.pathname = '/upgrade'
        return NextResponse.redirect(url)
      }
      
      // Allow access if subscription_status is 'active' OR 'trialing'
      // Remove plan check - just check subscription status
      const hasActiveSubscription = profile.subscription_status === 'active' || 
                                    profile.subscription_status === 'trialing'
      
      console.log('[v0] Middleware: subscription_status:', profile.subscription_status, 'hasActiveSubscription:', hasActiveSubscription)
      
      // If no active subscription, redirect to upgrade page
      if (!hasActiveSubscription) {
        const url = request.nextUrl.clone()
        url.pathname = '/upgrade'
        return NextResponse.redirect(url)
      }
    }

    // If user is logged in and trying to access login/signup, check subscription
    if (pathname === '/login' || pathname === '/signup') {
      let profile = null
      const { data: profileById } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      
      if (profileById) {
        profile = profileById
      } else if (user.email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('subscription_status')
          .ilike('email', user.email)
          .single()
        profile = profileByEmail
      }
      
      const hasActiveSubscription = profile?.subscription_status === 'active' || 
                                    profile?.subscription_status === 'trialing'
      
      const url = request.nextUrl.clone()
      url.pathname = hasActiveSubscription ? '/' : '/upgrade'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
