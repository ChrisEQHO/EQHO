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
  // client_reference_id contains the Supabase user ID (passed from Payment Link)
  const userId = session.client_reference_id || session.metadata?.supabase_user_id
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!userId) {
    console.error('No user ID in checkout session (client_reference_id or metadata)')
    return
  }

  // Fetch the subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Update the profiles table with subscription data
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      subscription_id: subscriptionId,
      subscription_status: mapStripeStatus(subscription.status),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating profile after checkout:', error)
    throw error
  }

  console.log(`Subscription created for user ${userId}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find the user by customer ID in profiles table
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (fetchError || !profile) {
    // Try to get user ID from subscription metadata
    const userId = subscription.metadata?.supabase_user_id
    if (!userId) {
      console.error('Could not find user for subscription update')
      return
    }
    
    // Update by user_id instead
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_id: subscription.id,
        subscription_status: mapStripeStatus(subscription.status),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_end: subscription.trial_end 
          ? new Date(subscription.trial_end * 1000).toISOString() 
          : null,
      })
      .eq('user_id', userId)
      
    if (error) {
      console.error('Error updating subscription by user_id:', error)
      throw error
    }
    return
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_id: subscription.id,
      subscription_status: mapStripeStatus(subscription.status),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }

  console.log(`Subscription updated for customer ${customerId}: ${subscription.status}`)
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
