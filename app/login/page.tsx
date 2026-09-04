'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { isV0Preview } from '@/lib/utils/preview'
import { trackEvent } from '@/lib/analytics/track-event'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

// Resolve the post-login destination from ?next=, rejecting anything that
// isn't a single-slash internal path so it can never be used as an open
// redirect (`//evil.com`, `https://…`). Defaults to the player at /app.
function safeNext(raw: string | null): string {
  if (!raw) return '/app'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/app'
  if (raw.includes('://') || raw.includes('\\')) return '/app'
  return raw
}

// Map raw Supabase auth error messages to clear, user-facing copy.
function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in. Check your inbox for the confirmation link.'
  }
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Invalid email or password.'
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Network error. Please check your connection and try again.'
  }
  // Any other returned Supabase authentication error — surface it as-is.
  return message
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [accountDeleted, setAccountDeleted] = useState(false)
  const router = useRouter()

  // Clear stale localStorage on mount and check if user is already logged in
  useEffect(() => {
    // Show the deletion confirmation when redirected here after account deletion.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('deleted') === '1') {
        setAccountDeleted(true)
        // Strip the param so a refresh doesn't keep showing the banner.
        window.history.replaceState({}, '', '/login')
      }
    }
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

      // Free access: any logged-in user goes straight to their intended
      // destination (defaults to the player at /app).
      const params = new URLSearchParams(window.location.search)
      router.replace(safeNext(params.get('next')))
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Guard against repeated clicks while a request is already active.
    if (loading) return

    setError(null)
    setLoading(true)

    // In v0 preview mode, just redirect to the intended destination.
    if (isV0Preview) {
      const params = new URLSearchParams(window.location.search)
      router.replace(safeNext(params.get('next')))
      return
    }

    try {
      const supabase = createClient()

      if (!supabase) {
        setError('Service temporarily unavailable. Please try again later.')
        return
      }

      // Race every auth call against a 15s timeout so the button can never stay
      // stuck on "Signing in…" if Supabase/WebKit stalls without resolving.
      const withTimeout = <T,>(promise: PromiseLike<T>, ms = 15000): Promise<T> =>
        Promise.race([
          Promise.resolve(promise),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('__timeout__')), ms),
          ),
        ])

      // Sign in with Supabase (client-side only; session is persisted to
      // localStorage on the Capacitor build, cookies on web).
      const { data, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
      )

      if (authError) {
        setError(mapAuthError(authError.message))
        return
      }

      if (!data.user) {
        setError('Invalid email or password.')
        return
      }

      // Confirm the session was actually persisted before navigating. This is the
      // authoritative check — never redirect until Supabase reports a session.
      const { data: sessionData } = await withTimeout(supabase.auth.getSession())
      if (!sessionData?.session) {
        setError('Could not start your session. Please try again.')
        return
      }

      // Ensure a profiles row exists for this user (mirrors auth.users -> profiles).
      // Skipped on the Capacitor static export (`output: export`) since there is no
      // API server bundled; the client-side Supabase session already controls access.
      // A failure here must NOT block a successful login, so it's best-effort.
      const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'
      if (!isMobileBuild) {
        try {
          await withTimeout(fetch('/api/ensure-profile', { method: 'POST' }), 8000)
        } catch {
          // Non-fatal: the client-side session already controls access.
        }
      }

      // Session confirmed — this is a GENUINE successful login (Supabase returned
      // a user AND a persisted session). Fire the anonymous analytics event here,
      // never on button click, so failed/timed-out logins never count. No email,
      // user id or any personal data is sent.
      trackEvent('Login Success')

      // Session confirmed — go to the intended destination (defaults to the
      // player) and refresh server state so any cookie-reading middleware/RSC
      // picks up the new auth immediately.
      const params = new URLSearchParams(window.location.search)
      router.replace(safeNext(params.get('next')))
      router.refresh()
    } catch (err) {
      // Covers the 15s timeout and any network / Supabase connection failure.
      if (err instanceof Error && err.message === '__timeout__') {
        setError('The request timed out. Please check your connection and try again.')
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    } finally {
      // ALWAYS restore the button — success, failure, timeout or exception.
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-y-auto bg-[#020617] px-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo — links to the main EQHO homepage */}
        <div className="mb-8 flex flex-col items-center">
          <Link
            href="/"
            aria-label="Go to EQHO homepage"
            className="mb-2 inline-block rounded-xl transition-opacity hover:opacity-80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff8a00]"
          >
            <Image
              src="/images/eqho-logo.png"
              alt="EQHO Player"
              width={280}
              height={112}
              className="h-auto w-[280px] max-w-full"
              priority
            />
          </Link>
          <p className="text-sm text-[#94a3b8]">
            Welcome back to your session
          </p>
        </div>

        {/* Account-deleted confirmation (shown after successful deletion) */}
        {accountDeleted && (
          <div
            role="status"
            className="mb-4 p-4 rounded-xl text-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
          >
            Your EQHO Player account has been deleted.
          </div>
        )}

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
