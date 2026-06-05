import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Use service role key for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[v0] Stripe webhook: checkout.session.completed received')
  
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const customerEmail = session.customer_details?.email || session.customer_email
  
  console.log('[v0] Stripe customer email:', customerEmail)
  console.log('[v0] Stripe customer ID:', customerId)
  console.log('[v0] Stripe subscription ID:', subscriptionId)

  if (!customerEmail) {
    console.error('[v0] No customer email in checkout session')
    return
  }

  // Fetch the subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  const trialStart = new Date()
  const trialEnd = subscription.trial_end 
    ? new Date(subscription.trial_end * 1000)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days default

  // Update data for the profile
  const updateData = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    subscription_status: mapStripeStatus(subscription.status),
    plan: 'pro',
    trial_start: trialStart.toISOString(),
    trial_end: trialEnd.toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  }

  console.log('[v0] Attempting to update profile by email:', customerEmail)

  // Match by EMAIL (case-insensitive) - this is the key fix
  const { data: existingProfile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .ilike('email', customerEmail)
    .single()

  if (existingProfile) {
    console.log('[v0] Found existing profile:', existingProfile.id)
    
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', existingProfile.id)

    if (updateError) {
      console.error('[v0] Error updating profile:', updateError)
      throw updateError
    }
    
    console.log('[v0] Profile updated successfully')
  } else {
    console.log('[v0] No profile found for email, will be created on signup')
    // Profile doesn't exist yet - user hasn't created account
    // The profile will be created when they complete signup
  }

  console.log(`[v0] Checkout completed for ${customerEmail}, status: ${subscription.status}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[v0] Stripe webhook: subscription updated')
  
  const customerId = subscription.customer as string

  // Get customer email from Stripe
  const customer = await stripe.customers.retrieve(customerId)
  const customerEmail = (customer as Stripe.Customer).email
  
  console.log('[v0] Subscription update for customer email:', customerEmail)

  const updateData = {
    stripe_subscription_id: subscription.id,
    subscription_status: mapStripeStatus(subscription.status),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_end: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString() 
      : null,
  }

  // Try to find by stripe_customer_id first
  let { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  // If not found, try by email
  if (!profile && customerEmail) {
    const { data: profileByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', customerEmail)
      .single()
    profile = profileByEmail
  }

  if (!profile) {
    console.log('[v0] No profile found for subscription update')
    return
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id)

  if (error) {
    console.error('[v0] Error updating subscription:', error)
    throw error
  }

  console.log(`[v0] Subscription updated for profile ${profile.id}: ${subscription.status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      subscription_id: null,
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error handling subscription deletion:', error)
    throw error
  }

  console.log(`Subscription canceled for customer ${customerId}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'past_due',
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }

  console.log(`Payment failed for customer ${customerId}`)
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
      return 'canceled'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    default:
      return 'free'
  }
}
