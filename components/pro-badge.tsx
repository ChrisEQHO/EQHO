'use client'

import Link from 'next/link'
import { Crown } from 'lucide-react'
import { useSubscription } from '@/lib/subscription-context'

interface ProBadgeProps {
  showLink?: boolean
  size?: 'sm' | 'md'
}

export function ProBadge({ showLink = true, size = 'md' }: ProBadgeProps) {
  const { isPro, isTrialing, isLoading } = useSubscription()

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

  if (isPro) {
    const badge = (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
        style={{
          background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
          color: 'white',
          boxShadow: '0 0 12px rgba(255, 79, 163, 0.3)',
        }}
      >
        <Crown className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        {isTrialing ? 'Pro Trial' : 'Pro'}
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

  // Free badge
  const badge = (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: 'var(--eqho-text-muted)',
        border: '1px solid var(--eqho-border)',
      }}
    >
      Free
    </span>
  )

  if (showLink) {
    return (
      <Link href="/upgrade" className="hover:opacity-80 transition-opacity">
        {badge}
      </Link>
    )
  }

  return badge
}

export function UpgradePrompt({ className = '' }: { className?: string }) {
  const { isPro } = useSubscription()

  if (isPro) return null

  return (
    <Link 
      href="/upgrade"
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${className}`}
      style={{
        backgroundColor: 'rgba(255, 79, 163, 0.1)',
        border: '1px solid rgba(255, 79, 163, 0.2)',
      }}
    >
      <Crown className="h-4 w-4" style={{ color: 'var(--eqho-pink)' }} />
      <span 
        className="text-sm font-medium group-hover:underline"
        style={{ color: 'var(--eqho-pink)' }}
      >
        Upgrade to Pro
      </span>
    </Link>
  )
}
