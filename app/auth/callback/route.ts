import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Stripe Payment Link with 30-day free trial
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJefZbeVz4nu9s32RT3F602'

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
      
      console.log('[v0] Auth callback - User:', user?.id, user?.email)
      
      if (user) {
        // Check if user has a subscription in the profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_status, stripe_customer_id')
          .eq('user_id', user.id)
          .single()

        console.log('[v0] Auth callback - Profile query:', { profile, profileError })

        // User needs subscription if:
        // 1. No profile exists (profileError)
        // 2. Profile exists but subscription_status is null/undefined
        // 3. Profile exists but subscription_status is not active/trialing/past_due
        const hasActiveSubscription = profile?.subscription_status && 
          ['active', 'trialing', 'past_due'].includes(profile.subscription_status)
        
        console.log('[v0] Auth callback - Has active subscription:', hasActiveSubscription)
        
        if (!hasActiveSubscription) {
          console.log('[v0] Auth callback - Redirecting to Stripe for free trial')
          // Redirect to Stripe Payment Link with user info for the free trial
          const paymentUrl = new URL(STRIPE_PAYMENT_LINK)
          paymentUrl.searchParams.set('client_reference_id', user.id)
          paymentUrl.searchParams.set('prefilled_email', user.email || '')
          
          return NextResponse.redirect(paymentUrl.toString())
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
