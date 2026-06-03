export type SubscriptionStatus = 
  | 'free' 
  | 'trialing' 
  | 'active' 
  | 'past_due' 
  | 'canceled'
  | 'incomplete'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: SubscriptionStatus
  price_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_end: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionContextValue {
  subscription: Subscription | null
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
