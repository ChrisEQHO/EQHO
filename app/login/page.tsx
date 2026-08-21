'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { isV0Preview } from '@/lib/utils/preview'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Clear stale localStorage on mount and check if user is already logged in
  useEffect(() => {
    // Clear any stale auth-related localStorage values
    if (typeof window !== 'undefined') {
      const keysToRemove = [
        'userEmail', 'email', 'user_email', 'user', 'profile', 
        'subscription', 'stripe', 'trial', 'account', 'session'
      ]
      keysToRemove.forEach(key => {
        try { localStorage.removeItem(key) } catch {}
      })
    }
    
    if (isV0Preview) return
    
    const checkSession = async () => {
      const supabase = createClient()
      if (!supabase) return
      
      // ALWAYS use getUser() for fresh auth data
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return

      // Free access: any logged-in user goes straight to the player.
      router.replace('/')
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[v0] login clicked')
    setError(null)
    setLoading(true)

    // In v0 preview mode, just redirect to player
    if (isV0Preview) {
      console.log('[v0] login: v0 preview, redirect target: /')
      router.replace('/')
      return
    }

    const supabase = createClient()
    
    if (!supabase) {
      setError('Service temporarily unavailable. Please try again later.')
      setLoading(false)
      return
    }

    // Sign in with Supabase (client-side only; session is persisted to
    // localStorage on the Capacitor build, cookies on web).
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log('[v0] login Supabase response:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: authError?.message ?? null,
    })

    if (authError) {
      // Show the EXACT Supabase error and keep the email/password fields filled.
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login failed. Please try again.')
      setLoading(false)
      return
    }

    // Immediately confirm the session was actually persisted before redirecting.
    // This is the authoritative check for the Capacitor WebView (localStorage).
    const { data: sessionData } = await supabase.auth.getSession()
    const sessionExists = !!sessionData?.session
    console.log('[v0] login session exists:', sessionExists)

    if (!sessionExists) {
      // No persisted session means the WebView storage didn't take the token, so
      // redirecting would just bounce back to /login. Surface it instead.
      setError('Could not start your session. Please try again.')
      setLoading(false)
      return
    }

    // Ensure a profiles row exists for this user (mirrors auth.users -> profiles).
    // Skipped on the Capacitor static export (`output: export`) since there is no
    // API server bundled; the client-side Supabase session already controls access.
    const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'
    if (!isMobileBuild) {
      try {
        const ensureRes = await fetch('/api/ensure-profile', { method: 'POST' })
        const ensureJson = await ensureRes.json()
        console.log('[v0] login ensure-profile result:', ensureJson)
      } catch (ensureErr) {
        console.error('[v0] login ensure-profile error:', ensureErr)
      }
    }

    // Free access: no subscription required, go straight to the player.
    // The client-side Supabase session (persisted to localStorage on mobile) is
    // what the player uses to decide login vs. player — no server/cookie needed.
    console.log('[v0] login redirect target: /')
    router.replace('/')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
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

        {/* Login Form Card */}
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
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Forgot Password — a real anchor (Next.js Link), NOT a button with a
                JS onClick. A button that called router.push('/forgot-password') did
                nothing when clicked (the click-handler navigation never fired in the
                user's environment), even though visiting the URL directly worked. An
                anchor performs a native browser navigation that doesn't depend on the
                click handler, so it works reliably on web and in the Capacitor WebView. */}
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-[#22d3ee] hover:underline transition-colors cursor-pointer p-1 relative z-10"
              >
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

        {/* Footer text */}
        <p className="text-center text-xs text-[#64748b] mt-6">
          Create your EQHO account to access EQHO Player.
        </p>
        <p className="text-center text-xs mt-3">
          <Link href="/privacy-policy" className="text-[#64748b] hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
