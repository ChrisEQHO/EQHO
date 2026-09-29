import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { debugNotFound, resolveDebugAccess } from '@/lib/debug-guard'

export const dynamic = 'force-dynamic'

// Admin-only in production. Reports the caller's OWN profile/Stripe linkage and
// safe configuration booleans. It never lists other profiles, customer emails,
// Stripe checkout sessions or metadata, and never returns secret values.
export async function GET() {
  const access = await resolveDebugAccess()
  if (!access.allowed) return debugNotFound()

  const envCheck = {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID,
  }

  if (!access.userId) {
    return NextResponse.json({ authenticated: false, env_check: envCheck })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, plan, stripe_customer_id, stripe_subscription_id, current_period_end')
      .eq('id', access.userId)
      .maybeSingle()

    const status = profile?.subscription_status ?? null

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      authenticated: true,
      env_check: envCheck,
      profile: {
        found: !!profile,
        subscription_status: status,
        plan: profile?.plan ?? null,
        has_stripe_customer: !!profile?.stripe_customer_id,
        has_stripe_subscription: !!profile?.stripe_subscription_id,
        current_period_end: profile?.current_period_end ?? null,
        error: error ? 'lookup_failed' : null,
      },
      access_allowed: status === 'active' || status === 'trialing',
    })
  } catch {
    return NextResponse.json({ error: 'Debug endpoint failed' }, { status: 500 })
  }
}
