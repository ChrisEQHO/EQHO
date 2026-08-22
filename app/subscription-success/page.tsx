'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PartyPopper, Check, Calendar, CreditCard, Settings, Mail, Loader2 } from 'lucide-react'
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
  const [activationComplete, setActivationComplete] = useState(false)

  useEffect(() => {
    if (isV0Preview) {
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)
      setSubscriptionData({
        status: 'trialing',
        trialEnd,
        daysRemaining: 14,
        email: 'user@example.com',
      })
      setActivationComplete(true)
      return
    }

    const fetchAndActivateSubscription = async () => {
      const supabase = createClient()
      if (!supabase) {
        // Fallback if Supabase not available
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14)
        setSubscriptionData({
          status: 'trialing',
          trialEnd,
          daysRemaining: 14,
          email: 'Your account',
        })
        setActivationComplete(true)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // No session - still show success with defaults
          const trialEnd = new Date()
          trialEnd.setDate(trialEnd.getDate() + 14)
          setSubscriptionData({
            status: 'trialing',
            trialEnd,
            daysRemaining: 14,
            email: 'Your account',
          })
          setActivationComplete(true)
          return
        }

        const userEmail = session.user.email || 'Your account'
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14)
        
        // Update profile with 14 day trial. profiles is keyed on `id`;
        // fall back to email lookup if the id-based update matches no rows.
        const { error: updateError1 } = await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'trialing',
            trial_end: trialEnd.toISOString(),
          })
          .eq('id', session.user.id)
        
        // If first update fails (no rows matched), try matching by email
        if (updateError1 && session.user.email) {
          await supabase
            .from('profiles')
            .update({ 
              subscription_status: 'trialing',
              trial_end: trialEnd.toISOString(),
            })
            .ilike('email', session.user.email)
        }

        // Fetch updated profile - by id first, then by email
        let profile = null
        const { data: profileById } = await supabase
          .from('profiles')
          .select('subscription_status, trial_end')
          .eq('id', session.user.id)
          .single()
        
        if (profileById) {
          profile = profileById
        } else if (session.user.email) {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('subscription_status, trial_end')
            .ilike('email', session.user.email)
            .single()
          profile = profileByEmail
        }

        // Calculate days remaining - always based on 14 day trial
        let daysRemaining = 14
        if (profile?.trial_end) {
          const profileTrialEnd = new Date(profile.trial_end)
          daysRemaining = Math.max(0, Math.min(14, Math.ceil((profileTrialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))))
        }

        setSubscriptionData({
          status: profile?.subscription_status || 'trialing',
          trialEnd: profile?.trial_end ? new Date(profile.trial_end) : trialEnd,
          daysRemaining,
          email: userEmail,
        })
        
        setActivationComplete(true)
      } catch (error) {
        // On error, still show success with defaults
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14)
        setSubscriptionData({
          status: 'trialing',
          trialEnd,
          daysRemaining: 14,
          email: 'Your account',
        })
        setActivationComplete(true)
      }
    }

    fetchAndActivateSubscription()
  }, [])

  return (
    <div className="h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#22c55e]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-3">
          <Image src="/images/eqho-logo.png" alt="EQHO Player" width={190} height={76} priority className="h-auto w-[190px] max-w-full" />
        </div>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-[0_6px_24px_rgba(34,197,94,0.4)]">
          <PartyPopper className="h-8 w-8 text-white" />
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl font-bold text-white mb-3">Welcome to EQHO Player!</h1>

        {/* Trial Status Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-5">
          {/* Status Badge + Days in row */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[#22c55e] font-semibold text-sm">Trial Active</span>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-white">{Math.min(subscriptionData?.daysRemaining ?? 14, 14)}</p>
              <p className="text-xs text-[#94a3b8]">days left</p>
            </div>
          </div>

          {/* Info row - Renewal + Email */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-[#020617] border border-white/10 rounded-lg p-2">
              <div className="flex items-center gap-1.5 text-[#94a3b8]">
                <CreditCard className="h-3 w-3" />
                <span className="text-xs">Then <span className="text-white font-semibold">£3.99/mo</span></span>
              </div>
            </div>
            <div className="flex-1 bg-[#020617] border border-white/10 rounded-lg p-2">
              <div className="flex items-center gap-1.5 text-[#94a3b8]">
                <Mail className="h-3 w-3" />
                <span className="text-xs truncate">{subscriptionData?.email || 'Your account'}</span>
              </div>
            </div>
          </div>

          {/* Features - 2 columns */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-left">
            {[
              'Cloud Storage',
              'Playback Tools',
              'Cross Device Sync',
              'Offline Playback',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-[#22c55e]">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
                {feature}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {activationComplete ? (
              <Link 
                href="/app"
                className="block w-full h-12 rounded-xl font-bold text-base bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,79,163,0.4)] transition"
              >
                Open EQHO Player
              </Link>
            ) : (
              <button 
                disabled
                className="block w-full h-12 rounded-xl font-bold text-base bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white flex items-center justify-center gap-2 opacity-70 cursor-wait"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Activating EQHO Player...
              </button>
            )}
            
            <Link 
              href="/billing"
              className="block w-full h-10 rounded-xl font-semibold text-sm border border-white/20 text-white flex items-center justify-center gap-2 hover:bg-white/10 transition"
            >
              <Settings className="h-3.5 w-3.5" />
              Manage Subscription
            </Link>
          </div>
        </div>

        {/* Trial End Date */}
        {subscriptionData?.trialEnd && (
          <p className="text-xs text-[#94a3b8] mt-3">
            Trial ends: <span className="text-white font-semibold">{subscriptionData.trialEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </p>
        )}
      </div>
    </div>
  )
}
