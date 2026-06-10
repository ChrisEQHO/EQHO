'use client'

import Link from 'next/link'
import { Crown } from 'lucide-react'
import { useSubscription } from '@/lib/subscription-context'
import { getTrialDaysRemaining } from '@/lib/subscription-types'

interface ProBadgeProps {
  showLink?: boolean
  size?: 'sm' | 'md'
  showTrialDays?: boolean
}

export function ProBadge({ showLink = true, size = 'md', showTrialDays = false }: ProBadgeProps) {
  const { isPro, isTrialing, isLoading, profile } = useSubscription()
  
  const trialDaysLeft = profile?.trial_end ? getTrialDaysRemaining(profile.trial_end) : null

  if (isLoading) {
    return (
      <span 
        className={`inline-flex items-center gap-1 rounded-full animate-pulse ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <span className="w-8 h-3 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
      </span>
    )
  }

  // Show "Pro Trial" badge for trialing users - cyan/green glowing gradient
  if (isTrialing) {
    const badge = (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
        style={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
          color: 'white',
          boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
        }}
      >
        <Crown className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        EQHO Player Trial{showTrialDays && trialDaysLeft !== null ? ` (${trialDaysLeft}d)` : ''}
      </span>
    )

    if (showLink) {
      return (
        <Link href="/billing" className="hover:opacity-90 transition-opacity">
          {badge}
        </Link>
      )
    }

    return badge
  }

  // Show "Pro" badge for active paying users - EQHO pink/orange gradient
  if (isPro) {
    const badge = (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
        style={{
          background: 'linear-gradient(135deg, #ff4fa3 0%, #ff8a00 100%)',
          color: 'white',
          boxShadow: '0 0 12px rgba(255, 79, 163, 0.4)',
        }}
      >
        <Crown className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        EQHO Player
      </span>
    )

    if (showLink) {
      return (
        <Link href="/billing" className="hover:opacity-90 transition-opacity">
          {badge}
        </Link>
      )
    }

    return badge
  }

  // Fallback - should not happen since users without subscription are redirected
  // But show Pro Trial badge as default since all users start with trial
  const badge = (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
      style={{
        background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
        color: 'white',
        boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
      }}
    >
      <Crown className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      EQHO Player Trial
    </span>
  )

  if (showLink) {
    return (
      <Link href="/billing" className="hover:opacity-90 transition-opacity">
        {badge}
      </Link>
    )
  }

  return badge
}
