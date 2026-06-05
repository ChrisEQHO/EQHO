'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Check, Loader2 } from 'lucide-react'

function CompleteSignupContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkoutEmail, setCheckoutEmail] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get email from URL params (passed from Stripe checkout)
  useEffect(() => {
    const emailParam = searchParams.get('email')
    const sessionId = searchParams.get('session_id')
    
    if (emailParam) {
      const decodedEmail = decodeURIComponent(emailParam)
      setCheckoutEmail(decodedEmail)
      setEmail(decodedEmail)
    }
    
    // Log for debugging
    if (sessionId) {
      console.log('[v0] Stripe session ID:', sessionId)
    }
  }, [searchParams])

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
      // Update the profile with subscription status (trialing)
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 14)
      
      // Try updating with id first, then user_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'trialing',
          trial_end: trialEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id)

      if (profileError) {
        // Try with user_id column
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'trialing',
            trial_end: trialEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', data.user.id)
      }

      // Redirect to success page or directly to player
      router.push('/subscription-success')
    }
  }

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
