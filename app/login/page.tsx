'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, Crown, CreditCard, ArrowRight, Check, Sparkles, Shield } from 'lucide-react'

// Stripe Payment Link for subscription
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/4gMfZbfZDbPW33Fbop3F603'

// Check if running in v0 preview
const isV0Preview = typeof window !== 'undefined' && (
  window.location.hostname.includes('vusercontent.net') ||
  window.location.hostname.includes('v0.dev') ||
  window.location.hostname.includes('localhost')
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    if (isV0Preview) return
    
    const checkSession = async () => {
      const supabase = createClient()
      if (!supabase) return
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/')
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // In v0 preview mode, just redirect to player
    if (isV0Preview) {
      router.replace('/')
      return
    }

    const supabase = createClient()
    
    if (!supabase) {
      setError('Service temporarily unavailable. Please try again later.')
      setLoading(false)
      return
    }

    // Sign in with Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      if (authError.message.includes('Invalid login')) {
        setError('Invalid email or password. Please try again.')
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Please verify your email before logging in.')
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login failed. Please try again.')
      setLoading(false)
      return
    }

    // Check subscription status in Supabase
    setCheckingSubscription(true)
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, stripe_customer_id')
      .eq('user_id', data.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError)
    }

    // Check if user has active subscription
    const hasActiveSubscription = profile?.subscription_status && 
      ['active', 'trialing', 'past_due'].includes(profile.subscription_status)

    if (!hasActiveSubscription) {
      // No active subscription - redirect to Stripe to subscribe
      setError('No active subscription found. Redirecting to subscribe...')
      setCheckingSubscription(false)
      setLoading(false)
      
      // Auto-redirect to Stripe after 2 seconds
      setTimeout(() => {
        const paymentUrl = new URL(STRIPE_PAYMENT_LINK)
        paymentUrl.searchParams.set('client_reference_id', data.user.id)
        paymentUrl.searchParams.set('prefilled_email', data.user.email || '')
        window.location.href = paymentUrl.toString()
      }, 2000)
      return
    }

    // Has active subscription - go to player
    router.replace('/')
  }

  const handleSubscribe = () => {
    window.open(STRIPE_PAYMENT_LINK, '_blank')
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#020617]">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center">
            <Image
              src="/images/eqho-logo.png"
              alt="EQHO Player"
              width={280}
              height={280}
              className="mb-2"
              priority
            />
            <p className="text-sm text-[#94a3b8]">
              Welcome back to your session
            </p>
          </div>

          {/* Important Notice - Subscription Required */}
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#22c55e] mb-1">
                  EQHO Pro Subscription Required
                </p>
                <p className="text-xs text-[#94a3b8]">
                  Sign up for a 30-day free trial to access the player. No charge until trial ends.
                </p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#94a3b8]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#64748b]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-[#0a1020] border border-white/10 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#94a3b8]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#64748b]" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full h-12 pl-12 pr-12 rounded-xl bg-[#0a1020] border border-white/10 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] shadow-[0_4px_20px_rgba(255,79,163,0.3)]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {checkingSubscription ? 'Checking subscription...' : 'Signing in...'}
                  </>
                ) : (
                  'Login'
                )}
              </button>

              {/* Forgot Password */}
              <div className="text-center">
                <Link href="/forgot-password" className="text-sm text-[#22d3ee] hover:underline transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[rgba(9,15,28,0.96)] text-[#64748b]">
                  New to EQHO Player?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link 
              href="/signup"
              className="block w-full h-12 rounded-xl font-semibold text-center leading-[48px] border border-white/20 text-white hover:bg-white/10 transition-all"
            >
              Create an account
            </Link>
          </div>

          {/* Mobile: Show Subscribe CTA */}
          <div className="lg:hidden mt-8">
            {/* Important Notice */}
            <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#22c55e] mb-1">
                    Subscription Required
                  </p>
                  <p className="text-xs text-[#94a3b8]">
                    You need an active EQHO Pro subscription to access the player.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#ff4fa3]/10 to-[#ff8a00]/10 border border-[#ff4fa3]/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">EQHO Player Pro</h3>
                  <p className="text-sm text-[#94a3b8]">From £3.99/month</p>
                </div>
              </div>

              {/* 30 Days Free Banner */}
              <div className="bg-[#22c55e] rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-white" />
                  <p className="font-bold text-white">30 Days FREE Trial</p>
                </div>
                <p className="text-xs text-white/90 mt-1">
                  No charge until trial ends. Cancel anytime.
                </p>
              </div>

              <button
                onClick={handleSubscribe}
                className="w-full h-12 rounded-xl font-semibold text-white bg-[#22c55e] hover:bg-[#16a34a] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(34,197,94,0.3)] transition-all"
              >
                <CreditCard className="h-5 w-5" />
                Start 30-Day Free Trial
              </button>
              <p className="text-center text-xs mt-3 text-[#64748b]">
                Secure payment via Stripe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Pro Subscription CTA (Desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 py-12 relative overflow-hidden bg-[#020617] border-l border-white/10">
        {/* Background effects - matching left side */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-bl from-[#ff4fa3]/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-[#ff8a00]/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-md">
          {/* Crown Icon */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] shadow-[0_8px_32px_rgba(255,79,163,0.4)]">
            <Crown className="h-10 w-10 text-white" />
          </div>

          <h2 className="text-4xl font-bold mb-4 text-white">
            Get EQHO Player Pro
          </h2>

          <p className="text-lg mb-6 text-[#94a3b8]">
            Professional music session management for coaches and athletes.
          </p>

          {/* 30 Days Free Banner */}
          <div className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-white" />
              <div>
                <p className="font-bold text-white text-lg">30 Days FREE Trial</p>
                <p className="text-sm text-white/90">
                  Try all features free. Cancel anytime before trial ends.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-[#0a1628] border border-white/10 rounded-2xl p-6 mb-6">
            <p className="text-sm text-[#94a3b8] mb-2">After your free trial:</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] bg-clip-text text-transparent">£3.99</span>
              <span className="text-[#94a3b8]">/month</span>
            </div>
            <p className="text-sm mb-3 text-white">
              Billed annually at £47.90/year (save 58%)
            </p>
            <p className="text-sm text-[#64748b]">
              Or £7.99/month billed monthly
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
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#22c55e]">
                  <Check className="w-4 h-4 text-white" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {/* Subscribe Button - Main CTA */}
          <button
            onClick={handleSubscribe}
            className="w-full h-16 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-3 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_8px_32px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.5)]"
          >
            <CreditCard className="h-6 w-6" />
            Start 30-Day Free Trial
            <ArrowRight className="h-6 w-6" />
          </button>

          <p className="text-center text-sm mt-4 text-[#94a3b8]">
            No charge until trial ends. Cancel anytime.
          </p>
          <p className="text-center text-xs mt-2 text-[#64748b]">
            Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
