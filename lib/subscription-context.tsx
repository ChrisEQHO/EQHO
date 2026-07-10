'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isPro as checkIsPro, type ProfileSubscription, type SubscriptionContextValue, type SubscriptionStatus } from '@/lib/subscription-types'
import { isV0Preview } from '@/lib/utils/preview'

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    // In the v0 preview/dev there is no Supabase session, so seed a demo
    // trialing profile (30-day trial, ~23 days left) purely so the subscription
    // UI + countdown are visible. This never runs in production/mobile builds.
    if (isV0Preview) {
      const trialEnd = new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString()
      setProfile({
        id: 'v0-preview-user',
        stripe_customer_id: null,
        subscription_status: 'trialing',
        stripe_subscription_id: null,
        trial_end: trialEnd,
        current_period_end: trialEnd,
      })
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('[v0][SUB-FRONTEND] No authenticated user; returning free')
        setProfile(null)
        setIsLoading(false)
        return
      }

      console.log('[v0][SUB-FRONTEND] Supabase user ID (read key):', user.id, 'email:', user.email)

      // Ensure a profiles row exists for this user BEFORE reading subscription.
      // This guarantees auth users are always mirrored into public.profiles.
      // Safe + idempotent: never overwrites existing (paid) data.
      try {
        const ensureRes = await fetch('/api/ensure-profile', { method: 'POST' })
        const ensureJson = await ensureRes.json().catch(() => null)
        console.log('[v0][SUB-FRONTEND] ensure-profile result:', JSON.stringify(ensureJson))
      } catch (ensureErr) {
        console.error('[v0][SUB-FRONTEND] ensure-profile call failed:', ensureErr)
      }

      // Fetch from profiles table which has subscription fields.
      // profiles is keyed on `id` (= auth user id), not a separate user_id column.
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, stripe_customer_id, subscription_status, stripe_subscription_id, trial_end, current_period_end')
        .eq('id', user.id)
        .single()

      console.log('[v0][SUB-FRONTEND] Profile read by id result:', JSON.stringify(data), 'error:', fetchError?.code, fetchError?.message)

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile subscription:', fetchError)
        setError('Failed to load subscription status')
      }

      if (data) {
        const resolvedStatus = (data.subscription_status as SubscriptionStatus) || 'free'
        console.log('[v0][SUB-FRONTEND] subscription status returned to frontend:', resolvedStatus, '=> isPro:', resolvedStatus === 'active' || resolvedStatus === 'trialing')
        setProfile({
          ...data,
          subscription_status: resolvedStatus,
        })
      } else {
        console.log('[v0][SUB-FRONTEND] No profile row found for auth id', user.id, '=> defaulting to free (this is the upgrade-screen trigger)')
        // Default to free if no profile record (shouldn't happen normally)
        setProfile({
          id: user.id,
          stripe_customer_id: null,
          subscription_status: 'free',
          stripe_subscription_id: null,
          trial_end: null,
          current_period_end: null,
        })
      }
    } catch (err) {
      console.error('Error in subscription provider:', err)
      setError('Failed to load subscription')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()

    // Listen for auth state changes
    const supabase = createClient()
    if (!supabase) return

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchSubscription()
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [fetchSubscription])

  const isPro = profile ? checkIsPro(profile.subscription_status) : false
  const isTrialing = profile?.subscription_status === 'trialing'

  const value: SubscriptionContextValue = {
    profile,
    isPro,
    isTrialing,
    isLoading,
    error,
    refetch: fetchSubscription,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext)
  
  if (!context) {
    // Return a default value if used outside provider (for SSR or pages without provider)
    return {
      profile: null,
      isPro: false,
      isTrialing: false,
      isLoading: true,
      error: null,
      refetch: async () => {},
    }
  }
  
  return context
}
