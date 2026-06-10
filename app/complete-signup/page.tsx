'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Check, Loader2, CreditCard, Settings, Sparkles, Play, Bug } from 'lucide-react'

type ViewState = 'loading' | 'finalizing' | 'signup' | 'success'

interface DebugInfo {
  userEmail: string | null
  userId: string | null
  profileExists: boolean
  subscriptionStatus: string | null
  trialEnd: string | null
  accessAllowed: boolean
  sessionIdFound: boolean
  lastChecked: string
}

function CompleteSignupContent() {
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  const [showDebug, setShowDebug] = useState(true) // Show debug panel by default
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    userEmail: null,
    userId: null,
    profileExists: false,
    subscriptionStatus: null,
    trialEnd: null,
    accessAllowed: false,
    sessionIdFound: false,
    lastChecked: new Date().toISOString(),
  })
  const [subscriptionData, setSubscriptionData] = useState<{
    status: string
    daysRemaining: number
    email: string
  } | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  // Update debug info helper
  const updateDebug = useCallback((updates: Partial<DebugInfo>) => {
    setDebugInfo(prev => ({
      ...prev,
      ...updates,
      lastChecked: new Date().toISOString(),
    }))
  }, [])

  // Check subscription status - used for polling
  const checkSubscriptionStatus = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) return null

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('[v0] No logged in user')
      updateDebug({ userEmail: null, userId: null, profileExists: false })
      return null
    }

    console.log('[v0] Checking subscription for user:', user.id, user.email)
    updateDebug({ userEmail: user.email || null, userId: user.id })

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, subscription_status, plan, trial_end, trial_active')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('[v0] Profile lookup error:', profileError.message)
      updateDebug({ profileExists: false, subscriptionStatus: null, trialEnd: null, accessAllowed: false })
      return null
    }

    if (profile) {
      console.log('[v0] Profile found:', profile)
      
      const accessAllowed = profile.subscription_status === 'trialing' || profile.subscription_status === 'active'
      
      updateDebug({
        profileExists: true,
        subscriptionStatus: profile.subscription_status,
        trialEnd: profile.trial_end,
        accessAllowed,
      })

      if (accessAllowed) {
        const trialEnd = profile.trial_end ? new Date(profile.trial_end) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        
        return {
          status: profile.subscription_status,
          daysRemaining,
          email: profile.email || user.email || ''
        }
      }
    }

    return null
  }, [updateDebug])

  // Initial check
  useEffect(() => {
    console.log('[v0] /complete-signup loaded')
    console.log('[v0] session_id:', sessionId)
    
    updateDebug({ sessionIdFound: !!sessionId })

    const initializeCheck = async () => {
      // If we have a session_id, we came from Stripe checkout
      // Call our API to verify and update the profile directly
      if (sessionId) {
        setViewState('finalizing')
        
        console.log('[v0] Calling /api/verify-checkout with session_id:', sessionId)
        
        try {
          const response = await fetch('/api/verify-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })

          const result = await response.json()
          console.log('[v0] verify-checkout result:', result)

          if (result.success && result.profile) {
            // Profile updated successfully!
            const trialEnd = result.subscription?.trialEnd 
              ? new Date(result.subscription.trialEnd)
              : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            
            setSubscriptionData({
              status: result.subscription?.status || 'trialing',
              daysRemaining,
              email: result.profile.email || ''
            })
            
            updateDebug({
              profileExists: true,
              subscriptionStatus: result.profile.subscription_status,
              trialEnd: result.profile.trial_end,
              accessAllowed: true,
            })
            
            setViewState('success')
            return
          } else {
            console.log('[v0] verify-checkout failed, falling back to polling:', result.error)
          }
        } catch (err) {
          console.error('[v0] verify-checkout API error:', err)
        }
        
        // Fall back to polling if the direct verification failed
        return
      }

      // No session_id - check if user is already logged in with subscription
      // First ensure a profiles row exists for the authenticated user.
      try {
        const ensureRes = await fetch('/api/ensure-profile', { method: 'POST' })
        const ensureJson = await ensureRes.json()
        console.log('[v0] complete-signup ensure-profile result:', ensureJson)
      } catch (ensureErr) {
        console.error('[v0] complete-signup ensure-profile error:', ensureErr)
      }

      const subData = await checkSubscriptionStatus()
      if (subData) {
        setSubscriptionData(subData)
        setViewState('success')
        return
      }

      // No subscription - show signup form (shouldn't happen normally)
      setViewState('signup')
    }

    initializeCheck()
  }, [sessionId, checkSubscriptionStatus, updateDebug])

  // Polling - check subscription status every 2 seconds for up to 20 seconds
  useEffect(() => {
    if (viewState !== 'finalizing' || pollCount >= 10) return

    const pollInterval = setInterval(async () => {
      console.log('[v0] Polling for subscription status, attempt:', pollCount + 1)
      
      const subData = await checkSubscriptionStatus()
      if (subData) {
        console.log('[v0] Subscription activated! Showing success.')
        setSubscriptionData(subData)
        setViewState('success')
        clearInterval(pollInterval)
        return
      }
      
      setPollCount(prev => prev + 1)
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [viewState, pollCount, checkSubscriptionStatus])

  // Handle when polling times out
  useEffect(() => {
    if (viewState === 'finalizing' && pollCount >= 10) {
      console.log('[v0] Polling timed out, showing signup form as fallback')
      setViewState('signup')
    }
  }, [viewState, pollCount])

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

    console.log('[v0] signUp response:', {
      userId: data?.user?.id,
      identities: data?.user?.identities?.length,
      hasSession: !!data?.session,
      error: authError?.message,
    })

    if (authError) {
      if (/already registered|already exists|already in use/i.test(authError.message)) {
        console.log('[v0] Duplicate email detected via authError')
        setError('This email address is already registered. Please log in instead.')
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    // Supabase returns a user with an empty identities array for a duplicate email
    // (no error, to prevent email enumeration). Treat that as "already registered".
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      console.log('[v0] Duplicate email detected via empty identities array')
      setError('This email address is already registered. Please log in instead.')

      try {
        const res = await fetch('/api/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const info = await res.json()
        console.log('[v0] check-email result:', info)
        if (info.exists) {
          router.push(info.hasAccess ? '/' : '/upgrade')
          return
        }
      } catch (checkErr) {
        console.error('[v0] check-email error:', checkErr)
      }

      setLoading(false)
      return
    }

    if (data.user) {
      console.log('[v0] User created:', data.user.id, data.user.email)
      
      // Create profile via API
      try {
        const response = await fetch('/api/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email || email,
          }),
        })

        const result = await response.json()
        console.log('[v0] Create profile API result:', result)

        if (!response.ok) {
          console.error('[v0] Failed to create profile:', result.error)
        }
      } catch (apiError) {
        console.error('[v0] API call error:', apiError)
      }

      // Redirect to upgrade page to start subscription
      router.push('/upgrade')
    }
  }

  // Debug Panel Component
  const DebugPanel = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="mb-2 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition"
      >
        <Bug className="w-5 h-5" />
      </button>
      
      {showDebug && (
        <div className="bg-[#0a1020] border border-yellow-500/30 rounded-lg p-4 w-80 text-xs font-mono">
          <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
            <Bug className="w-4 h-4" /> Debug Panel
          </h3>
          <div className="space-y-1 text-white/80">
            <div className="flex justify-between">
              <span className="text-white/50">User Email:</span>
              <span className={debugInfo.userEmail ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.userEmail || 'Not logged in'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">User ID:</span>
              <span className="text-white/70 truncate max-w-[150px]">
                {debugInfo.userId || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Profile Exists:</span>
              <span className={debugInfo.profileExists ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.profileExists ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Subscription:</span>
              <span className={
                debugInfo.subscriptionStatus === 'trialing' || debugInfo.subscriptionStatus === 'active'
                  ? 'text-green-400'
                  : 'text-red-400'
              }>
                {debugInfo.subscriptionStatus || 'none'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Trial End:</span>
              <span className="text-white/70">
                {debugInfo.trialEnd ? new Date(debugInfo.trialEnd).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Access Allowed:</span>
              <span className={debugInfo.accessAllowed ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.accessAllowed ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Session ID:</span>
              <span className={debugInfo.sessionIdFound ? 'text-green-400' : 'text-yellow-400'}>
                {debugInfo.sessionIdFound ? 'Found' : 'Not found'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Poll Count:</span>
              <span className="text-white/70">{pollCount}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">View State:</span>
              <span className="text-cyan-400">{viewState}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/10 text-white/40">
              Last checked: {new Date(debugInfo.lastChecked).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Loading state
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <DebugPanel />
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#ff4fa3] animate-spin mx-auto mb-3" />
          <p className="text-white/70 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Finalizing state - waiting for webhook
  if (viewState === 'finalizing') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <DebugPanel />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#22c55e]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md text-center">
          <Image src="/images/eqho-logo.png" alt="EQHO Player" width={100} height={100} priority className="mx-auto mb-4" />
          
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#22c55e]/20 border-4 border-[#22c55e] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#22c55e] animate-spin" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Finalizing Subscription...</h1>
          <p className="text-[#94a3b8] text-sm mb-4">Please wait while we activate your trial.</p>
          
          <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 text-[#94a3b8]">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-sm">Checking status... ({pollCount}/10)</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state - subscription is active
  if (viewState === 'success' && subscriptionData) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <DebugPanel />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#22c55e]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="flex justify-center mb-3">
            <Image src="/images/eqho-logo.png" alt="EQHO Player" width={80} height={80} priority />
          </div>

          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-[#22c55e] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-5">Welcome to EQHO Player Pro!</h1>

          <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-5 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
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

            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-[#020617] border border-white/10 rounded-lg p-2">
                <div className="flex items-center gap-1.5 text-[#94a3b8]">
                  <CreditCard className="h-3 w-3" />
                  <span className="text-xs">Then £47.90/yr</span>
                </div>
              </div>
              <div className="flex-1 bg-[#020617] border border-white/10 rounded-lg p-2">
                <div className="flex items-center gap-1.5 text-[#94a3b8]">
                  <Mail className="h-3 w-3" />
                  <span className="text-xs truncate">{subscriptionData.email}</span>
                </div>
              </div>
            </div>

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

  // Signup form state (fallback)
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <DebugPanel />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-4">
          <Image src="/images/eqho-logo.png" alt="EQHO Player" width={120} height={120} priority />
        </div>

        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <h2 className="text-xl font-bold text-white mb-1 text-center">Create Your Account</h2>
          <p className="text-sm text-[#94a3b8] mb-5 text-center">Sign up to start your free trial</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8596]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1.5">Password</label>
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
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1.5">Confirm Password</label>
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
                'Create Account'
              )}
            </button>
          </form>
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
