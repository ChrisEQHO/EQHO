import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// Admin client to bypass RLS
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const debugInfo: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      env_check: {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID || 'not set',
      },
    }

    // Get logged-in user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    debugInfo.auth = {
      logged_in: !!user,
      user_id: user?.id || null,
      user_email: user?.email || null,
      auth_error: authError?.message || null,
    }

    // Get profile for logged-in user
    if (user) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      debugInfo.profile_by_id = {
        found: !!profile,
        data: profile || null,
        error: profileError?.message || null,
      }

      // Also try by email
      if (user.email) {
        const { data: profileByEmail, error: emailError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .ilike('email', user.email)
          .single()

        debugInfo.profile_by_email = {
          found: !!profileByEmail,
          data: profileByEmail || null,
          error: emailError?.message || null,
        }
      }

      // Check access logic
      const profileData = debugInfo.profile_by_id?.data || debugInfo.profile_by_email?.data
      if (profileData && typeof profileData === 'object' && 'subscription_status' in profileData) {
        const status = (profileData as { subscription_status: string }).subscription_status
        debugInfo.access_allowed = status === 'active' || status === 'trialing'
      } else {
        debugInfo.access_allowed = false
      }
    }

    // Get latest Stripe checkout sessions
    try {
      const sessions = await stripe.checkout.sessions.list({ limit: 5 })
      debugInfo.latest_stripe_sessions = sessions.data.map(s => ({
        id: s.id,
        customer_email: s.customer_details?.email || s.customer_email,
        client_reference_id: s.client_reference_id,
        subscription: s.subscription,
        status: s.status,
        created: new Date(s.created * 1000).toISOString(),
        metadata: s.metadata,
      }))
    } catch (stripeError) {
      debugInfo.stripe_error = stripeError instanceof Error ? stripeError.message : 'Unknown error'
    }

    // Get all profiles (for debugging)
    const { data: allProfiles, error: allProfilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, plan, subscription_status, stripe_customer_id, created_at')
      .limit(10)

    debugInfo.all_profiles = {
      count: allProfiles?.length || 0,
      data: allProfiles || [],
      error: allProfilesError?.message || null,
    }

    // Check webhook endpoint configuration hint
    debugInfo.webhook_endpoint = {
      expected_url: 'https://www.eqho-player.com/api/webhooks/stripe',
      note: 'Verify this endpoint is configured in Stripe Dashboard > Developers > Webhooks',
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
