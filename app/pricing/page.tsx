import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { getLivePrice } from '@/lib/get-pricing'
import { SITE, PRICING, getPricingCopy, PLAYER_PACKAGE } from '@/lib/marketing-config'

// Always fetch fresh so the page reflects the current Stripe price AND the current
// launch phase (the copy switches automatically on 1 October 2026).
export const dynamic = 'force-dynamic'

// Metadata for the pricing route. Runs on the server only — no hydration concerns.
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Pricing — ${SITE.name}`,
    description: `Try ${SITE.name} free for 30 days, then continue with a simple monthly subscription. No charge during your trial — cancel anytime before it ends.`,
    alternates: { canonical: '/pricing' },
  }
}

// The EQHO Player benefit list is centralised in marketing-config so the pricing
// page, homepage and any future surface never drift apart. It contains only
// features that currently work.
const PLAN_FEATURES = PLAYER_PACKAGE.benefits

export default async function PricingPage() {
  // Live Stripe price (GBP), with £4.99 documented fallback. A single price value
  // feeds every piece of copy below so nothing can contradict billing.
  const price = await getLivePrice()
  const copy = getPricingCopy(price.formatted, price.interval)

  return (
    <>
      <SiteHeader />
      <main className="bg-[#020617] text-white">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(70%_60%_at_50%_-10%,rgba(255,79,163,0.16),transparent_60%)]"
          />

          {/* Tighter vertical rhythm so price + trial + post-trial cost are visible
              without scrolling on ~800px-tall laptops. */}
          <div className="mx-auto w-full max-w-5xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff8a00]/30 bg-[#ff8a00]/10 px-4 py-1.5 text-xs font-semibold text-[#ffb673]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a00]" />
                {copy.badge}
              </span>
              <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
                {copy.heading}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-[#94a3b8] sm:text-lg">
                {copy.supporting}
              </p>
            </div>

            {/* Pricing card */}
            <div className="mx-auto mt-10 w-full max-w-md">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-7 sm:p-8">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]"
                />

                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                    {PRICING.productName}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[#ff4fa3]/20 to-[#ff8a00]/20 px-3 py-1 text-xs font-semibold text-[#ffb673] ring-1 ring-inset ring-[#ff8a00]/30">
                    {copy.trialLabel}
                  </span>
                </div>

                {/* Price: live from Stripe, formatted as GBP. Always a real figure. */}
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-5xl font-extrabold tracking-tight text-white">
                    {copy.priceLabel}
                  </span>
                  {copy.frequency && (
                    <span className="mb-1.5 text-base text-[#94a3b8]">{copy.frequency}</span>
                  )}
                </div>

                {copy.explanation && (
                  <p className="mt-3 text-sm leading-relaxed text-[#94a3b8]">{copy.explanation}</p>
                )}

                <Link
                  href={PRICING.ctaHref}
                  className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,79,163,0.35)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
                >
                  {copy.cta}
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <p className="mt-3 text-center text-xs text-[#64748b]">{copy.cardNote}</p>

                <ul className="mt-7 space-y-3 border-t border-white/10 pt-6">
                  {PLAN_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#cbd5e1]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8a00]" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-6 text-center text-sm text-[#7c8596]">
                Questions about billing?{' '}
                <Link href="/faq" className="text-white underline-offset-4 hover:underline">
                  Read the FAQ&apos;s
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
