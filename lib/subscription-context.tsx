'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isPro as checkIsPro, type ProfileSubscription, type SubscriptionContextValue, type SubscriptionStatus } from '@/lib/subscription-types'

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setProfile(null)
        setIsLoading(false)
        return
      }

      // Fetch from profiles table which has subscription fields
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, user_id, stripe_customer_id, subscription_status, subscription_id, trial_end, current_period_end')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile subscription:', fetchError)
        setError('Failed to load subscription status')
      }

      if (data) {
        setProfile({
          ...data,
          subscription_status: (data.subscription_status as SubscriptionStatus) || 'free',
        })
      } else {
        // Default to free if no profile record (shouldn't happen normally)
        setProfile({
          id: '',
          user_id: user.id,
          stripe_customer_id: null,
          subscription_status: 'free',
          subscription_id: null,
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
