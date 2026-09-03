import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Lazy module-scope binding. The real client is created on first property
// access (at request time) rather than at module load, so `next build` never
// runs `createClient(...)` during "Collecting page data". All handlers below
// keep using `supabaseAdmin.from(...)` unchanged.
const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})

// Per-profile idempotency. Stripe retries deliver the same event id more than
// once and events can arrive out of order; we store the last handled event id on
// the profile and skip a re-delivery of that exact event. Returns true when the
// event has already been applied to this profile and should be ignored.
async function isDuplicateEvent(profileId: string, eventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('last_stripe_event_id')
    .eq('id', profileId)
    .maybeSingle()
  if (data?.last_stripe_event_id === eventId) {
    console.log('[WEBHOOK] Duplicate event, skipping:', eventId, 'for profile:', profileId)
    return true
  }
  return false
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
        await handleCheckoutCompleted(session, event.id)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription, event.id)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        await handleTrialWillEnd(subscription, event.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, event.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, event.id)
        break
      }

      // `invoice.paid` and the legacy `invoice.payment_succeeded` both mean a
      // successful charge — treat them identically (the recurring payment that
      // converts a trial into a paid, active subscription).
      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice, event.id)
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  console.log('[WEBHOOK] ========== CHECKOUT.SESSION.COMPLETED ==========')
  console.log('[WEBHOOK] WEBHOOK_RECEIVED: checkout.session.completed')
  console.log('[WEBHOOK] session.id:', session.id)

  // À-la-carte music-store purchases are one-off payments, not subscriptions.
  // Route them to the dedicated handler and skip the subscription/profile logic.
  if (session.mode === 'payment' || session.metadata?.kind === 'store_track_purchase') {
    await handleStorePurchaseCompleted(session)
    return
  }
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

  // Initialize subscription data with defaults.
  // Fallback trial length MUST be 30 days to match the checkout session's
  // trial_period_days and the "30-day free trial" wording used site-wide.
  // (Real values from Stripe override these below when available.)
  let subscriptionStatus = 'trialing'
  let trialStart = new Date()
  let trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
      console.log('[WEBHOOK]   current_period_end:', new Date(subscription.current_period_end * 1000).toISOString())

      // Use actual subscription data
      subscriptionStatus = subscription.status
      trialStart = subscription.trial_start 
        ? new Date(subscription.trial_start * 1000)
        : new Date()
      trialEnd = subscription.trial_end 
        ? new Date(subscription.trial_end * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      currentPeriodEnd = new Date(subscription.current_period_end * 1000)
    } catch (subError) {
      console.log('[WEBHOOK] WARNING: Could not retrieve subscription:', subError instanceof Error ? subError.message : subError)
      console.log('[WEBHOOK] Using default trial values instead')
      // Continue with default values - don't throw
    }
  } else {
    console.log('[WEBHOOK] No subscription ID in checkout session, using default trial values')
  }

  // Profile data to upsert. Once a subscription reaches trialing OR active the
  // user has consumed their one free trial, so `has_used_trial` latches true and
  // the checkout route will never grant another trial for this account.
  const profileData = {
    email: customerEmail?.toLowerCase(),
    plan: 'pro',
    subscription_status: subscriptionStatus,
    trial_active: subscriptionStatus === 'trialing',
    trial_start: trialStart.toISOString(),
    trial_end: trialEnd.toISOString(),
    has_used_trial: subscriptionStatus === 'trialing' || subscriptionStatus === 'active',
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId || null,
    current_period_end: currentPeriodEnd.toISOString(),
    cancel_at_period_end: false,
    last_stripe_event_id: eventId,
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

  console.log('[WEBHOOK] ========== CHECKOUT HANDLER COMPLETE ==========')
}

