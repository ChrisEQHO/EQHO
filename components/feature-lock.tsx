'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { Lock, Crown } from 'lucide-react'
import { useSubscription } from '@/lib/subscription-context'
import { Button } from '@/components/ui/button'

interface FeatureLockProps {
  children: ReactNode
  feature?: string
  fallback?: ReactNode
}

/**
 * Wraps content that requires Pro subscription.
 * Shows children if user is Pro, otherwise shows a locked overlay.
 */
export function FeatureLock({ children, feature, fallback }: FeatureLockProps) {
  const { isPro, isLoading } = useSubscription()

  if (isLoading) {
    return <>{children}</>
  }

  if (isPro) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="relative">
      <div 
        className="pointer-events-none opacity-40 select-none blur-[1px]"
        aria-hidden="true"
      >
        {children}
      </div>
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'rgba(5, 8, 22, 0.85)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div 
          className="p-3 rounded-full mb-3"
          style={{
            background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
            boxShadow: '0 0 20px rgba(255, 79, 163, 0.3)',
          }}
        >
          <Lock className="h-5 w-5 text-white" />
        </div>
        <p 
          className="text-sm font-medium mb-1"
          style={{ color: 'var(--eqho-text-primary)' }}
        >
          Pro Feature
        </p>
        {feature && (
          <p 
            className="text-xs mb-3 text-center px-4"
            style={{ color: 'var(--eqho-text-muted)' }}
          >
            {feature}
          </p>
        )}
        <Link href="/upgrade">
          <Button
            size="sm"
            className="text-white border-0"
            style={{
              background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
            }}
          >
            <Crown className="h-3.5 w-3.5 mr-1" />
            Upgrade
          </Button>
        </Link>
      </div>
    </div>
  )
}

/**
 * Hook to check if a Pro feature should be accessible
 */
export function useProFeature() {
  const { isPro, isLoading } = useSubscription()
  
  return {
    canAccess: isPro,
    isLoading,
  }
}
