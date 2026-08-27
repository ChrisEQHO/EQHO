import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRO_PRICE_ID } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to start a subscription' },
        { status: 401 }
      )
    }

    console.log('[v0] Creating checkout session for user:', user.id, user.email)

    // Get or create Stripe customer
    let customerId: string | undefined

    // Check if user already has a stripe_customer_id AND whether they've already
    // consumed their one free trial. `has_used_trial` drives the anti-repeat rule
    // below so a user can't cancel and re-subscribe to get another free month.
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, has_used_trial')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
      console.log('[v0] Found existing Stripe customer:', customerId)
    }

    const hasUsedTrial = profile?.has_used_trial === true
    console.log('[v0] has_used_trial:', hasUsedTrial)

    // Determine the base URL for redirects
    const origin = request.headers.get('origin') || 'https://www.eqho-player.com'
    
    // Use the annual price ID from environment
    const priceId = process.env.STRIPE_PRICE_ID || PRO_PRICE_ID
    
    console.log('[v0] Environment check:')
    console.log('[v0]   STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID ? 'SET' : 'NOT SET')
    console.log('[v0]   PRO_PRICE_ID fallback:', PRO_PRICE_ID || 'EMPTY')
    console.log('[v0]   Using price ID:', priceId)
    console.log('[v0]   STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 7))
    
    if (!priceId || !priceId.startsWith('price_')) {
      console.error('[v0] ERROR: Invalid or missing STRIPE_PRICE_ID')
      return NextResponse.json(
        { error: 'Stripe price not configured. Please set STRIPE_PRICE_ID in environment variables.' },
        { status: 500 }
      )
    }

    // Validate the secret key exists
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      console.error('[v0] ERROR: STRIPE_SECRET_KEY is not set')
      return NextResponse.json(
        { error: 'Stripe secret key not configured. Please set STRIPE_SECRET_KEY in environment variables.' },
        { status: 500 }
      )
    }

    // Detect test/live mode mismatch between the secret key and the price ID
    const keyMode = secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_') ? 'live'
      : secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_') ? 'test'
      : 'unknown'
    console.log('[v0]   Secret key mode:', keyMode)

    // Pre-flight: verify the price actually exists in this account/mode before creating the session.
    // This turns the vague "Failed to create checkout session" into a precise message.
    try {
      const price = await stripe.prices.retrieve(priceId)
      console.log('[v0]   Price retrieved OK:', price.id, 'livemode:', price.livemode, 'active:', price.active)
      if (price.livemode && keyMode === 'test') {
        return NextResponse.json(
          { error: `Mode mismatch: STRIPE_PRICE_ID (${priceId}) is a LIVE price but STRIPE_SECRET_KEY is in TEST mode. Use matching keys.` },
          { status: 500 }
        )
      }
      if (!price.livemode && keyMode === 'live') {
        return NextResponse.json(
          { error: `Mode mismatch: STRIPE_PRICE_ID (${priceId}) is a TEST price but STRIPE_SECRET_KEY is in LIVE mode. Use matching keys.` },
          { status: 500 }
        )
      }
      if (!price.active) {
        return NextResponse.json(
          { error: `The Stripe price ${priceId} exists but is not active. Activate it in the Stripe dashboard.` },
          { status: 500 }
        )
      }
    } catch (priceError) {
      const stripeErr = priceError as { type?: string; code?: string; statusCode?: number; message?: string }
      console.error('[v0] ERROR retrieving price:', {
        type: stripeErr.type,
        code: stripeErr.code,
        statusCode: stripeErr.statusCode,
        message: stripeErr.message,
      })
      return NextResponse.json(
        {
          error: `Stripe could not find price "${priceId}" with the current secret key (${keyMode} mode). It may not belong to this account or mode. Stripe says: ${stripeErr.message || 'unknown error'}`,
        },
        { status: 500 }
      )
    }
    
    // Only first-time subscribers get the 30-day free trial. A returning user
    // who already used theirs subscribes at the normal price with an immediate
    // charge — this prevents cancel/re-subscribe trial farming.
    const subscriptionData: {
      trial_period_days?: number
      metadata: Record<string, string>
    } = {
      metadata: { supabase_user_id: user.id },
    }
    if (!hasUsedTrial) {
      // 30-day free trial — MUST match the "30-day free trial" wording used
      // across the marketing site, pricing page, signup and FAQ.
      subscriptionData.trial_period_days = 30
    }

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      // Require the customer to enter card details now, even during the trial.
      // They will not be charged until the 30-day trial ends.
      payment_method_collection: 'always',
      customer: customerId,
      customer_email: customerId ? undefined : user.email || undefined,
      client_reference_id: user.id, // This links the session to the Supabase user
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData,
      success_url: `${origin}/complete-signup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    console.log('[v0] Created checkout session:', session.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const stripeErr = error as {
      type?: string
      code?: string
      statusCode?: number
      message?: string
      param?: string
      raw?: { message?: string }
    }
    console.error('[v0] Error creating checkout session:', {
      type: stripeErr.type,
      code: stripeErr.code,
      statusCode: stripeErr.statusCode,
      param: stripeErr.param,
      message: stripeErr.message,
      raw: stripeErr.raw?.message,
    })

    // Surface the precise Stripe error message to the client so it can be shown on the upgrade page.
    const detail = stripeErr.message || stripeErr.raw?.message || 'Unknown error'
    return NextResponse.json(
      {
        error: `Failed to create checkout session: ${detail}`,
        stripeType: stripeErr.type || null,
        stripeCode: stripeErr.code || null,
        statusCode: stripeErr.statusCode || null,
      },
      { status: 500 }
    )
  }
}
