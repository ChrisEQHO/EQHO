'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { isV0Preview } from '@/lib/utils/preview'
import { Mail } from 'lucide-react'

// Basic email format check (matches the intent of the login form's `type="email"`).
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    // In v0 preview there is no real Supabase; show the success state so the
    // screen can be previewed without sending anything.
    if (isV0Preview) {
      setSent(true)
      setLoading(false)
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setError('Unable to send the reset email. Please try again.')
      setLoading(false)
      return
    }

    // The reset email always opens the secure production web page. Inside the
    // Capacitor app window.location.origin is capacitor://localhost, which is not
    // a valid redirect, so the mobile build points at the production URL. On web
    // we use the current origin so local dev and production both work.
    const isMobileBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile'
    const redirectTo = isMobileBuild
      ? 'https://www.eqho-player.com/reset-password'
      : `${window.location.origin}/reset-password`

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })

      if (resetError) {
        const message = (resetError.message || '').toLowerCase()
        if (message.includes('rate') || message.includes('too many') || (resetError as { status?: number }).status === 429) {
          setError('Too many reset attempts. Please wait a few minutes and try again.')
        } else {
          setError('Unable to send the reset email. Please try again.')
        }
        setLoading(false)
        return
      }

      // Security: always show the same success response whether or not the email
      // maps to a real account.
      setSent(true)
      setLoading(false)
    } catch {
      setError('Unable to send the reset email. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#020617] px-4 py-10 overflow-y-auto"
      style={{
        paddingTop: 'max(2.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))',
      }}
    >
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
        </div>

        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          {sent ? (
            /* Success state — identical copy regardless of whether the email exists */
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white mb-2">Check your email</h1>
              <p className="text-sm text-[#94a3b8] leading-relaxed mb-6">
                If an account exists for that email address, we&apos;ve sent a password reset link.
              </p>
              <Link
                href="/login"
                className="block w-full h-12 rounded-xl font-semibold text-center leading-[48px] border border-white/20 text-white hover:bg-white/10 transition-all"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold text-white mb-2">Reset your password</h1>
                <p className="text-sm text-[#94a3b8] leading-relaxed">
                  Enter the email address linked to your EQHO Player account and we&apos;ll send you a
                  secure password reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {error && (
                  <div className="p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] shadow-[0_4px_20px_rgba(255,79,163,0.3)]"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending reset link…
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <Link href="/login" className="text-sm text-[#22d3ee] hover:underline transition-colors">
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
