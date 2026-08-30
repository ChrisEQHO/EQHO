import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getOfferCopy } from '@/lib/marketing-config'

/**
 * "Free to use until 1 October 2026" announcement banner.
 *
 * A full-width bar with the blue → cyan → green gradient that signals "free",
 * placed at the very top of the header (above the nav) on every marketing page.
 * The whole banner is a link to /signup.
 *
 * It renders ONLY during the pre-launch free phase (getOfferCopy().preLaunch),
 * so it disappears automatically on 1 Oct 2026 without a code change — the same
 * date authority every other marketing surface uses.
 */
export function FreeUntilPill({ className = '' }: { className?: string }) {
  if (!getOfferCopy().preLaunch) return null

  return (
    <Link
      href="/signup"
      aria-label="Free to use until 1 October 2026 — create your free account"
      className={`group flex w-full items-center justify-center gap-2.5 bg-gradient-to-r from-[#2563eb] via-[#06b6d4] to-[#10b981] px-4 py-2.5 text-center text-sm font-bold text-white shadow-[0_2px_20px_rgba(16,185,129,0.35)] ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      <span className="text-pretty">Free to use until 1 October 2026 — no account charges, get started free</span>
      <span className="inline-flex items-center gap-1 font-extrabold underline underline-offset-2 decoration-white/50">
        Sign up
        <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
