'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Play, X } from 'lucide-react'

/**
 * Public launcher for the REAL EQHO player running in read-only demo mode.
 *
 * The production player is a full-viewport app shell (h-[100dvh] w-screen), so it
 * cannot be embedded inline in the marketing flow without breaking its layout.
 * Instead we show a launch card in the page, and open the exact same
 * <EqhoPlayer /> component — with `demoMode` — in a full-screen overlay when the
 * visitor clicks "Launch live demo". In demo mode the player runs fully
 * logged-out: no Supabase auth, playlists seeded from the public /api/demo
 * snapshot, every cloud/account path disabled.
 *
 * IMPORTANT: there is deliberately NO static image / product-frame fallback and
 * NO pre-probe of /api/demo. The launch control is ALWAYS visible, and the real
 * player always mounts. Data loading, empty and error states (with Retry) are
 * handled INSIDE <EqhoPlayer demoMode /> against the same-origin /api/demo
 * endpoint — so production (which has the published R2 snapshot) always gets the
 * real, interactive player, regardless of what the v0 preview environment can
 * see. The player bundle is code-split (next/dynamic, ssr:false) and only
 * imported when the visitor opens the demo.
 */

const EqhoPlayer = dynamic(
  () => import('@/components/player/eqho-player').then((m) => m.EqhoPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#050814]">
        <p className="flex items-center gap-2 text-[#94a3b8]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading the demo…
        </p>
      </div>
    ),
  },
)

export function DemoPlayerLazy() {
  const [open, setOpen] = useState(false)

  // Lock background scroll while the full-screen demo overlay is open, and allow
  // Escape to close it.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative">
      {/* Launch card — ALWAYS shown, never replaced by an image. Clicking it
          mounts the real <EqhoPlayer demoMode /> in a full-screen overlay. */}
      <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0f1e] via-[#0a0f1e] to-[#12071a] px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] shadow-[0_0_40px_rgba(255,79,163,0.35)]">
          <Play size={28} className="text-white" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="text-balance text-xl font-bold text-white sm:text-2xl">
            Try the real EQHO Player
          </h3>
          <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-white/70">
            This launches the actual player with sample playlists — load, reorder, run a session,
            seek and play. Nothing is saved and no account is required.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-8 text-base font-bold text-white shadow-[0_0_30px_rgba(255,79,163,0.35)] transition hover:opacity-95"
        >
          <Play size={20} aria-hidden="true" />
          Launch live demo
        </button>
      </div>

      {/* Full-screen overlay hosting the actual player in demo mode. */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="EQHO Player interactive demo"
          className="fixed inset-0 z-[100] bg-[#050814]"
        >
          <EqhoPlayer demoMode />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close demo"
            className="fixed right-4 top-4 z-[110] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
