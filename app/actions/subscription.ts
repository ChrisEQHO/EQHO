'use server'

import { stripe, PRO_PRICE_ID, SUBSCRIPTION_CONFIG } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type { Subscription } from '@/lib/subscription-types'

/**
 * Get the current user's subscription status from Supabase
 */
export async function getSubscription(): Promise<Subscription | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error)
    return null
  }

  // If no subscription exists, return a default free subscription
  if (!data) {
    return {
      id: '',
      user_id: user.id,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      status: 'free',
      price_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      trial_end: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  return data as Subscription
}

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()
  if (!supabase) {
    return { url: null, error: 'Supabase not configured' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { url: null, error: 'Not authenticated' }
  }

  try {
    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = existingSubscription?.stripe_customer_id

    // Create a new customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Store the customer ID
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          status: 'free',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: SUBSCRIPTION_CONFIG.trialDays,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: `${baseUrl}/billing?success=true`,
      cancel_url: `${baseUrl}/upgrade?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    return { url: session.url, error: null }
  } catch (err) {
    console.error('Error creating checkout session:', err)
    return { url: null, error: 'Failed to create checkout session' }
  }
}

/**
 * Create a Stripe Customer Portal session for subscription management
 */
export async function createCustomerPortalSession(): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()
  if (!supabase) {
    return { url: null, error: 'Supabase not configured' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { url: null, error: 'Not authenticated' }
  }

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return { url: null, error: 'No active subscription found' }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/billing`,
    })

    return { url: session.url, error: null }
  } catch (err) {
    console.error('Error creating portal session:', err)
    return { url: null, error: 'Failed to create portal session' }
  }
}

/**
 * Cancel the current subscription (at period end)
 */
export async function cancelSubscription(): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_subscription_id) {
      return { success: false, error: 'No active subscription found' }
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Update local record
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return { success: true, error: null }
  } catch (err) {
    console.error('Error canceling subscription:', err)
    return { success: false, error: 'Failed to cancel subscription' }
  }
}

/**
 * Resume a canceled subscription (before period ends)
 */
export async function resumeSubscription(): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_subscription_id) {
      return { success: false, error: 'No subscription found' }
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    // Update local record
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return { success: true, error: null }
  } catch (err) {
    console.error('Error resuming subscription:', err)
    return { success: false, error: 'Failed to resume subscription' }
  }
}
