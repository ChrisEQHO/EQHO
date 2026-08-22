'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { isV0Preview } from '@/lib/utils/preview'
import { Lock, Eye, EyeOff } from 'lucide-react'

type Status = 'verifying' | 'ready' | 'invalid' | 'done'

// The recovery credentials carried by the email link, captured once on mount.
type Recovery = {
  tokenHash: string | null
  type: string | null
  code: string | null
  // true when Supabase's client already auto-established a session from the URL
  // (implicit `#access_token` flow) — in that case we don't need to verify a token.
  hasImplicitError: boolean
}

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Captured recovery credentials from the URL. We deliberately do NOT verify
  // them on mount (see below) — they're consumed once, at submit time.
  const recoveryRef = useRef<Recovery | null>(null)

  // IMPORTANT: we do NOT call verifyOtp / exchangeCodeForSession on page load.
  //
  // The Supabase recovery `token_hash` (and PKCE `code`) is STRICTLY SINGLE-USE.
  // On mobile the mail app often opens the link in a preview/in-app webview before
  // (or in addition to) the real tab, and React can double-invoke this effect, so
  // verifying on load consumed the token twice: the first call succeeded in an
  // ephemeral context, the second returned "expired" in the context the user
  // actually sees — hence "Reset link expired" on mobile but not desktop.
  //
  // Instead we capture the token here and consume it exactly once in handleSubmit,
  // triggered by an explicit user action, in the same context that then calls
  // updateUser. This is robust across devices and against email prefetch/preview.
  useEffect(() => {
    if (isV0Preview) {
      setStatus('ready')
      return
    }

    try {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const tokenHash = url.searchParams.get('token_hash')
      const type = url.searchParams.get('type')
      const hasError = !!url.searchParams.get('error') || url.hash.includes('error')

      recoveryRef.current = { tokenHash, type, code, hasImplicitError: hasError }

      // Only fail immediately if Supabase explicitly returned an error AND there is
      // nothing to try. Otherwise show the form (the implicit `#access_token` flow
      // leaves no query params but does establish a session we can use at submit).
      if (hasError && !tokenHash && !code) {
        setStatus('invalid')
        return
      }

      setStatus('ready')
    } catch {
      setStatus('invalid')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || !confirm) {
      setError('Please fill in both password fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    if (isV0Preview) {
      setStatus('done')
      setLoading(false)
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setError('Unable to update your password. Please try again.')
      setLoading(false)
      return
    }

    try {
      // Consume the recovery token NOW (single use, on this explicit submit) to
      // establish the recovery session, then immediately update the password.
      const recovery = recoveryRef.current
      if (recovery?.tokenHash) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: (recovery.type as 'recovery') || 'recovery',
          token_hash: recovery.tokenHash,
        })
        if (otpError) {
          // Token was invalid/expired/already used — send them to re-request.
          setStatus('invalid')
          return
        }
      } else if (recovery?.code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(recovery.code)
        if (exchangeError) {
          setStatus('invalid')
          return
        }
      }
      // else: implicit `#access_token` flow already established the session on load.

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        const message = (updateError.message || '').toLowerCase()
        if (message.includes('session') || message.includes('expired') || message.includes('jwt')) {
          setStatus('invalid')
          return
        }
        if (message.includes('rate') || message.includes('too many')) {
          setError('Too many attempts. Please wait a few minutes and try again.')
        } else if (message.includes('should be different') || message.includes('same')) {
          setError('Your new password must be different from your old password.')
        } else {
          setError('Unable to update your password. Please try again.')
        }
        setLoading(false)
        return
      }

      // Securely end the temporary recovery session so the user must sign in
      // fresh with their new password (returns them to the normal login flow).
      // scope:'local' clears this device reliably without needing a network call.
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch {
        // Non-fatal: the password was already updated successfully.
      }

      setStatus('done')
      setLoading(false)
    } catch {
      setError('Unable to update your password. Please try again.')
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
            height={112}
            className="mb-2 h-auto w-[280px] max-w-full"
            priority
          />
        </div>

        <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-2xl p-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          {status === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-8 h-8 border-2 border-[#ff4fa3] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-[#94a3b8]">Verifying your reset link…</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white mb-2">Reset link expired</h1>
              <p className="text-sm text-[#94a3b8] leading-relaxed mb-6">
                This password reset link is invalid or has expired.
              </p>
              <div className="space-y-3">
                <Link
                  href="/forgot-password"
                  className="block w-full h-12 rounded-xl font-semibold text-white text-center leading-[48px] transition-all hover:scale-[1.02] bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] shadow-[0_4px_20px_rgba(255,79,163,0.3)]"
                >
                  Request a new reset link
                </Link>
                <Link
                  href="/login"
                  className="block w-full h-12 rounded-xl font-semibold text-center leading-[48px] border border-white/20 text-white hover:bg-white/10 transition-all"
                >
                  Back to login
                </Link>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white mb-2">Password updated</h1>
              <p className="text-sm text-[#94a3b8] leading-relaxed mb-6">
                Your password has been changed successfully. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="block w-full h-12 rounded-xl font-semibold text-white text-center leading-[48px] transition-all hover:scale-[1.02] bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] shadow-[0_4px_20px_rgba(255,79,163,0.3)]"
              >
                Go to login
              </Link>
            </div>
          )}

          {status === 'ready' && (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold text-white mb-2">Choose a new password</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium mb-2 text-[#94a3b8]">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#64748b]" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
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

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-2 text-[#94a3b8]">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#64748b]" />
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your new password"
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
                      Updating…
                    </>
                  ) : (
                    'Update password'
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
