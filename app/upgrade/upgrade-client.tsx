'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CreditCard, Check, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

// Stripe Payment Link for subscription
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/4gMfZbfZDbPW33Fbop3F603'

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

  // Check session on mount
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

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Not logged in - redirect to login
        router.replace('/login')
        return
      }

      setUser({ id: session.user.id, email: session.user.email || '' })

      // Check if user already has active subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('user_id', session.user.id)
        .single()

      if (profile?.subscription_status && ['active', 'trialing'].includes(profile.subscription_status)) {
        setHasSubscription(true)
      }

      setLoading(false)
    }

    checkSession()
  }, [router])

  const handleStartTrial = () => {
    if (!user) return
    
    setRedirectingToStripe(true)
    
    // Build Stripe Payment Link with user info
    const paymentUrl = new URL(STRIPE_PAYMENT_LINK)
    paymentUrl.searchParams.set('client_reference_id', user.id)
    paymentUrl.searchParams.set('prefilled_email', user.email)
    
    // Open in same tab
    window.location.href = paymentUrl.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#ff4fa3] animate-spin" />
          <p className="text-[#94a3b8]">Checking your account...</p>
        </div>
      </div>
    )
  }

  // User already has subscription
  if (hasSubscription) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-[#22c55e]">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-white">
            You&apos;re Already Subscribed!
          </h2>
          <p className="text-lg mb-8 text-[#94a3b8]">
            You have full access to EQHO Player Pro.
          </p>
          <Link href="/">
            <Button className="h-12 px-8 text-base font-semibold text-white border-0 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]">
              Go to Player
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <Link href="/login">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-white">EQHO Player</h1>
      </header>

      <main className="relative flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/eqho-logo.png"
              alt="EQHO Player"
              width={180}
              height={180}
              priority
            />
          </div>

          {/* Welcome message */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to EQHO Player Pro</h2>
            <p className="text-[#94a3b8]">Your EQHO account has been created successfully.</p>
          </div>

          {/* Canceled notice */}
          {canceled && (
            <div className="mb-6 p-4 rounded-xl border flex items-start gap-3 bg-[#ff8a00]/10 border-[#ff8a00]/30">
              <AlertCircle className="h-5 w-5 text-[#ff8a00] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#ff8a00]">Checkout Canceled</p>
                <p className="text-sm text-[#94a3b8]">No worries! You can try again whenever you&apos;re ready.</p>
              </div>
            </div>
          )}

          {/* Logged in as */}
          {user && (
            <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-[#94a3b8] mb-1">Your subscription and trial will be linked to this email address:</p>
              <p className="text-lg font-semibold text-[#22d3ee]">{user.email}</p>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8">
            {/* 30 Days Free Banner */}
            <div className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-xl p-5 mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-white" />
                <div>
                  <p className="font-bold text-white text-2xl">30 Days FREE</p>
                  <p className="text-sm text-white/90">
                    Try all EQHO Player Pro features free for 30 days.
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing info */}
            <div className="bg-[#020617] border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-[#94a3b8] mb-1">Then</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">£7.99</span>
                <span className="text-[#94a3b8]">/month</span>
              </div>
              <p className="text-sm text-[#64748b] mt-2">
                Cancel anytime before the trial ends.
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited playlists and tracks',
                'Cloud sync across all devices',
                'Advanced session management',
                'Priority customer support',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-[#e2e8f0]">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#22c55e]">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={handleStartTrial}
              disabled={redirectingToStripe || !user}
              className="w-full h-16 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-3 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_8px_32px_rgba(34,197,94,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
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

            <p className="text-center text-xs mt-4 text-[#64748b]">
              You&apos;ll be redirected to Stripe. Your card won&apos;t be charged until the trial ends.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
