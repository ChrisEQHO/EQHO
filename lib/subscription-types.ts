export type SubscriptionStatus = 
  | 'free' 
  | 'trialing' 
  | 'active' 
  | 'past_due' 
  | 'canceled'
  | 'incomplete'

// Profile with subscription fields (matches existing profiles table)
export interface ProfileSubscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus
  subscription_id: string | null
  trial_end: string | null
  current_period_end: string | null
}

export interface SubscriptionContextValue {
  profile: ProfileSubscription | null
  isPro: boolean
  isTrialing: boolean
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function isPro(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing'
}

export function getStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'Pro'
    case 'trialing':
      return 'Pro Trial'
    case 'past_due':
      return 'Payment Due'
    case 'canceled':
      return 'Canceled'
    case 'incomplete':
      return 'Incomplete'
    default:
      return 'Free'
  }
}