async function handleStorePurchaseCompleted(session: Stripe.Checkout.Session) {
  console.log('[WEBHOOK] ========== STORE PURCHASE COMPLETED ==========')
  const purchaseId = session.metadata?.purchase_id
  const userId = session.metadata?.supabase_user_id || session.client_reference_id
  const trackId = session.metadata?.track_id
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null
  const amountCents = session.amount_total ?? undefined

  console.log('[WEBHOOK] store purchase:', { purchaseId, userId, trackId, paymentIntentId, amountCents })

  if (!userId || !trackId) {
    console.error('[WEBHOOK] ERROR: store purchase missing userId/trackId; cannot grant.')
    return
  }

  // Only a paid session grants access. (payment_status is 'paid' for completed card payments.)
  if (session.payment_status && session.payment_status !== 'paid') {
    console.log('[WEBHOOK] store purchase not paid yet, payment_status:', session.payment_status)
    return
  }

  const completion = {
    status: 'completed' as const,
    stripe_payment_intent_id: paymentIntentId,
    stripe_checkout_session_id: session.id,
    ...(amountCents != null ? { amount_cents: amountCents } : {}),
    updated_at: new Date().toISOString(),
  }

  // Prefer updating the exact pending row we created; fall back to (user, track).
  let updatedOk = false
  if (purchaseId) {
    const { data, error } = await supabaseAdmin
      .from('store_purchases')
      .update(completion)
      .eq('id', purchaseId)
      .select('id')
    if (error) {
      console.error('[WEBHOOK] ERROR completing purchase by id:', error.message)
    } else if (data && data.length > 0) {
      updatedOk = true
      console.log('[WEBHOOK] SUCCESS: purchase completed by id:', purchaseId)
    }
  }

  if (!updatedOk) {
    // Fallback: complete the latest pending row for this user+track.
    const { data: pending } = await supabaseAdmin
      .from('store_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (pending?.id) {
      const { error } = await supabaseAdmin.from('store_purchases').update(completion).eq('id', pending.id)
      if (error) {
        // A unique-violation here means a completed row already exists → already granted.
        console.log('[WEBHOOK] purchase completion fallback note:', error.message)
      } else {
        console.log('[WEBHOOK] SUCCESS: purchase completed via fallback for user/track')
      }
    } else {
      // No pending row (e.g. row lost) — insert a completed grant directly so the
      // paying user is never left without access.
      const { error } = await supabaseAdmin.from('store_purchases').insert({
        user_id: userId,
        track_id: trackId,
        ...completion,
        amount_cents: amountCents ?? 0,
        currency: (session.currency || 'gbp').toLowerCase(),
      })
      if (error) {
        console.log('[WEBHOOK] purchase insert-grant note (may already exist):', error.message)
      } else {
        console.log('[WEBHOOK] SUCCESS: inserted completed grant for user/track')
      }
    }
  }

  console.log('[WEBHOOK] ========== STORE PURCHASE HANDLER COMPLETE ==========')
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, eventId: string) {
  console.log('[WEBHOOK] ========== SUBSCRIPTION UPDATED ==========')
  console.log('[WEBHOOK] subscription.id:', subscription.id)
  console.log('[WEBHOOK] subscription.status:', subscription.status)
  console.log('[WEBHOOK] subscription.customer:', subscription.customer)
  console.log('[WEBHOOK] cancel_at_period_end:', subscription.cancel_at_period_end)
  
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

  if (await isDuplicateEvent(profile.id, eventId)) return

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
      // Latch: reaching trialing/active means the free trial has been consumed.
      ...(isProStatus ? { has_used_trial: true } : {}),
      stripe_subscription_id: subscription.id,
      trial_end: trialEnd,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      // Surfaced on the billing screen so a user who cancelled sees when access
      // ends. The entitlement rule keeps them in until current_period_end.
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      last_stripe_event_id: eventId,
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

// Stripe fires this ~3 days before a trial ends. We don't change entitlement
// here (the trial is still valid); it's a hook point for a reminder and keeps
// the profile's event bookkeeping current. Kept intentionally side-effect light.
async function handleTrialWillEnd(subscription: Stripe.Subscription, eventId: string) {
  console.log('[WEBHOOK] ========== TRIAL WILL END ==========')
  console.log('[WEBHOOK] subscription.id:', subscription.id)
  console.log('[WEBHOOK] trial_end:', subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'none')

  const customerId = subscription.customer as string
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.log('[WEBHOOK] No profile found for customer:', customerId)
    return
  }

  if (await isDuplicateEvent(profile.id, eventId)) return

  await supabaseAdmin
    .from('profiles')
    .update({ last_stripe_event_id: eventId, updated_at: new Date().toISOString() })
    .eq('id', profile.id)

  console.log('[WEBHOOK] Trial-will-end recorded for profile:', profile.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, eventId: string) {
  console.log('[WEBHOOK] ========== SUBSCRIPTION DELETED ==========')
  console.log('[WEBHOOK] subscription.id:', subscription.id)
  console.log('[WEBHOOK] subscription.customer:', subscription.customer)
  
  const customerId = subscription.customer as string

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.log('[WEBHOOK] No profile found for customer:', customerId)
    return
  }

  if (await isDuplicateEvent(profile.id, eventId)) return

  // Mark canceled but PRESERVE current_period_end: the single grace rule in
  // lib/entitlement.ts keeps a canceled user in the player until the end of the
  // period they already paid for, then blocks them. Stripe still provides the
  // period end on the deleted subscription, so refresh it to stay precise.
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : undefined

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      trial_active: false,
      plan: 'none',
      ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
      last_stripe_event_id: eventId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
    .select()

  if (error) {
    console.error('[WEBHOOK] ERROR handling subscription deletion:', error.message)
    throw error
  }

  console.log('[WEBHOOK] SUCCESS: Subscription canceled (grace until period end):', JSON.stringify(data))
}

async function handlePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  console.log('[WEBHOOK] ========== PAYMENT FAILED ==========')
  console.log('[WEBHOOK] invoice.id:', invoice.id)
  console.log('[WEBHOOK] invoice.customer:', invoice.customer)
  
  const customerId = invoice.customer as string

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.log('[WEBHOOK] No profile found for customer:', customerId)
    return
  }

  if (await isDuplicateEvent(profile.id, eventId)) return

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      last_stripe_event_id: eventId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
    .select()

  if (error) {
    console.error('[WEBHOOK] ERROR handling payment failure:', error.message)
    throw error
  }
  
  console.log('[WEBHOOK] SUCCESS: Updated to past_due:', JSON.stringify(data))
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, eventId: string) {
  console.log('[WEBHOOK] ========== PAYMENT SUCCEEDED ==========')
  console.log('[WEBHOOK] invoice.id:', invoice.id)
  console.log('[WEBHOOK] invoice.customer:', invoice.customer)
  console.log('[WEBHOOK] invoice.subscription:', invoice.subscription)
  
  const customerId = invoice.customer as string

  // Only update if this is for an active subscription
  if (invoice.subscription) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!profile) {
      console.log('[WEBHOOK] No profile found for customer:', customerId)
      return
    }

    if (await isDuplicateEvent(profile.id, eventId)) return

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        trial_active: false,
        has_used_trial: true,
        cancel_at_period_end: false,
        last_stripe_event_id: eventId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()

    if (error) {
      console.error('[WEBHOOK] ERROR handling payment success:', error.message)
    } else {
      console.log('[WEBHOOK] SUCCESS: Updated to active:', JSON.stringify(data))
    }
  }
}
