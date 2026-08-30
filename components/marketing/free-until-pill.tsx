import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getOfferCopy } from '@/lib/marketing-config'

/**
 * "Free to use until 1 October 2026" pill button.
 *
 * A rounded, glowing gradient pill (same shape as the demo CTA) recolored
 * blue → cyan → green to emphasise "free". Designed to sit directly underneath
 * the "Create free account" button. The whole pill links to /signup.
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
      className={`group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#2563eb] via-[#06b6d4] to-[#10b981] px-7 text-base font-bold text-white shadow-[0_0_28px_rgba(16,185,129,0.45)] transition-shadow hover:shadow-[0_0_36px_rgba(16,185,129,0.6)] ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      <span className="text-pretty">Free to use until 1 October 2026</span>
      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
