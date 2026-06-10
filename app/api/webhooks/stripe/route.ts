import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Use service role key for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// As of Stripe API version 2025-05-28.basil, `current_period_end` no longer
// lives on the top-level Subscription object — it moved to each subscription
// item (subscription.items.data[].current_period_end). Reading the old field
// returns undefined, and `new Date(undefined * 1000).toISOString()` throws a
// RangeError that crashes the webhook. This helper safely resolves the period
// end from the new location, with a fallback to a 14-day window.
function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date {
  const fromItem = subscription.items?.data?.[0]?.current_period_end
  // Fallback to a legacy/top-level value if present (older API versions)
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end
  const epochSeconds = fromItem ?? legacy
  if (typeof epochSeconds === 'number' && Number.isFinite(epochSeconds)) {
    return new Date(epochSeconds * 1000)
  }
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
}

export async function POST(request: NextRequest) {
  console.log('[WEBHOOK] ========== STRIPE WEBHOOK RECEIVED ==========')
  
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  console.log('[WEBHOOK] Has signature:', !!signature)
  console.log('[WEBHOOK] Has STRIPE_WEBHOOK_SECRET:', !!process.env.STRIPE_WEBHOOK_SECRET)
  console.log('[WEBHOOK] Body length:', body.length)

  if (!signature) {
    console.error('[WEBHOOK] ERROR: Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('[WEBHOOK] Signature verified successfully')
  } catch (err) {
    console.error('[WEBHOOK] ERROR: Signature verification failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[WEBHOOK] Event type:', event.type)
  console.log('[WEBHOOK] Event id:', event.id)
  console.log('[WEBHOOK] Event livemode:', event.livemode)
  console.log('[WEBHOOK] STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 7))

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
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`)
    }

    console.log('[WEBHOOK] Handler completed successfully')
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[WEBHOOK] ERROR: Handler failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[WEBHOOK] ========== CHECKOUT.SESSION.COMPLETED ==========')
  console.log('[WEBHOOK] WEBHOOK_RECEIVED: checkout.session.completed')
  console.log('[WEBHOOK] session.id:', session.id)
  console.log('[WEBHOOK] session.customer:', session.customer)
  console.log('[WEBHOOK] session.customer_email:', session.customer_email)
  console.log('[WEBHOOK] session.customer_details?.email:', session.customer_details?.email)
  console.log('[WEBHOOK] session.client_reference_id:', session.client_reference_id)
  console.log('[WEBHOOK] session.subscription:', session.subscription)
  console.log('[WEBHOOK] session.metadata:', JSON.stringify(session.metadata))
  
  // Get the Supabase user ID from client_reference_id
  const userId = session.client_reference_id || session.metadata?.supabase_user_id
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  
  // Retrieve full customer from Stripe for email
  let customerEmail = session.customer_details?.email || session.customer_email
  
  if (!customerEmail && customerId) {
    console.log('[WEBHOOK] Fetching customer from Stripe for email...')
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer && !customer.deleted) {
        customerEmail = (customer as Stripe.Customer).email || undefined
        console.log('[WEBHOOK] Got email from Stripe customer:', customerEmail)
      }
    } catch (err) {
      console.error('[WEBHOOK] Error fetching customer:', err)
    }
  }
  
  console.log('[WEBHOOK] Final values:')
  console.log('[WEBHOOK]   userId:', userId)
  console.log('[WEBHOOK]   customerId:', customerId)
  console.log('[WEBHOOK]   subscriptionId:', subscriptionId)
  console.log('[WEBHOOK]   customerEmail:', customerEmail)

  // Initialize subscription data with defaults
  let subscriptionStatus = 'trialing'
  let trialStart = new Date()
  let trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  let currentPeriodEnd = trialEnd

  // Try to fetch subscription details from Stripe (if subscription exists)
  if (subscriptionId) {
    console.log('[WEBHOOK] Fetching subscription from Stripe:', subscriptionId)
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      console.log('[WEBHOOK] Subscription details:')
      console.log('[WEBHOOK]   status:', subscription.status)
      console.log('[WEBHOOK]   trial_start:', subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : 'none')
      console.log('[WEBHOOK]   trial_end:', subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'none')
      console.log('[WEBHOOK]   current_period_end (resolved):', getCurrentPeriodEnd(subscription).toISOString())

      // Use actual subscription data
      subscriptionStatus = subscription.status
      trialStart = subscription.trial_start 
        ? new Date(subscription.trial_start * 1000)
        : new Date()
      trialEnd = subscription.trial_end 
        ? new Date(subscription.trial_end * 1000)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      // NOTE: current_period_end moved to subscription.items in API 2025-05-28.basil
      currentPeriodEnd = getCurrentPeriodEnd(subscription)
    } catch (subError) {
      console.log('[WEBHOOK] WARNING: Could not retrieve subscription:', subError instanceof Error ? subError.message : subError)
      console.log('[WEBHOOK] Using default trial values instead')
      // Continue with default values - don't throw
    }
  } else {
    console.log('[WEBHOOK] No subscription ID in checkout session, using default trial values')
  }

  // Profile data to upsert
  const profileData = {
    email: customerEmail?.toLowerCase(),
    plan: 'pro',
    subscription_status: subscriptionStatus,
    trial_active: subscriptionStatus === 'trialing',
    trial_start: trialStart.toISOString(),
    trial_end: trialEnd.toISOString(),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId || null,
    current_period_end: currentPeriodEnd.toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log('[WEBHOOK] Profile data to write:', JSON.stringify(profileData, null, 2))

  // Strategy: Try by userId first, then by email
  let profileUpdated = false
  
  // 1. If we have userId (client_reference_id), try to update/create by ID
  if (userId) {
    console.log('[WEBHOOK] Attempting to find profile by userId:', userId)
    
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    console.log('[WEBHOOK] Profile lookup by id result:', existingProfile, 'error:', fetchError?.message)

    if (existingProfile) {
      // UPDATE existing profile
      console.log('[WEBHOOK] Updating existing profile for user:', userId)
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()

      if (updateError) {
        console.error('[WEBHOOK] ERROR updating profile:', updateError.message, updateError.details, updateError.hint)
      } else {
        console.log('[WEBHOOK] SUCCESS: Profile updated:', JSON.stringify(updateData))
        profileUpdated = true
      }
    } else {
      // CREATE new profile with this userId
      console.log('[WEBHOOK] Creating new profile for user:', userId)
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
          full_name: '',
          created_at: new Date().toISOString(),
        })
        .select()

      if (insertError) {
        console.error('[WEBHOOK] ERROR creating profile:', insertError.message, insertError.details, insertError.hint)
      } else {
        console.log('[WEBHOOK] SUCCESS: Profile created:', JSON.stringify(insertData))
        profileUpdated = true
      }
    }
  }
  
  // 2. If no userId or update failed, try by email
  if (!profileUpdated && customerEmail) {
    console.log('[WEBHOOK] Attempting to find profile by email:', customerEmail)
    
    const { data: profileByEmail, error: emailFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .ilike('email', customerEmail)
      .single()

    console.log('[WEBHOOK] Profile lookup by email result:', profileByEmail, 'error:', emailFetchError?.message)

    if (profileByEmail) {
      // UPDATE existing profile by email
      console.log('[WEBHOOK] Updating profile found by email, id:', profileByEmail.id)
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(profileData)
        .eq('id', profileByEmail.id)
        .select()

      if (updateError) {
        console.error('[WEBHOOK] ERROR updating profile by email:', updateError.message)
      } else {
        console.log('[WEBHOOK] SUCCESS: Profile updated by email:', JSON.stringify(updateData))
        profileUpdated = true
      }
    } else {
      // CREATE new profile with generated ID
      console.log('[WEBHOOK] Creating new profile with email (no user id):', customerEmail)
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          ...profileData,
          full_name: '',
          created_at: new Date().toISOString(),
        })
        .select()

      if (insertError) {
        console.error('[WEBHOOK] ERROR creating profile by email:', insertError.message)
      } else {
        console.log('[WEBHOOK] SUCCESS: Profile created with email:', JSON.stringify(insertData))
        profileUpdated = true
      }
    }
  }

  if (!profileUpdated) {
    console.error('[WEBHOOK] FAILED: Could not update or create profile. No userId and no email available.')
  }

  // TEMP DEBUG: consolidated subscription-sync trace for a real user.
  console.log('[SUB-SYNC] ----- checkout.session.completed result -----')
  console.log('[SUB-SYNC] Stripe customer email:', customerEmail ?? 'null')
  console.log('[SUB-SYNC] client_reference_id:', session.client_reference_id ?? 'null')
  console.log('[SUB-SYNC] Supabase user ID (resolved):', userId ?? 'null')
  console.log('[SUB-SYNC] profile update succeeded:', profileUpdated)
  console.log('[SUB-SYNC] subscription_status written:', profileData.subscription_status)
  console.log('[SUB-SYNC] ----------------------------------------------')

  console.log('[WEBHOOK] ========== CHECKOUT HANDLER COMPLETE ==========')
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[WEBHOOK] ========== SUBSCRIPTION UPDATED ==========')
  console.log('[WEBHOOK] subscription.id:', subscription.id)
  console.log('[WEBHOOK] subscription.status:', subscription.status)
  console.log('[WEBHOOK] subscription.customer:', subscription.customer)
  
  const customerId = subscription.customer as string

  // Try to find profile by stripe_customer_id
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .single()

  console.log('[WEBHOOK] Profile lookup by stripe_customer_id:', profile, 'error:', fetchError?.message)

  if (!profile) {
    console.log('[WEBHOOK] No profile found for customer:', customerId)
    return
  }

  const trialEnd = subscription.trial_end 
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null

  // Mark the user as Pro whenever the subscription is trialing or active.
  const isProStatus = subscription.status === 'trialing' || subscription.status === 'active'

  const { data: updateData, error } = await supabaseAdmin
    .from('profiles')
    .update({
      plan: isProStatus ? 'pro' : 'none',
      subscription_status: subscription.status,
      trial_active: subscription.status === 'trialing',
      stripe_subscription_id: subscription.id,
      trial_end: trialEnd,
      current_period_end: getCurrentPeriodEnd(subscription).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
    .select()

  if (error) {
    console.error('[WEBHOOK] ERROR updating subscription:', error.message, error.details, error.hint)
    throw error
  }

  console.log('[WEBHOOK] SUCCESS: Subscription updated:', JSON.stringify(updateData))
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[WEBHOOK] ========== SUBSCRIPTION DELETED ==========')
  console.log('[WEBHOOK] subscription.id:', subscription.id)
  console.log('[WEBHOOK] subscription.customer:', subscription.customer)
  
  const customerId = subscription.customer as string

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      trial_active: false,
      plan: 'none',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
    .select()

  if (error) {
    console.error('[WEBHOOK] ERROR handling subscription deletion:', error.message)
    throw error
  }

  console.log('[WEBHOOK] SUCCESS: Subscription canceled:', JSON.stringify(data))
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[WEBHOOK] ========== PAYMENT FAILED ==========')
  console.log('[WEBHOOK] invoice.id:', invoice.id)
  console.log('[WEBHOOK] invoice.customer:', invoice.customer)
  
  const customerId = invoice.customer as string

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
    .select()

  if (error) {
    console.error('[WEBHOOK] ERROR handling payment failure:', error.message)
    throw error
  }
  
  console.log('[WEBHOOK] SUCCESS: Updated to past_due:', JSON.stringify(data))
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('[WEBHOOK] ========== PAYMENT SUCCEEDED ==========')
  console.log('[WEBHOOK] invoice.id:', invoice.id)
  console.log('[WEBHOOK] invoice.customer:', invoice.customer)
  console.log('[WEBHOOK] invoice.subscription:', invoice.subscription)
  
  const customerId = invoice.customer as string

  // Only update if this is for an active subscription
  if (invoice.subscription) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        trial_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId)
      .select()

    if (error) {
      console.error('[WEBHOOK] ERROR handling payment success:', error.message)
    } else {
      console.log('[WEBHOOK] SUCCESS: Updated to active:', JSON.stringify(data))
    }
  }
}
