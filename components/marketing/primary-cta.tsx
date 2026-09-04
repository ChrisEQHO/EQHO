'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/track-event'

export function PrimaryCta({
  className = '',
  href,
  label,
  trackName,
  trackLocation,
}: {
  className?: string
  href: string
  label: string
  trackName?: string
  trackLocation?: string
}) {
  return (
    <Link
      href={href}
      onClick={
        trackName
          ? () => trackEvent(trackName, trackLocation ? { location: trackLocation } : undefined)
          : undefined
      }
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,79,163,0.35)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${className}`}
    >
      {label}
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </Link>
  )
}
