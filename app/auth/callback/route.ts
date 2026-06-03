import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (code && supabaseUrl && supabaseAnonKey) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore cookie setting errors in route handlers
          }
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Get the user to check subscription status
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user has a subscription in the profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single()

        // User needs subscription if no active/trialing status
        const hasActiveSubscription = profile?.subscription_status && 
          ['active', 'trialing'].includes(profile.subscription_status)
        
        if (!hasActiveSubscription) {
          // Redirect to trial page to start free trial
          return NextResponse.redirect(`${origin}/trial`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
