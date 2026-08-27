'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
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

    let data: Awaited<ReturnType<typeof supabase.auth.signUp>>['data'] | null = null
    let authError: Awaited<ReturnType<typeof supabase.auth.signUp>>['error'] | null = null

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      })
      data = result.data
      authError = result.error
    } catch (thrown) {
      // Network failure / misconfigured client / unexpected throw.
      console.error('[v0] signUp threw an exception:', thrown)
      setError(thrown instanceof Error ? thrown.message : 'Signup failed unexpectedly. Please try again.')
      setLoading(false)
      return
    }

    // Full, explicit log of the signUp result for debugging.
    console.log('[v0] signUp full response:', JSON.stringify({ data, error: authError }, null, 2))
    console.log('[v0] signUp summary:', {
      userId: data?.user?.id,
      identities: data?.user?.identities?.length,
      hasSession: !!data?.session,
      error: authError?.message,
    })

    if (authError) {
      console.error('[v0] signUp returned error:', authError.message, authError)
      // Explicit duplicate-email error from Supabase
      if (/already registered|already exists|already in use/i.test(authError.message)) {
        console.log('[v0] Duplicate email detected via authError')
        setError('This email address is already registered. Please log in instead.')
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    // Supabase does NOT throw on a duplicate email (to prevent email enumeration).
    // Instead it returns a user object with an EMPTY identities array and no session.
    if (data?.user && (data.user.identities?.length ?? 0) === 0) {
      console.log('[v0] Duplicate email detected via empty identities array')
      setError('This email address is already registered. Please log in instead.')

      // Decide where an existing user should go: app if they have Pro, else /upgrade.
      try {
        const res = await fetch('/api/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const info = await res.json()
        console.log('[v0] check-email result:', info)
        if (info.exists) {
          // Free access: existing users go straight to the player.
          router.push('/app')
          return
        }
      } catch (checkErr) {
        console.error('[v0] check-email error:', checkErr)
      }

      setLoading(false)
      return
    }

    if (data?.user) {
      console.log('[v0] User created via signup:', data.user.id, data.user.email)
      
      // Create the profile via API (uses service role key to bypass RLS)
      try {
        const response = await fetch('/api/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email || email,
            fullName: fullName,
          }),
        })

        const result = await response.json()
        console.log('[v0] Create profile API result:', result)
      } catch (apiError) {
        console.error('[v0] Profile creation API error:', apiError)
      }

      // Safety net: guarantee a profiles row exists for this user even if the
      // create-profile call above failed. Idempotent + never overwrites data.
      try {
        const ensureRes = await fetch('/api/ensure-profile', { method: 'POST' })
        const ensureJson = await ensureRes.json()
        console.log('[v0] signup ensure-profile result:', ensureJson)
      } catch (ensureErr) {
        console.error('[v0] signup ensure-profile error:', ensureErr)
      }

      router.push('/signup/success')
      return
    }

    // No error was returned, but no user was created either. Never show success.
    console.error('[v0] signUp returned neither a user nor an error. Not redirecting.', data)
    setError('We could not create your account. Please try again.')
    setLoading(false)
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
        <div className="flex justify-center mb-6">
          <Image
            src="/images/eqho-logo.png"
            alt="EQHO Player"
            width={240}
            height={96}
            className="h-auto w-[240px] max-w-full"
            priority
          />
        </div>

        {/* Signup Card */}
        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-sm text-[#94a3b8] mb-6">Create your account to start your 30-day free trial of EQHO Player. No charge today.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7c8596]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
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
                  className="w-full pl-11 pr-4 py-3 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7c8596]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition"
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

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7c8596]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8596] hover:text-[#cbd5e1] transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#7c8596]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#ff4fa3] hover:text-[#ff8a00] font-medium transition">
                Login
              </Link>
            </p>
            <p className="mt-3 text-xs">
              <Link href="/privacy-policy" className="text-[#64748b] hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
