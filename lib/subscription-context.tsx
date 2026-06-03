'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isPro as checkIsPro, type Subscription, type SubscriptionContextValue } from '@/lib/subscription-types'

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
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
        setSubscription(null)
        setIsLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', fetchError)
        setError('Failed to load subscription status')
      }

      if (data) {
        setSubscription(data as Subscription)
      } else {
        // Default to free if no subscription record
        setSubscription({
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
          setSubscription(null)
        }
      }
    )

    return () => {
      authSubscription.unsubscribe()
    }
  }, [fetchSubscription])

  const isPro = subscription ? checkIsPro(subscription.status) : false
  const isTrialing = subscription?.status === 'trialing'

  const value: SubscriptionContextValue = {
    subscription,
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
      subscription: null,
      isPro: false,
      isTrialing: false,
      isLoading: true,
      error: null,
      refetch: async () => {},
    }
  }
  
  return context
}
