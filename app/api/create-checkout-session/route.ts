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

    // Check if user already has a stripe_customer_id in their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
      console.log('[v0] Found existing Stripe customer:', customerId)
    }

    // Determine the base URL for redirects
    const origin = request.headers.get('origin') || 'https://www.eqho-player.com'
    
    // Use the annual price ID from environment or fallback
    const priceId = process.env.STRIPE_PRICE_ID || PRO_PRICE_ID
    console.log('[v0] Using price ID:', priceId)
    
    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      customer_email: customerId ? undefined : user.email || undefined,
      client_reference_id: user.id, // This links the session to the Supabase user
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: `${origin}/complete-signup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    console.log('[v0] Created checkout session:', session.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[v0] Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
