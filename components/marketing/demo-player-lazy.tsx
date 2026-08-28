'use client'

import { useEffect, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Play, X } from 'lucide-react'

/**
 * Public launcher for the REAL EQHO player running in read-only demo mode.
 *
 * The production player is a full-viewport app shell (h-[100dvh] w-screen), so it
 * cannot be embedded inline in the marketing flow without breaking its layout.
 * Instead we show a poster/launch card in the page, and open the exact same
 * <EqhoPlayer /> component — with `demoMode` — in a full-screen overlay when the
 * visitor clicks "Launch the interactive demo". In demo mode the player runs
 * fully logged-out: no Supabase auth, playlists seeded from the public /api/demo
 * snapshot, every cloud/account path disabled.
 *
 * The player bundle is code-split (next/dynamic, ssr:false) and only imported
 * when the visitor actually opens the demo, so it never weighs down the initial
 * /features load.
 *
 * Not-published fallback: we probe /api/demo first. If no snapshot is published
 * (or it is disabled), we render the static `fallback` (the real product frame)
 * with no launch affordance, so the section is graceful and never broken.
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

export function DemoPlayerLazy({ fallback }: { fallback?: ReactNode }) {
  const [open, setOpen] = useState(false)
  // null = still probing, true/false = whether a published demo snapshot exists.
  const [available, setAvailable] = useState<boolean | null>(null)

  // Probe the public demo endpoint once to decide whether to offer the launcher.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/demo', { headers: { accept: 'application/json' } })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (cancelled) return
        setAvailable(Boolean(data?.enabled) && Array.isArray(data.playlists) && data.playlists.length > 0)
      } catch {
        if (!cancelled) setAvailable(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
      {/* Poster: the real static product frame, always shown as the section's
          visual. When a demo snapshot is published, an overlay adds the launch
          affordance on top of it. */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1e]">
        {fallback}

        {available === true && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-t from-[#050814]/85 via-[#050814]/40 to-transparent p-6 text-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-8 text-base font-bold text-white shadow-[0_0_30px_rgba(255,79,163,0.35)] transition hover:opacity-95"
            >
              <Play size={20} aria-hidden="true" />
              Launch the interactive demo
            </button>
            <p className="max-w-md text-pretty text-sm text-white/70">
              The real EQHO Player, running live with sample playlists. Nothing is saved and no
              account is required.
            </p>
          </div>
        )}
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
