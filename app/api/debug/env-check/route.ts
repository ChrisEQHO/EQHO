import { NextResponse } from 'next/server'

export async function GET() {
  // Check all required environment variables for the Stripe subscription flow
  const checks = {
    // Stripe
    STRIPE_SECRET_KEY: {
      set: !!process.env.STRIPE_SECRET_KEY,
      mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 
            process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN',
    },
    STRIPE_WEBHOOK_SECRET: {
      set: !!process.env.STRIPE_WEBHOOK_SECRET,
      startsWithWhsec: process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') || false,
    },
    STRIPE_PRICE_ID: {
      set: !!process.env.STRIPE_PRICE_ID,
      startsWithPrice: process.env.STRIPE_PRICE_ID?.startsWith('price_') || false,
      value: process.env.STRIPE_PRICE_ID || 'NOT SET',
    },
    
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: {
      set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      note: 'Required for webhook to update profiles (bypasses RLS)',
    },
  }

  // Determine if all required vars are set
  const allSet = 
    checks.STRIPE_SECRET_KEY.set &&
    checks.STRIPE_WEBHOOK_SECRET.set &&
    checks.STRIPE_PRICE_ID.set &&
    checks.STRIPE_PRICE_ID.startsWithPrice &&
    checks.NEXT_PUBLIC_SUPABASE_URL.set &&
    checks.NEXT_PUBLIC_SUPABASE_ANON_KEY.set &&
    checks.SUPABASE_SERVICE_ROLE_KEY.set

  // Check for mode mismatch
  const stripeMode = checks.STRIPE_SECRET_KEY.mode
  const modeWarning = stripeMode === 'TEST' 
    ? 'Using TEST mode - make sure webhook secret is also from test mode'
    : stripeMode === 'LIVE'
    ? 'Using LIVE mode - make sure webhook secret is also from live mode'
    : 'Could not determine Stripe mode'

  return NextResponse.json({
    status: allSet ? 'OK' : 'MISSING_CONFIG',
    stripeMode,
    modeWarning,
    checks,
    requiredActions: [
      !checks.STRIPE_SECRET_KEY.set && 'Set STRIPE_SECRET_KEY (from Stripe Dashboard > Developers > API keys)',
      !checks.STRIPE_WEBHOOK_SECRET.set && 'Set STRIPE_WEBHOOK_SECRET (from Stripe Dashboard > Developers > Webhooks > your endpoint > Signing secret)',
      !checks.STRIPE_PRICE_ID.set && 'Set STRIPE_PRICE_ID (from Stripe Dashboard > Products > your product > Pricing > copy the price ID starting with price_)',
      !checks.STRIPE_PRICE_ID.startsWithPrice && checks.STRIPE_PRICE_ID.set && 'STRIPE_PRICE_ID must start with "price_"',
      !checks.SUPABASE_SERVICE_ROLE_KEY.set && 'Set SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard > Project Settings > API > service_role key)',
    ].filter(Boolean),
  })
}
