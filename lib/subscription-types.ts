export type SubscriptionStatus = 
  | 'free' 
  | 'trialing' 
  | 'active' 
  | 'past_due' 
  | 'canceled'
  | 'incomplete'

// Profile with subscription fields (matches the canonical profiles table).
// The profiles table is keyed on `id` (= auth.users.id); there is no separate
// `user_id` column, and the Stripe subscription column is `stripe_subscription_id`.
export interface ProfileSubscription {
  id: string
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus
  stripe_subscription_id: string | null
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

export function getTrialDaysRemaining(trialEnd: string | null): number | null {
  if (!trialEnd) return null
  
  const trialEndDate = new Date(trialEnd)
  const now = new Date()
  const diffTime = trialEndDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

export function formatTrialEndDate(trialEnd: string | null): string | null {
  if (!trialEnd) return null
  
  const date = new Date(trialEnd)
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}
