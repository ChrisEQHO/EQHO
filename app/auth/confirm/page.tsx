'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { isV0Preview } from '@/lib/utils/preview'
import { apiFetch } from '@/lib/api-client'
import { CheckCircle2, AlertCircle, Mail } from 'lucide-react'

type Status = 'ready' | 'verifying' | 'done' | 'invalid' | 'expired'

// Only allow internal, single-slash destinations so `?next=` can never be used
// as an open redirect.
function safeNext(raw: string | null): string {
  if (!raw) return '/signup/success'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/signup/success'
  if (raw.includes('://') || raw.includes('\\')) return '/signup/success'
  return raw
}

// Credentials carried by the confirmation link, captured ONCE on mount.
type Confirmation = {
  tokenHash: string | null
  type: EmailOtpType | null
  next: string
  hasProviderError: boolean
}

function ConfirmInner() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('ready')
  const [loading, setLoading] = useState(false)
  const confirmationRef = useRef<Confirmation | null>(null)

  // IMPORTANT: we deliberately do NOT call verifyOtp on load.
  //
  // The Supabase signup `token_hash` is STRICTLY SINGLE-USE. Email security
  // scanners (Outlook SafeLinks, Proofpoint, Mimecast…), mail-app link previews
  // and browser prefetch all issue a GET on the confirmation link BEFORE the
  // human clicks. If we verified on load, that automated GET would consume the
  // one-time token and the real click would fail as "expired" — which is exactly
  // the bug this page fixes. Instead we capture the token here and consume it
  // once, on an explicit button click, in the same context that lands the user.
  // Scanners issue GETs but never click, so the token survives for the human.
  // This mirrors the working /reset-password flow.
  useEffect(() => {
    if (isV0Preview) {
      confirmationRef.current = { tokenHash: null, type: null, next: '/signup/success', hasProviderError: false }
      setStatus('ready')
      return
    }

    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = safeNext(searchParams.get('next'))
    const hasProviderError = !!(searchParams.get('error') || searchParams.get('error_description'))

    confirmationRef.current = { tokenHash, type, next, hasProviderError }

    // The provider already bounced this link back as expired/invalid, or there is
    // no token to verify at all — there is nothing the user can click to recover.
    if (hasProviderError) {
      setStatus('expired')
    } else if (!tokenHash || !type) {
      setStatus('invalid')
    } else {
      setStatus('ready')
    }
  }, [searchParams])

  const handleConfirm = async () => {
    setLoading(true)

    if (isV0Preview) {
      setStatus('done')
      setLoading(false)
      return
    }

    const confirmation = confirmationRef.current
    const supabase = createClient()

    if (!supabase || !confirmation?.tokenHash || !confirmation.type) {
      setStatus('invalid')
      setLoading(false)
      return
    }

    try {
      // Consume the single-use token NOW, on this explicit user action.
      const { data, error } = await supabase.auth.verifyOtp({
        type: confirmation.type,
        token_hash: confirmation.tokenHash,
      })

      // Capture the ACTUAL Supabase result so real failures are visible in logs
      // instead of being hidden behind a generic "expired" screen.
      console.log('[v0][auth/confirm] verifyOtp result:', {
        hasSession: !!data?.session,
        userId: data?.user?.id,
        errorMessage: error?.message,
        // @ts-expect-error - code is present on AuthError at runtime
        errorCode: error?.code,
      })

      if (error) {
        const msg = (error.message || '').toLowerCase()
        setStatus(msg.includes('expire') || msg.includes('used') ? 'expired' : 'invalid')
        setLoading(false)
        return
      }

      // Session established. Best-effort profile backfill (never blocks the user).
      try {
        await apiFetch('/api/ensure-profile', { method: 'POST' })
      } catch (profileErr) {
        console.log('[v0][auth/confirm] ensure-profile (non-fatal):', profileErr)
      }

      setStatus('done')
      // Hard navigation so the proxy/middleware picks up the freshly-set session
      // cookies on the destination request.
      window.location.assign(confirmation.next)
    } catch (thrown) {
      console.log('[v0][auth/confirm] verifyOtp threw:', thrown)
      setStatus('invalid')
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="flex flex-col items-center mb-6">
        <Image
          src="/images/eqho-logo.png"
          alt="EQHO Player"
          width={220}
          height={88}
          priority
          className="h-auto w-[220px] max-w-full"
        />
      </div>

      <div className="bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        {status === 'ready' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 text-balance">Confirm your account</h1>
            <p className="text-[#cbd5e1] mb-6 leading-relaxed text-pretty">
              You&apos;re one click away. Confirm your email address to activate your EQHO Player account.
            </p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Confirming…
                </>
              ) : (
                'Confirm my account'
              )}
            </button>
          </div>
        )}

        {status === 'done' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Account confirmed</h1>
            <p className="text-[#cbd5e1] mb-6 leading-relaxed">Taking you to the next step…</p>
            <span className="inline-block w-6 h-6 border-2 border-[#ff4fa3] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {(status === 'invalid' || status === 'expired') && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 text-balance">
              {status === 'expired' ? 'This link has expired' : "This link didn't work"}
            </h1>
            <p className="text-[#cbd5e1] mb-6 leading-relaxed text-pretty">
              {status === 'expired'
                ? 'Confirmation links can each be used once and are only valid for a short time. Request a fresh one and we\u2019ll email it straight over.'
                : 'The confirmation link is missing information or has already been used. Request a new one below, or log in if your account is already confirmed.'}
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/error?reason=expired"
                className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition"
              >
                Request a new link
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition"
              >
                Back to login
              </Link>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-[#7c8596] text-xs mt-6">
        EQHO Player - Professional Music Session Management
      </p>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
      </div>

      <Suspense fallback={<div className="text-[#7c8596]">Loading…</div>}>
        <ConfirmInner />
      </Suspense>
    </div>
  )
}
