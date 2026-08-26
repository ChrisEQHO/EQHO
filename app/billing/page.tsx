'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  getSubscription, 
  createCustomerPortalSession,
  cancelSubscription,
  resumeSubscription 
} from '@/app/actions/subscription'
import { isPro, getStatusLabel, type ProfileSubscription } from '@/lib/subscription-types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function BillingContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  
  const [profile, setProfile] = useState<ProfileSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCancelPending, setIsCancelPending] = useState(false)

  useEffect(() => {
    async function loadSubscription() {
      const data = await getSubscription()
      setProfile(data)
      setIsLoading(false)
      
      // Check cancel status from Stripe if we have a subscription
      if (data?.stripe_subscription_id) {
        // We'll track this client-side for now
        // The webhook will update the DB when subscription changes
      }
    }
    loadSubscription()
  }, [])

  const handleManageBilling = async () => {
    setActionLoading('portal')
    setError(null)
    
    const result = await createCustomerPortalSession()
    
    if (result.error) {
      setError(result.error)
      setActionLoading(null)
      return
    }

    if (result.url) {
      window.location.href = result.url
    }
  }

  const handleCancel = async () => {
    setActionLoading('cancel')
    setError(null)
    
    const result = await cancelSubscription()
    
    if (result.error) {
      setError(result.error)
    } else {
      setIsCancelPending(true)
      // Refresh subscription data
      const data = await getSubscription()
      setProfile(data)
    }
    
    setActionLoading(null)
  }

  const handleResume = async () => {
    setActionLoading('resume')
    setError(null)
    
    const result = await resumeSubscription()
    
    if (result.error) {
      setError(result.error)
    } else {
      setIsCancelPending(false)
      // Refresh subscription data
      const data = await getSubscription()
      setProfile(data)
    }
    
    setActionLoading(null)
  }

  const isUserPro = profile ? isPro(profile.subscription_status) : false

  return (
    <>
      {/* Success message */}
      {success && (
        <div 
          className="mb-8 p-4 rounded-lg border flex items-center gap-3"
          style={{ 
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderColor: 'var(--eqho-cyan)',
          }}
        >
          <CheckCircle className="h-5 w-5" style={{ color: 'var(--eqho-cyan)' }} />
          <span style={{ color: 'var(--eqho-cyan)' }}>
            Welcome to EQHO Player! Your subscription is now active.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--eqho-pink)' }} />
        </div>
      ) : (
        <>
          {/* Current Plan Card */}
          <div 
            className="rounded-2xl p-6 mb-6"
            style={{
              backgroundColor: 'var(--eqho-bg-card)',
              boxShadow: 'var(--eqho-card-shadow)',
              border: '1px solid var(--eqho-border)',
            }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: 'var(--eqho-text-muted)' }}
                >
                  Current Plan
                </p>
                <div className="flex items-center gap-3">
                  <h2 
                    className="text-2xl font-bold"
                    style={{ color: 'var(--eqho-text-primary)' }}
                  >
                    {isUserPro ? 'EQHO Player' : 'EQHO Player Free'}
                  </h2>
                  <StatusBadge status={profile?.subscription_status || 'free'} />
                </div>
              </div>
              
              {!isUserPro && (
                <Link href="/upgrade">
                  <Button
                    className="text-white border-0"
                    style={{
                      background: 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)',
                    }}
                  >
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>

            {isUserPro && profile && (
              <div className="space-y-4">
                {/* Pricing info */}
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                >
                  <CreditCard className="h-5 w-5" style={{ color: 'var(--eqho-pink)' }} />
                  <div>
                    <p style={{ color: 'var(--eqho-text-primary)' }}>£4.99/month</p>
                    {isCancelPending && (
                      <p 
                        className="text-sm"
                        style={{ color: 'var(--eqho-orange)' }}
                      >
                        Cancels at end of billing period
                      </p>
                    )}
                  </div>
                </div>

                {/* Trial info */}
                {profile.subscription_status === 'trialing' && profile.trial_end && (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <Calendar className="h-5 w-5" style={{ color: 'var(--eqho-cyan)' }} />
                    <div>
                      <p style={{ color: 'var(--eqho-text-primary)' }}>Free Trial</p>
                      <p 
                        className="text-sm"
                        style={{ color: 'var(--eqho-text-secondary)' }}
                      >
                        Ends {format(new Date(profile.trial_end), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Next billing date */}
                {profile.current_period_end && !isCancelPending && (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <Calendar className="h-5 w-5" style={{ color: 'var(--eqho-text-muted)' }} />
                    <div>
                      <p style={{ color: 'var(--eqho-text-primary)' }}>Next billing date</p>
                      <p 
                        className="text-sm"
                        style={{ color: 'var(--eqho-text-secondary)' }}
                      >
                        {format(new Date(profile.current_period_end), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Access ends date (for canceled subscriptions) */}
                {isCancelPending && profile.current_period_end && (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(255, 138, 0, 0.1)' }}
                  >
                    <AlertCircle className="h-5 w-5" style={{ color: 'var(--eqho-orange)' }} />
                    <div>
                      <p style={{ color: 'var(--eqho-orange)' }}>Access ends</p>
                      <p 
                        className="text-sm"
                        style={{ color: 'var(--eqho-text-secondary)' }}
                      >
                        {format(new Date(profile.current_period_end), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isUserPro && (
              <p style={{ color: 'var(--eqho-text-secondary)' }}>
                Upgrade to EQHO Player to unlock cloud sync, cross-device access, and automatic backups.
              </p>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div 
              className="mb-6 p-4 rounded-lg border flex items-center gap-3"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
              }}
            >
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* Actions */}
          {isUserPro && profile?.stripe_customer_id && (
            <div 
              className="rounded-2xl p-6"
              style={{
                backgroundColor: 'var(--eqho-bg-card)',
                border: '1px solid var(--eqho-border)',
              }}
            >
              <h3 
                className="font-semibold mb-4"
                style={{ color: 'var(--eqho-text-primary)' }}
              >
                Manage Subscription
              </h3>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent border-white/10 text-white hover:bg-white/5"
                  onClick={handleManageBilling}
                  disabled={actionLoading === 'portal'}
                >
                  <span>Update payment method</span>
                  {actionLoading === 'portal' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 opacity-50" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent border-white/10 text-white hover:bg-white/5"
                  onClick={handleManageBilling}
                  disabled={actionLoading === 'portal'}
                >
                  <span>View billing history</span>
                  {actionLoading === 'portal' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 opacity-50" />
                  )}
                </Button>

                {isCancelPending ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center border-white/10 hover:bg-white/5"
                    style={{ color: 'var(--eqho-cyan)' }}
                    onClick={handleResume}
                    disabled={actionLoading === 'resume'}
                  >
                    {actionLoading === 'resume' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Resume subscription
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-center text-red-400 border-red-400/30 hover:bg-red-400/10 bg-transparent"
                        disabled={actionLoading === 'cancel'}
                      >
                        Cancel subscription
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent 
                      style={{ 
                        backgroundColor: 'var(--eqho-bg-card)',
                        borderColor: 'var(--eqho-border)',
                      }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle style={{ color: 'var(--eqho-text-primary)' }}>
                          Cancel subscription?
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ color: 'var(--eqho-text-secondary)' }}>
                          You&apos;ll still have access to EQHO Player features until the end of your current billing period. 
                          After that, you&apos;ll be downgraded to the free plan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5">
                          Keep subscription
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          className="bg-red-500 text-white hover:bg-red-600"
                        >
                          {actionLoading === 'cancel' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Yes, cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = getStatusLabel(status as Parameters<typeof getStatusLabel>[0])
  
  const isPaid = status === 'active' || status === 'trialing'
  const isPastDue = status === 'past_due'
  
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: isPaid 
          ? 'linear-gradient(135deg, var(--eqho-pink) 0%, var(--eqho-orange) 100%)'
          : isPastDue
            ? 'rgba(255, 138, 0, 0.2)'
            : 'rgba(255, 255, 255, 0.1)',
        color: isPaid 
          ? 'white' 
          : isPastDue 
            ? 'var(--eqho-orange)'
            : 'var(--eqho-text-muted)',
      }}
    >
      {label}
    </span>
  )
}

function BillingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--eqho-pink)' }} />
    </div>
  )
}

export default function BillingPage() {
  return (
    <div 
      className="min-h-screen w-full"
      style={{ backgroundColor: 'var(--eqho-bg-app)' }}
    >
      {/* Header */}
      <header 
        className="flex items-center gap-4 px-6 py-4 border-b" 
        style={{ borderColor: 'var(--eqho-border)' }}
      >
        <Link href="/app">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--eqho-text-primary)' }}>
          Billing
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <Suspense fallback={<BillingFallback />}>
          <BillingContent />
        </Suspense>
      </main>
    </div>
  )
}
