'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

// Stripe Payment Link with 30-day free trial
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJefZbeVz4nu9s32RT3F602'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    
    if (!supabase) {
      setError('Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in v0 environment variables.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      // Check if user has an active subscription
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('[v0] Login - User:', user?.id, user?.email)
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('user_id', user.id)
          .single()
        
        console.log('[v0] Login - Profile query result:', { profile, profileError })
        
        // User needs subscription if:
        // 1. No profile exists (profileError)
        // 2. Profile exists but subscription_status is null/undefined
        // 3. Profile exists but subscription_status is not active/trialing/past_due
        const hasActiveSubscription = profile?.subscription_status && 
          ['active', 'trialing', 'past_due'].includes(profile.subscription_status)
        
        console.log('[v0] Login - Has active subscription:', hasActiveSubscription)
        
        if (!hasActiveSubscription) {
          console.log('[v0] Login - Redirecting to Stripe for free trial')
          // Redirect to Stripe Payment Link for free trial
          const paymentUrl = new URL(STRIPE_PAYMENT_LINK)
          paymentUrl.searchParams.set('client_reference_id', user.id)
          paymentUrl.searchParams.set('prefilled_email', user.email || '')
          window.location.href = paymentUrl.toString()
          return
        }
      }
      
      router.replace('/')
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
        {/* Header */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-3xl font-bold text-white">EQHO Player</h1>
          <p className="text-[#cbd5e1] text-sm mt-2">Welcome back to your session</p>
        </div>

        {/* Login Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <h2 className="text-2xl font-bold text-white mb-4">Login</h2>

          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7c8596]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7c8596]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-11 py-2.5 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8596] hover:text-[#cbd5e1] transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-[#7c8596]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#ff4fa3] hover:text-[#ff8a00] font-medium transition">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#7c8596] text-xs mt-4">
          EQHO Player - Professional Music Session Management
        </p>
      </div>
    </div>
  )
}
