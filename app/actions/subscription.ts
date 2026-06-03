'use server'

import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type { ProfileSubscription, SubscriptionStatus } from '@/lib/subscription-types'

/**
 * Get the current user's subscription status from profiles table
 */
export async function getSubscription(): Promise<ProfileSubscription | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, stripe_customer_id, subscription_status, subscription_id, trial_end, current_period_end')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile subscription:', error)
    return null
  }

  // If no profile exists, return a default free subscription
  if (!data) {
    return {
      id: '',
      user_id: user.id,
      stripe_customer_id: null,
      subscription_status: 'free',
      subscription_id: null,
      trial_end: null,
      current_period_end: null,
    }
  }

  return {
    ...data,
    subscription_status: (data.subscription_status as SubscriptionStatus) || 'free',
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return { url: null, error: 'No active subscription found' }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.subscription_id) {
      return { success: false, error: 'No active subscription found' }
    }

    await stripe.subscriptions.update(profile.subscription_id, {
      cancel_at_period_end: true,
    })

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.subscription_id) {
      return { success: false, error: 'No subscription found' }
    }

    await stripe.subscriptions.update(profile.subscription_id, {
      cancel_at_period_end: false,
    })

    return { success: true, error: null }
  } catch (err) {
    console.error('Error resuming subscription:', err)
    return { success: false, error: 'Failed to resume subscription' }
  }
}
