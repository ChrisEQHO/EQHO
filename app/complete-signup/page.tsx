'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Check, Loader2, CreditCard, Settings, Sparkles, Play } from 'lucide-react'

type ViewState = 'loading' | 'signup' | 'success'

function CompleteSignupContent() {
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkoutEmail, setCheckoutEmail] = useState<string | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<{
    status: string
    daysRemaining: number
    email: string
  } | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check subscription status - used for initial check and polling
  const checkSubscriptionStatus = useCallback(async (userEmail: string) => {
    const supabase = createClient()
    if (!supabase) return null

    console.log('[v0] Checking subscription status for email:', userEmail)

    // Try to find profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, subscription_status, plan, trial_end')
      .ilike('email', userEmail)
      .single()

    if (profileError) {
      console.log('[v0] Profile lookup error:', profileError.message)
      return null
    }

    if (profile) {
      console.log('[v0] Profile found:', {
        id: profile.id,
        email: profile.email,
        subscription_status: profile.subscription_status,
        plan: profile.plan
      })

      if (profile.subscription_status === 'trialing' || profile.subscription_status === 'active') {
        const trialEnd = profile.trial_end ? new Date(profile.trial_end) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        const daysRemaining = Math.max(0, Math.min(14, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))))
        
        return {
          status: profile.subscription_status,
          daysRemaining,
          email: profile.email
        }
      }
    }

    return null
  }, [])

  // Initial check - see if user is logged in and has active subscription
  useEffect(() => {
    const emailParam = searchParams.get('email')
    const sessionId = searchParams.get('session_id')
    
    console.log('[v0] /complete-signup loaded')
    console.log('[v0] URL email param:', emailParam)
    console.log('[v0] URL session_id param:', sessionId)
    
    if (emailParam) {
      const decodedEmail = decodeURIComponent(emailParam)
      setCheckoutEmail(decodedEmail)
      setEmail(decodedEmail)
    }

    const initializeCheck = async () => {
      const supabase = createClient()
      if (!supabase) {
        setViewState('signup')
        return
      }

      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('[v0] User already logged in:', session.user.email)
        
        // Check their subscription status
        const subData = await checkSubscriptionStatus(session.user.email || '')
        if (subData) {
          console.log('[v0] Active subscription found, showing success')
          setSubscriptionData(subData)
          setViewState('success')
          return
        }
      }

      // If we have checkout email, check if subscription was activated by webhook
      if (emailParam) {
        const decodedEmail = decodeURIComponent(emailParam)
        const subData = await checkSubscriptionStatus(decodedEmail)
        if (subData) {
          console.log('[v0] Subscription found for checkout email, showing success')
          setSubscriptionData(subData)
          setViewState('success')
          return
        }
      }

      // No active subscription found, show signup form
      console.log('[v0] No active subscription, showing signup form')
      setViewState('signup')
    }

    initializeCheck()
  }, [searchParams, checkSubscriptionStatus])

  // Polling - retry checking subscription status every 2 seconds for 20 seconds
  useEffect(() => {
    if (viewState !== 'signup' || !checkoutEmail || pollCount >= 10) return

    const pollInterval = setInterval(async () => {
      console.log('[v0] Polling for subscription status, attempt:', pollCount + 1)
      
      const subData = await checkSubscriptionStatus(checkoutEmail)
      if (subData) {
        console.log('[v0] Subscription activated via webhook!')
        setSubscriptionData(subData)
        setViewState('success')
        clearInterval(pollInterval)
        return
      }
      
      setPollCount(prev => prev + 1)
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [viewState, checkoutEmail, pollCount, checkSubscriptionStatus])

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Verify email matches checkout email if provided
    if (checkoutEmail && email.toLowerCase() !== checkoutEmail.toLowerCase()) {
      setError('Please use the same email address you used during checkout')
      return
    }

    setLoading(true)

    const supabase = createClient()
    
    if (!supabase) {
      setError('Service temporarily unavailable. Please try again later.')
      setLoading(false)
      return
    }

    // Create the user account
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      console.log('[v0] User created:', data.user.id, data.user.email)
      
      // Calculate trial dates
      const trialStart = new Date()
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)
      
      // Check if profile already exists by email (webhook may have created it)
      const { data: existingProfileByEmail } = await supabase
        .from('profiles')
        .select('id, subscription_status, stripe_customer_id, stripe_subscription_id, trial_end')
        .ilike('email', data.user.email || email)
        .single()

      if (existingProfileByEmail) {
        console.log('[v0] Profile exists by email, updating to link to auth user:', existingProfileByEmail.id)
        
        // If this profile was created by webhook with a temp ID, we need to update it
        // to use the real auth user ID. First, delete the old row and insert new one.
        if (existingProfileByEmail.id !== data.user.id) {
          console.log('[v0] Profile has temp ID, migrating to auth user ID')
          
          // Delete the temp profile
          await supabase
            .from('profiles')
            .delete()
            .eq('id', existingProfileByEmail.id)
          
          // Create profile with correct auth user ID
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: '',
              plan: 'pro',
              subscription_status: existingProfileByEmail.subscription_status || 'trialing',
              stripe_customer_id: existingProfileByEmail.stripe_customer_id,
              stripe_subscription_id: existingProfileByEmail.stripe_subscription_id,
              trial_start: trialStart.toISOString(),
              trial_end: existingProfileByEmail.trial_end || trialEnd.toISOString(),
              created_at: new Date().toISOString(),
            })

          if (insertError) {
            console.log('[v0] Insert with migrated ID failed:', insertError.message)
          }
        } else {
          // Profile ID matches auth user ID, just update
          await supabase
            .from('profiles')
            .update({
              subscription_status: existingProfileByEmail.subscription_status || 'trialing',
              plan: 'pro',
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.user.id)
        }
        
        // Use subscription data from webhook if available
        setSubscriptionData({
          status: existingProfileByEmail.subscription_status || 'trialing',
          daysRemaining: existingProfileByEmail.trial_end 
            ? Math.max(0, Math.min(14, Math.ceil((new Date(existingProfileByEmail.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))))
            : 14,
          email: data.user.email || email
        })
      } else {
        // Check if profile exists by auth user ID
        const { data: existingProfileById } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (existingProfileById) {
          console.log('[v0] Profile exists by ID, updating...')
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'trialing',
              plan: 'pro',
              trial_start: trialStart.toISOString(),
              trial_end: trialEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.user.id)
        } else {
          console.log('[v0] Creating new profile...')
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: '',
              plan: 'pro',
              subscription_status: 'trialing',
              trial_start: trialStart.toISOString(),
              trial_end: trialEnd.toISOString(),
              created_at: new Date().toISOString(),
            })

          if (insertError) {
            console.log('[v0] Insert error:', insertError.message)
          }
        }

        setSubscriptionData({
          status: 'trialing',
          daysRemaining: 14,
          email: data.user.email || email
        })
      }

      console.log('[v0] Profile setup complete, showing success')
      setViewState('success')
    }
  }

  // Loading state
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#ff4fa3] animate-spin mx-auto mb-3" />
          <p className="text-white/70 text-sm">Checking subscription status...</p>
        </div>
      </div>
    )
  }

  // Success state - subscription is active
  if (viewState === 'success' && subscriptionData) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#22c55e]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <Image src="/images/eqho-logo.png" alt="EQHO Player" width={80} height={80} priority />
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-[#22c55e] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-5">Welcome to EQHO Player Pro!</h1>

          {/* Status Card */}
          <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-5 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
            {/* Status Badge + Days */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[#22c55e] font-semibold text-sm">Trial Active</span>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white">{subscriptionData.daysRemaining}</p>
                <p className="text-xs text-[#94a3b8]">days left</p>
              </div>
            </div>

            {/* Info row */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-[#020617] border border-white/10 rounded-lg p-2">
                <div className="flex items-center gap-1.5 text-[#94a3b8]">
                  <CreditCard className="h-3 w-3" />
                  <span className="text-xs">Then £3.99/mo</span>
                </div>
              </div>
              <div className="flex-1 bg-[#020617] border border-white/10 rounded-lg p-2">
                <div className="flex items-center gap-1.5 text-[#94a3b8]">
                  <Mail className="h-3 w-3" />
                  <span className="text-xs truncate">{subscriptionData.email}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['Unlimited playlists', 'Cloud sync', 'Advanced sessions', 'Priority support'].map((feature) => (
                <div key={feature} className="flex items-center gap-1.5 text-sm text-[#e2e8f0]">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-[#22c55e]">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <Link
              href="/"
              className="w-full h-11 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white shadow-[0_6px_24px_rgba(255,79,163,0.3)] mb-2"
            >
              <Play className="h-4 w-4" />
              Open EQHO Player
            </Link>

            <Link
              href="/billing"
              className="w-full h-10 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-transparent border border-white/20 text-[#94a3b8] hover:bg-white/5"
            >
              <Settings className="h-4 w-4" />
              Manage Subscription
            </Link>
          </div>

          <p className="text-center text-xs mt-3 text-[#64748b]">
            Trial ends: {new Date(Date.now() + subscriptionData.daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    )
  }

  // Signup form state
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/images/eqho-logo.png"
            alt="EQHO Player"
            width={120}
            height={120}
            priority
          />
        </div>

        {/* Success Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30">
            <Check className="w-4 h-4 text-[#22c55e]" />
            <span className="text-[#22c55e] font-semibold text-sm">Payment Successful</span>
          </div>
        </div>

        {/* Signup Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <h2 className="text-xl font-bold text-white mb-1 text-center">Complete Your Account</h2>
          <p className="text-sm text-[#94a3b8] mb-5 text-center">Create a password to access EQHO Player Pro</p>

          {/* Email Notice */}
          {checkoutEmail && (
            <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-xl p-3 mb-4">
              <p className="text-xs text-[#94a3b8] mb-0.5">Your subscription email:</p>
              <p className="text-sm font-semibold text-[#22d3ee]">{checkoutEmail}</p>
            </div>
          )}

          {/* Polling indicator */}
          {pollCount > 0 && pollCount < 10 && (
            <div className="bg-[#ff8a00]/10 border border-[#ff8a00]/30 rounded-xl p-2 mb-4 flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-[#ff8a00] animate-spin" />
              <span className="text-xs text-[#ff8a00]">Activating subscription... ({pollCount}/10)</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8596]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  readOnly={!!checkoutEmail}
                  className={`w-full pl-10 pr-4 py-2.5 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition text-sm ${checkoutEmail ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>
              {checkoutEmail && (
                <p className="text-xs text-[#64748b] mt-1">Use the same email from checkout</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8596]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 6 characters)"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8596] hover:text-[#cbd5e1] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8596]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8596] hover:text-[#cbd5e1] transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account & Start Trial'
              )}
            </button>
          </form>

          <p className="text-center text-xs mt-4 text-[#64748b]">
            Your 14-day free trial starts now. You won&apos;t be charged until it ends.
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-[#ff4fa3] animate-spin mx-auto mb-3" />
        <p className="text-white/70 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default function CompleteSignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompleteSignupContent />
    </Suspense>
  )
}
