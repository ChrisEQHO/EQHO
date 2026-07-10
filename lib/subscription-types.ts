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
      return 'EQHO Player'
    case 'trialing':
      return 'EQHO Player Trial'
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

// Length of the free trial in days. Everyone who signs up gets this trial,
// which then auto-renews into the paid plan (there is no permanent free tier).
export const TRIAL_LENGTH_DAYS = 30

// Public launch date. Paid subscriptions become available on this date and the
// current free version ends on the same date. Until then, no sign-up is offered.
export const SUBSCRIPTION_LAUNCH_LABEL = '1 September 2026'

// A user only counts as actually subscribed when Stripe reports an active
// subscription AND we have a Stripe subscription id on file. `trialing` and any
// other status must NOT be treated as an active paid subscription.
export function hasActiveSubscription(
  profile: { subscription_status: SubscriptionStatus; stripe_subscription_id: string | null } | null,
): boolean {
  if (!profile) return false
  return profile.subscription_status === 'active' && !!profile.stripe_subscription_id
}

export function getTrialDaysRemaining(trialEnd: string | null): number | null {
  if (!trialEnd) return null
  
  const trialEndDate = new Date(trialEnd)
  const now = new Date()
  const diffTime = trialEndDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

// Generic "days left until this date" — used for the paid renewal countdown
// (current_period_end) as well as the trial countdown (trial_end).
export function getDaysUntil(dateStr: string | null): number | null {
  return getTrialDaysRemaining(dateStr)
}

// Resolve the single date the countdown should track for a profile:
// during the trial it's trial_end; once paying it's the current period end.
export function getCountdownTarget(
  profile: { subscription_status: SubscriptionStatus; trial_end: string | null; current_period_end: string | null } | null,
): string | null {
  if (!profile) return null
  if (profile.subscription_status === 'trialing') return profile.trial_end ?? profile.current_period_end
  return profile.current_period_end ?? profile.trial_end
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
