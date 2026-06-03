'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { isPro, getStatusLabel, type Subscription } from '@/lib/subscription-types'
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

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSubscription() {
      const data = await getSubscription()
      setSubscription(data)
      setIsLoading(false)
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
      // Refresh subscription data
      const data = await getSubscription()
      setSubscription(data)
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
      // Refresh subscription data
      const data = await getSubscription()
      setSubscription(data)
    }
    
    setActionLoading(null)
  }

  const isUserPro = subscription ? isPro(subscription.status) : false

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
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--eqho-text-primary)' }}>
          Billing
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
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
              Welcome to Pro! Your subscription is now active.
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
                      {isUserPro ? 'EQHO Player Pro' : 'EQHO Player Free'}
                    </h2>
                    <StatusBadge status={subscription?.status || 'free'} />
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

              {isUserPro && subscription && (
                <div className="space-y-4">
                  {/* Pricing info */}
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <CreditCard className="h-5 w-5" style={{ color: 'var(--eqho-pink)' }} />
                    <div>
                      <p style={{ color: 'var(--eqho-text-primary)' }}>£7.99/month</p>
                      {subscription.cancel_at_period_end && (
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
                  {subscription.status === 'trialing' && subscription.trial_end && (
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
                          Ends {format(new Date(subscription.trial_end), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Next billing date */}
                  {subscription.current_period_end && !subscription.cancel_at_period_end && (
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
                          {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Access ends date (for canceled subscriptions) */}
                  {subscription.cancel_at_period_end && subscription.current_period_end && (
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
                          {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isUserPro && (
                <p style={{ color: 'var(--eqho-text-secondary)' }}>
                  Upgrade to Pro to unlock cloud sync, cross-device access, and automatic backups.
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
            {isUserPro && subscription?.stripe_customer_id && (
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

                  {subscription.cancel_at_period_end ? (
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
                            You&apos;ll still have access to Pro features until the end of your current billing period. 
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
      </main>
    </div>
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
