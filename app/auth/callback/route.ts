import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUserProfile } from '@/lib/ensure-user-profile'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

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
      // Get the user's session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Guarantee a profiles row exists for this user before checking access.
        await ensureUserProfile({
          userId: session.user.id,
          email: session.user.email,
          fullName: (session.user.user_metadata?.full_name as string | undefined) ?? '',
        })

        // Check if user has an active subscription
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single()
        
        const hasActiveSubscription = profile?.subscription_status === 'active' || 
                                       profile?.subscription_status === 'trialing'
        
        if (hasActiveSubscription) {
          // User has subscription, go to player (now at /app)
          return NextResponse.redirect(`${origin}/app`)
        } else {
          // User needs to subscribe, go to upgrade page
          return NextResponse.redirect(`${origin}/upgrade`)
        }
      }
      
      // Fallback to upgrade if no session (shouldn't happen)
      return NextResponse.redirect(`${origin}/upgrade`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
