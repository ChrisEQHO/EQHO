'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Crown, Cloud, Zap, Shield, Check } from 'lucide-react'

// Stripe Payment Link with 30-day free trial
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_bIYeYb5lB1CS2LS145'

export default function TrialPage() {
  const [user, setUser] = useState<{ id: string; email: string | undefined } | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      
      // Handle case where Supabase is not configured
      if (!supabase) {
        setLoading(false)
        return
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Not logged in, redirect to login
        router.replace('/login')
        return
      }

      // Check if user already has an active subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('user_id', user.id)
        .single()

      const hasActiveSubscription = profile?.subscription_status && 
        ['active', 'trialing'].includes(profile.subscription_status)

      if (hasActiveSubscription) {
        // Already subscribed, go to app
        router.replace('/')
        return
      }

      setUser({ id: user.id, email: user.email })
      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleStartTrial = () => {
    if (!user) return
    
    setRedirecting(true)
    
    // Build Stripe Payment Link with user info
    const paymentUrl = new URL(STRIPE_PAYMENT_LINK)
    paymentUrl.searchParams.set('client_reference_id', user.id)
    if (user.email) {
      paymentUrl.searchParams.set('prefilled_email', user.email)
    }
    
    window.location.href = paymentUrl.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff4fa3] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-[#ff4fa3]/5 via-transparent to-[#ff8a00]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">EQHO Player</h1>
          <p className="text-[#94a3b8]">Professional Music Session Management</p>
        </div>

        {/* Trial Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          {/* Crown Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center shadow-lg shadow-[#ff4fa3]/30">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Start Your Free Trial
          </h2>
          <p className="text-[#94a3b8] text-center mb-6">
            Get full access to EQHO Player Pro
          </p>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-[#ff4fa3]/10 to-[#ff8a00]/10 border border-[#ff4fa3]/20 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-1">
                30 Days Free
              </div>
              <div className="text-[#94a3b8]">
                Then <span className="text-white font-bold">£7.99</span>/month
              </div>
              <div className="text-sm text-[#64748b] mt-2">
                Cancel anytime. No commitment.
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#ff4fa3]/20 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4 text-[#ff4fa3]" />
              </div>
              <span>Cloud sync across all devices</span>
              <Check className="w-4 h-4 text-green-400 ml-auto" />
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#ff8a00]/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-[#ff8a00]" />
              </div>
              <span>Unlimited playlists and tracks</span>
              <Check className="w-4 h-4 text-green-400 ml-auto" />
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#22d3ee]/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-[#22d3ee]" />
              </div>
              <span>Priority support</span>
              <Check className="w-4 h-4 text-green-400 ml-auto" />
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleStartTrial}
            disabled={redirecting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold text-lg shadow-lg shadow-[#ff4fa3]/30 hover:shadow-[#ff4fa3]/50 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {redirecting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Redirecting to checkout...
              </span>
            ) : (
              'Start Free Trial'
            )}
          </button>

          {/* Logged in as */}
          {user?.email && (
            <p className="text-center text-[#64748b] text-sm mt-4">
              Signed in as {user.email}
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[#64748b] text-xs mt-6">
          By starting your trial, you agree to our Terms of Service.
          <br />
          You won&apos;t be charged until your trial ends.
        </p>
      </div>
    </div>
  )
}
