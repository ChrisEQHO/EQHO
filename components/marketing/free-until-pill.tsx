import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getOfferCopy } from '@/lib/marketing-config'

/**
 * "Free to use until 1 October 2026" announcement pill.
 *
 * Reuses the rounded, glowing gradient-pill styling of the site's primary CTAs,
 * but recoloured blue → cyan → green to signal "free". Links to /signup.
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
      className={`group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563eb] via-[#06b6d4] to-[#10b981] px-5 py-2 text-sm font-bold text-white shadow-[0_0_22px_rgba(16,185,129,0.4)] ring-1 ring-white/15 transition-transform hover:scale-[1.03] ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      <span className="whitespace-nowrap">Free to use until 1 October 2026</span>
      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
