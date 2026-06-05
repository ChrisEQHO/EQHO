'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PartyPopper, Check, Calendar, CreditCard, Settings, Mail, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Check if running in v0 preview
const isV0Preview = typeof window !== 'undefined' && (
  window.location.hostname.includes('vusercontent.net') ||
  window.location.hostname.includes('v0.dev') ||
  window.location.hostname.includes('localhost')
)

export default function SubscriptionSuccessPage() {
  const [subscriptionData, setSubscriptionData] = useState<{
    status: string
    trialEnd: Date | null
    daysRemaining: number
    email: string
  } | null>(null)

  useEffect(() => {
    if (isV0Preview) {
      // Mock data for preview
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 30)
      setSubscriptionData({
        status: 'trialing',
        trialEnd,
        daysRemaining: 30,
        email: 'user@example.com',
      })
      return
    }

    const fetchSubscription = async () => {
      const supabase = createClient()
      if (!supabase) return

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const userEmail = session.user.email || ''

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, trial_end')
        .eq('user_id', session.user.id)
        .single()

      if (profile) {
        const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null
        const daysRemaining = trialEnd 
          ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0

        setSubscriptionData({
          status: profile.subscription_status || 'trialing',
          trialEnd,
          daysRemaining,
          email: userEmail,
        })
      }
    }

    fetchSubscription()
  }, [])

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#22c55e]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/eqho-logo.png"
            alt="EQHO Player"
            width={160}
            height={160}
            priority
          />
        </div>

        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-[0_8px_32px_rgba(34,197,94,0.4)]">
          <PartyPopper className="h-12 w-12 text-white" />
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to EQHO Player Pro!
        </h1>

        {/* Trial Status Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8 mb-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[#22c55e] font-semibold">Trial Active</span>
          </div>

          {/* Days Remaining */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-[#94a3b8]" />
              <span className="text-[#94a3b8]">Trial Period</span>
            </div>
            <p className="text-5xl font-black text-white">
              {subscriptionData?.daysRemaining || 30}
            </p>
            <p className="text-[#94a3b8]">days remaining</p>
          </div>

          {/* Renewal Info */}
          <div className="bg-[#020617] border border-white/10 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-[#94a3b8]">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">
                Renews at <span className="text-white font-semibold">£3.99/month</span> after the trial period unless cancelled.
              </span>
            </div>
          </div>

          {/* Email Info */}
          <div className="bg-[#020617] border border-white/10 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-[#94a3b8]">
              <Mail className="h-4 w-4" />
              <span className="text-sm">
                Email: <span className="text-white font-semibold">{subscriptionData?.email || 'Loading...'}</span>
              </span>
            </div>
          </div>

          {/* Subscription Linked Notice */}
          <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[#22d3ee] shrink-0 mt-0.5" />
              <p className="text-xs text-[#94a3b8]">
                This subscription is linked to your EQHO account email. Use this email when logging in to access your Pro features.
              </p>
            </div>
          </div>

          {/* Features Unlocked */}
          <div className="text-left mb-6">
            <p className="text-sm text-[#94a3b8] mb-3">You now have access to:</p>
            <ul className="space-y-2">
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
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link 
              href="/"
              className="block w-full h-14 rounded-xl font-bold text-lg bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition"
            >
              Open EQHO Player
            </Link>
            
            <Link 
              href="/billing"
              className="block w-full h-12 rounded-xl font-semibold border border-white/20 text-white flex items-center justify-center gap-2 hover:bg-white/10 transition"
            >
              <Settings className="h-4 w-4" />
              Manage Subscription
            </Link>
            <p className="text-xs text-[#64748b] mt-2">
              You can cancel anytime during your trial. Your access will continue until the end of the trial period.
            </p>
          </div>
        </div>

        {/* Trial End Date */}
        {subscriptionData?.trialEnd && (
          <p className="text-sm text-[#94a3b8] mb-2">
            Trial Ends: <span className="text-white font-semibold">{subscriptionData.trialEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </p>
        )}

        {/* Subscription Status */}
        <p className="text-sm text-[#64748b]">
          Subscription Status: <span className="text-[#22c55e] font-semibold">Trial Active</span>
        </p>
      </div>
    </div>
  )
}
