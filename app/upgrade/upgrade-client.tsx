'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CreditCard, Check, Sparkles, ArrowRight, Loader2, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// Check if running in v0 preview
const isV0Preview = typeof window !== 'undefined' && (
  window.location.hostname.includes('vusercontent.net') ||
  window.location.hostname.includes('v0.dev') ||
  window.location.hostname.includes('localhost')
)

export default function UpgradeClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const canceled = searchParams.get('canceled')
  const [loading, setLoading] = useState(true)
  const [redirectingToStripe, setRedirectingToStripe] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [emailMismatch] = useState(false)

  // Check session on mount - ALWAYS use getUser() for fresh auth data
  useEffect(() => {
    if (isV0Preview) {
      setLoading(false)
      setUser({ id: 'preview-user', email: 'preview@example.com' })
      return
    }

    const checkSession = async () => {
      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      // ALWAYS use getUser() - this fetches fresh data from the server
      // DO NOT use getSession() as it can return stale/cached data
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        console.log('[v0] No authenticated user, redirecting to login')
        router.replace('/login')
        return
      }

      console.log('[v0] Fresh auth user:', authUser.id, authUser.email)
      
      // Set user from fresh auth data
      const freshEmail = authUser.email || ''
      setUser({ id: authUser.id, email: freshEmail })

      // Check profile for subscription status
      let profile = null

      const { data: profileById } = await supabase
        .from('profiles')
        .select('subscription_status, email')
        .eq('id', authUser.id)
        .single()

      if (profileById) {
        profile = profileById
      } else if (authUser.email) {
        // Fallback: look up by email (profiles is keyed on id, there is no user_id column)
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('subscription_status, email')
          .ilike('email', authUser.email)
          .single()
        if (profileByEmail) {
          profile = profileByEmail
        }
      }

      if (profile?.subscription_status && ['active', 'trialing'].includes(profile.subscription_status)) {
        setHasSubscription(true)
      }

      setLoading(false)
    }

    checkSession()
  }, [router])

  const handleStartTrial = async () => {
    if (!user) return
    
    // Block checkout if email mismatch detected
    if (emailMismatch) {
      setCheckoutError('Account session mismatch. Please log out and log back in.')
      return
    }
    
    setRedirectingToStripe(true)
    setCheckoutError(null)
    
    try {
      // Call our API to create a Stripe Checkout Session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        // Build a detailed message from the server's structured error response
        const parts: string[] = []
        if (data.error) parts.push(data.error)
        const meta: string[] = []
        if (data.stripeType) meta.push(`type: ${data.stripeType}`)
        if (data.stripeCode) meta.push(`code: ${data.stripeCode}`)
        if (data.statusCode) meta.push(`status: ${data.statusCode}`)
        if (meta.length) parts.push(`(${meta.join(', ')})`)
        console.error('[v0] Checkout API error:', data)
        throw new Error(parts.join(' ') || 'Failed to create checkout session')
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('[v0] Checkout error:', error)
      setCheckoutError(error instanceof Error ? error.message : 'Failed to start checkout')
      setRedirectingToStripe(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#ff4fa3] animate-spin" />
          <p className="text-[#94a3b8] text-sm">Checking your account...</p>
        </div>
      </div>
    )
  }

  if (hasSubscription) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#22c55e]">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">You&apos;re Already Subscribed!</h2>
          <p className="text-sm mb-6 text-[#94a3b8]">You have full access to EQHO Player.</p>
          <Link href="/">
            <Button className="h-11 px-6 text-sm font-semibold text-white border-0 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]">
              Go to Player
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#020617] flex flex-col overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <Link href="/login">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-base font-semibold text-white">EQHO Player</h1>
      </header>

      <main className="relative flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div className="max-w-lg w-full space-y-5">
          {/* Logo + Welcome */}
          <div className="text-center">
            <Image src="/images/eqho-logo.png" alt="EQHO Player" width={140} height={140} priority className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Welcome to EQHO Player</h2>
            <p className="text-[#94a3b8] text-sm mt-1">Your account has been created successfully.</p>
          </div>

          {/* Email Mismatch Error */}
          {emailMismatch && (
            <div className="p-3 rounded-xl border flex items-start gap-2 bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-red-400">Account Session Mismatch</p>
                <p className="text-xs text-[#94a3b8]">Please log out and log back in to continue.</p>
              </div>
            </div>
          )}

          {/* Checkout Error */}
          {checkoutError && (
            <div className="p-3 rounded-xl border flex items-start gap-2 bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-red-400">Checkout Failed</p>
                <p className="text-xs text-[#94a3b8]">{checkoutError}</p>
              </div>
            </div>
          )}

          {/* Canceled notice */}
          {canceled && (
            <div className="p-3 rounded-xl border flex items-start gap-2 bg-[#ff8a00]/10 border-[#ff8a00]/30">
              <AlertCircle className="h-4 w-4 text-[#ff8a00] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-[#ff8a00]">Checkout Canceled</p>
                <p className="text-xs text-[#94a3b8]">No worries! Try again when ready.</p>
              </div>
            </div>
          )}

          {/* Email & Security Notice */}
          <div className="flex gap-3">
            {user && (
              <div className="flex-1 bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-xl p-3">
                <p className="text-xs text-[#94a3b8] mb-0.5">Linked to</p>
                <p className="text-sm font-semibold text-[#22d3ee] truncate">{user.email}</p>
              </div>
            )}
            <div className="flex-1 bg-[#ff8a00]/10 border border-[#ff8a00]/30 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Lock className="h-3 w-3 text-[#ff8a00]" />
                <p className="text-xs font-semibold text-[#ff8a00]">Important</p>
              </div>
              <p className="text-xs text-[#94a3b8]">Email must match EQHO account</p>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-5">
            {/* 30 Days Free Banner + Monthly Pricing */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-xl p-4 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-white shrink-0" />
                <div>
                  <p className="font-bold text-white text-lg leading-tight">30 Days FREE</p>
                  <p className="text-xs text-white/90">Full access to all EQHO Player features</p>
                </div>
              </div>
              <div className="bg-[#020617] border border-white/10 rounded-xl px-5 py-3 text-center flex flex-col justify-center">
                <p className="text-xs text-[#94a3b8]">Then</p>
                <p className="text-2xl font-black text-white leading-tight">£3.99</p>
                <p className="text-xs text-[#64748b]">/month</p>
              </div>
            </div>

            {/* Features - 2 columns */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
              {[
                'Cloud Storage',
                'Playback Tools',
                'Cross Device Sync',
                'Offline Playback',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#22c55e]">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleStartTrial}
              disabled={redirectingToStripe || !user}
              className="w-full h-12 rounded-xl font-bold text-base transition-all hover:scale-[1.02] flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_6px_24px_rgba(34,197,94,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {redirectingToStripe ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Start 30-Day Free Trial
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="text-center text-xs mt-2 text-[#64748b]">
              Start your 30-day free trial today. Your subscription will automatically continue at £3.99/month unless cancelled.
            </p>
            <p className="text-center text-xs mt-1.5 text-[#64748b]">
              No charge today. Cancel anytime during your free trial.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
