import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { getLivePrice } from '@/lib/get-pricing'
import { SITE, LAUNCH, CTA } from '@/lib/marketing-config'

export const metadata: Metadata = {
  title: `Pricing — ${SITE.name}`,
  description: `${SITE.name} is free to use until 31 August. Simple, transparent pricing for coaches after launch.`,
  alternates: { canonical: '/pricing' },
}

// Always fetch fresh so the page reflects the current Stripe price.
export const dynamic = 'force-dynamic'

const PLAN_FEATURES = [
  'Unlimited playlists and running orders',
  'Precise per-track playback controls',
  'Full-screen routine countdown',
  'Cloud backup of your sessions',
  'Use in the browser or install the app',
  'Cancel anytime',
]

export default async function PricingPage() {
  const price = await getLivePrice()

  return (
    <>
      <SiteHeader />
      <main className="bg-[#020617] text-white">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(70%_60%_at_50%_-10%,rgba(255,79,163,0.16),transparent_60%)]"
          />
          <div className="mx-auto w-full max-w-3xl px-4 pb-8 pt-16 text-center sm:px-6 sm:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ff8a00]/30 bg-[#ff8a00]/10 px-4 py-1.5 text-xs font-semibold text-[#ffb673]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a00]" />
              {LAUNCH.freeUntilLabel}
            </span>
            <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              Simple pricing for coaches.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
              {LAUNCH.freeNote}
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto w-full max-w-md px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-8">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]"
              />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                {SITE.name}
              </h2>

              {/* Price: live from Stripe when available, otherwise a launch message
                  (never a fabricated number). */}
              <div className="mt-4 flex items-end gap-2">
                {price.live ? (
                  <>
                    <span className="text-5xl font-extrabold tracking-tight text-white">
                      {price.formatted}
                    </span>
                    {price.interval && (
                      <span className="mb-1.5 text-lg text-[#94a3b8]">/{price.interval}</span>
                    )}
                  </>
                ) : (
                  <span className="text-4xl font-extrabold tracking-tight text-white">
                    Free during launch
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-[#94a3b8]">
                {price.live
                  ? `Free to use until 31 August — then ${price.formatted}${
                      price.interval ? ` / ${price.interval}` : ''
                    }.`
                  : 'Free to use until 31 August. Launch pricing will be shown here.'}
              </p>

              <Link
                href={CTA.primary.href}
                className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,79,163,0.35)] transition-transform hover:scale-[1.02]"
              >
                {CTA.primary.label}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="mt-3 text-center text-xs text-[#64748b]">No card required to start.</p>

              <ul className="mt-8 space-y-3 border-t border-white/10 pt-6">
                {PLAN_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-[#cbd5e1]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8a00]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-6 text-center text-sm text-[#7c8596]">
              Questions about billing?{' '}
              <Link href="/#faq" className="text-white underline-offset-4 hover:underline">
                Read the FAQ
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
