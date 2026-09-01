'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSiteOrigin } from '@/lib/utils/site-url'
import { AlertCircle, Mail, CheckCircle2 } from 'lucide-react'

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

// Friendly, non-sensitive copy per coarse failure reason. We never render tokens
// or raw provider error strings.
function reasonCopy(reason: string | null): { title: string; body: string } {
  switch (reason) {
    case 'expired':
      return {
        title: 'This link has expired',
        body: "Confirmation links are only valid for a short time and can each be used once. Request a fresh one below and we'll email it straight over.",
      }
    case 'config':
      return {
        title: "We couldn't verify your account",
        body: "Something went wrong on our side while confirming your account. Please try again in a moment, or log in if you've already confirmed.",
      }
    case 'invalid':
    default:
      return {
        title: "This link didn't work",
        body: 'The confirmation link is missing information or has already been used. Request a new one below, or log in if your account is already confirmed.',
      }
  }
}

function AuthErrorInner() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const { title, body } = reasonCopy(reason)

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    if (!supabase) {
      setError('Service temporarily unavailable. Please try again later.')
      setLoading(false)
      return
    }

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${getSiteOrigin()}/auth/callback?next=/app`,
        },
      })

      if (resendError) {
        const message = (resendError.message || '').toLowerCase()
        if (message.includes('rate') || message.includes('too many')) {
          setError('Too many attempts. Please wait a few minutes and try again.')
        } else {
          // Security: avoid confirming whether the email maps to an account.
          setSent(true)
        }
        setLoading(false)
        return
      }

      // Same success response whether or not the email exists / is pending.
      setSent(true)
      setLoading(false)
    } catch {
      setError('Unable to send the email. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-3xl font-bold text-white">EQHO Player</h1>
      </div>

      <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
            <p className="text-[#cbd5e1] mb-6 leading-relaxed">
              If an account is awaiting confirmation for that address, a new
              confirmation link is on its way. It can take a minute to arrive.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3 text-center text-balance">{title}</h2>
            <p className="text-[#cbd5e1] mb-6 leading-relaxed text-center text-pretty">{body}</p>

            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <label htmlFor="resend-email" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Resend confirmation email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7c8596]" />
                  <input
                    id="resend-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#0a1020] border border-white/10 rounded-xl text-white placeholder:text-[#7c8596] focus:outline-none focus:border-[#ff4fa3]/50 focus:ring-1 focus:ring-[#ff4fa3]/50 transition"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send a new link'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <Link href="/login" className="text-[#22d3ee] hover:underline transition-colors">
                Log in
              </Link>
              <span className="text-white/20">•</span>
              <Link href="/signup" className="text-[#22d3ee] hover:underline transition-colors">
                Create an account
              </Link>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-[#7c8596] text-xs mt-6">
        EQHO Player - Professional Music Session Management
      </p>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
      </div>

      <Suspense fallback={<div className="text-[#7c8596]">Loading…</div>}>
        <AuthErrorInner />
      </Suspense>
    </div>
  )
}
