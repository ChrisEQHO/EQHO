'use client'

// Route-level error boundary for the player (`/app`).
//
// The player is a single ~11k-line client component. If ANY render throws
// (a missing profile row, a nullable subscription field, malformed persisted
// playlist data, an unexpected shape from IndexedDB, etc.) Next.js would
// otherwise fall through to the global error page — the blank "This page
// couldn't load" screen users have been hitting right after "Checking your
// access…". This boundary catches that exception and shows a branded,
// RECOVERABLE state instead, with a real way out: retry, or sign out.
//
// We deliberately do NOT hide the underlying error: it is logged to the console
// (and forwarded to any monitoring hook) so the actual fault stays diagnosable.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    // Keep the real error visible for diagnosis instead of swallowing it.
    console.error('[v0][app/error] Player crashed during render:', error)
  }, [error])

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase?.auth.signOut()
    } catch (err) {
      console.error('[v0][app/error] Sign-out failed:', err)
    } finally {
      // Hard navigation clears any in-memory player/audio state so the user
      // lands on a clean login page regardless of what threw.
      window.location.href = '/login'
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div className="relative w-full max-w-md text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#ff4fa3]/8 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-[#ff8a00]/8 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative bg-[rgba(9,15,28,0.96)] border border-white/10 rounded-3xl p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <h1 className="text-2xl font-bold text-white mb-2 text-balance">
            Something went wrong loading the player
          </h1>
          <p className="text-sm text-[#94a3b8] mb-6 text-pretty">
            The player hit an unexpected error. Your account and saved playlists are safe. Try
            again, and if it keeps happening, sign out and back in.
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white font-bold hover:shadow-[0_0_30px_rgba(255,79,163,0.4)] transition"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-[#cbd5e1] font-medium hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>

          {error?.digest && (
            <p className="mt-6 text-[11px] text-[#475569]">Reference: {error.digest}</p>
          )}
        </div>
      </div>
    </main>
  )
}
