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
    console.error('[v0] Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[v0] Webhook received:', event.type)

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

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      default:
        console.log(`[v0] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[v0] Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[v0] ========== CHECKOUT.SESSION.COMPLETED ==========')
  
  // Get the Supabase user ID from client_reference_id
  const userId = session.client_reference_id
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const customerEmail = session.customer_details?.email || session.customer_email
  
  console.log('[v0] client_reference_id (user_id):', userId)
  console.log('[v0] customer_id:', customerId)
  console.log('[v0] subscription_id:', subscriptionId)
  console.log('[v0] customer_email:', customerEmail)

  if (!userId) {
    console.error('[v0] No client_reference_id in checkout session!')
    return
  }

  // Fetch the subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  console.log('[v0] Subscription status:', subscription.status)
  console.log('[v0] Trial start:', subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : 'none')
  console.log('[v0] Trial end:', subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'none')

  // Calculate trial dates
  const trialStart = subscription.trial_start 
    ? new Date(subscription.trial_start * 1000)
    : new Date()
  const trialEnd = subscription.trial_end 
    ? new Date(subscription.trial_end * 1000)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  // Profile data to upsert
  const profileData = {
    email: customerEmail?.toLowerCase(),
    plan: 'pro',
    subscription_status: subscription.status, // 'trialing' or 'active'
    trial_active: subscription.status === 'trialing',
    trial_start: trialStart.toISOString(),
    trial_end: trialEnd.toISOString(),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log('[v0] Profile data to write:', profileData)

  // Check if profile exists for this user
  const { data: existingProfile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.log('[v0] Error checking for existing profile:', fetchError)
  }

  if (existingProfile) {
    // UPDATE existing profile
    console.log('[v0] Updating existing profile for user:', userId)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileData)
      .eq('id', userId)

    if (updateError) {
      console.error('[v0] Error updating profile:', updateError)
      throw updateError
    }
    console.log('[v0] Profile updated successfully')
  } else {
    // CREATE new profile
    console.log('[v0] Creating new profile for user:', userId)
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        ...profileData,
        full_name: '',
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('[v0] Error creating profile:', insertError)
      throw insertError
    }
    console.log('[v0] Profile created successfully')
  }

  console.log('[v0] ========== CHECKOUT COMPLETE ==========')
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[v0] Subscription updated:', subscription.id, 'Status:', subscription.status)
  
  const customerId = subscription.customer as string

  // Try to find profile by stripe_customer_id
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.log('[v0] No profile found for customer:', customerId)
    return
  }

  const trialEnd = subscription.trial_end 
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      trial_active: subscription.status === 'trialing',
      trial_end: trialEnd,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) {
    console.error('[v0] Error updating subscription:', error)
    throw error
  }

  console.log('[v0] Subscription updated for profile:', profile.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[v0] Subscription deleted:', subscription.id)
  
  const customerId = subscription.customer as string

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      trial_active: false,
      plan: 'none',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[v0] Error handling subscription deletion:', error)
    throw error
  }

  console.log('[v0] Subscription canceled for customer:', customerId)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[v0] Payment failed for invoice:', invoice.id)
  
  const customerId = invoice.customer as string

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[v0] Error handling payment failure:', error)
    throw error
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('[v0] Payment succeeded for invoice:', invoice.id)
  
  const customerId = invoice.customer as string

  // Only update if this is for an active subscription
  if (invoice.subscription) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        trial_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('[v0] Error handling payment success:', error)
    }
  }
}
