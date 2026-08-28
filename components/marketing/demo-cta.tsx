'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isV0Preview } from '@/lib/utils/preview'
import { ScrollLink } from '@/components/marketing/scroll-link'

/**
 * The flag-gated primary call-to-action used across the marketing site.
 *
 * The Phase Two interactive demo is unfinished, so it must never be exposed on
 * the production website. We gate it with `isV0Preview` — the same
 * production-safe detector that guards the login bypass — which is true on
 * localhost and v0 preview hosts and false on eqho-player.com and during
 * production SSR.
 *
 *   • Preview / development → primary button is "Try the interactive demo" and
 *     points at the Phase Two demo location; secondary is "Create free account".
 *   • Production → primary button is the date-driven signup CTA ("Create free
 *     account" / "Start 30-day free trial"); secondary explores the player.
 *
 * Because the detection is client-only, the demo variant is revealed AFTER mount.
 * The server (and first client paint) always render the production variant, so
 * there is no hydration mismatch and no dead demo anchors in production.
 */

const PRIMARY =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,79,163,0.35)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]'

const SECONDARY =
  'inline-flex h-12 items-center justify-center rounded-full border border-[#ff4fa3]/55 bg-[#0e1526] px-7 text-base font-semibold text-white transition-all hover:border-[#ff4fa3]/80 hover:bg-[#16203a] hover:shadow-[0_8px_30px_-8px_rgba(255,79,163,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4fa3]/60'

type DemoCtaProps = {
  /** Date-driven signup label (from getOfferCopy().cta), rendered in production. */
  offerCta: string
  /** Date-driven signup note (from getOfferCopy().cardNote), rendered in production. */
  offerCardNote: string
  /** Where the demo button points. Homepage: "/features#interactive-demo". Player page: "#interactive-demo". */
  demoHref?: string
  /** True when the demo target is on the SAME page (uses smooth-scroll). */
  demoSamePage?: boolean
  /** Label for the demo button (default "Try the interactive demo"). */
  demoLabel?: string
  /** Show the secondary button + supporting line (default true). */
  showSecondary?: boolean
  /** Alignment of the group: centered (default) or left-aligned on desktop. */
  align?: 'center' | 'left'
}

export function DemoCta({
  offerCta,
  offerCardNote,
  demoHref = '/features#interactive-demo',
  demoSamePage = false,
  demoLabel = 'Try the interactive demo',
  showSecondary = true,
  align = 'center',
}: DemoCtaProps) {
  const [demo, setDemo] = useState(false)
  useEffect(() => setDemo(isV0Preview), [])

  const columnAlign = align === 'left' ? 'items-center lg:items-start' : 'items-center'
  const rowJustify = align === 'left' ? 'lg:justify-start' : 'justify-center'

  const demoButton = demoSamePage ? (
    <ScrollLink href={demoHref} className={`${PRIMARY} w-full sm:w-auto`}>
      {demoLabel}
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </ScrollLink>
  ) : (
    <Link href={demoHref} className={`${PRIMARY} w-full sm:w-auto`}>
      {demoLabel}
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </Link>
  )

  return (
    <div className={`flex w-full flex-col ${columnAlign}`}>
      <div className={`flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row ${rowJustify}`}>
        {demo ? (
          <>
            {demoButton}
            {showSecondary && (
              <Link href="/signup" className={`${SECONDARY} w-full sm:w-auto`}>
                Create free account
              </Link>
            )}
          </>
        ) : (
          <>
            <Link href="/signup" className={`${PRIMARY} w-full sm:w-auto`}>
              {offerCta}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            {showSecondary && (
              <Link href="/features" className={`${SECONDARY} w-full sm:w-auto`}>
                Explore the player
              </Link>
            )}
          </>
        )}
      </div>
      {showSecondary && (
        <p className="mt-[clamp(0.5rem,1.5vh,1rem)] text-sm text-[#94a3b8]">
          {demo ? 'No account needed for the demo.' : offerCardNote}
        </p>
      )}
    </div>
  )
}
