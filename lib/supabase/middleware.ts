import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
  const publicRoutes = ['/login', '/signup', '/auth/callback', '/auth/confirm', '/auth/error', '/pricing', '/subscription-success', '/subscription/success', '/complete-signup', '/upgrade']
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
    // Check subscription status for protected routes (player)
    if (pathname === '/') {
      // Try fetching profile by 'id' first, then 'user_id'
      let profile = null
      const { data: profileById } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      
      if (profileById) {
        profile = profileById
      } else {
        const { data: profileByUserId } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single()
        profile = profileByUserId
      }
      
      const hasActiveSubscription = profile?.subscription_status === 'active' || 
                                     profile?.subscription_status === 'trialing'
      
      // If no active subscription, redirect to upgrade page
      if (!hasActiveSubscription) {
        const url = request.nextUrl.clone()
        url.pathname = '/upgrade'
        return NextResponse.redirect(url)
      }
    }

    // If user is logged in and trying to access login/signup, check subscription
    if (pathname === '/login' || pathname === '/signup') {
      // Try fetching profile by 'id' first, then 'user_id'
      let profile = null
      const { data: profileById } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()
      
      if (profileById) {
        profile = profileById
      } else {
        const { data: profileByUserId } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single()
        profile = profileByUserId
      }
      
      const hasActiveSubscription = profile?.subscription_status === 'active' || 
                                     profile?.subscription_status === 'trialing'
      
      const url = request.nextUrl.clone()
      // Redirect to player if subscribed, upgrade if not
      url.pathname = hasActiveSubscription ? '/' : '/upgrade'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
