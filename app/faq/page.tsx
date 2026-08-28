import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { DemoCta } from '@/components/marketing/demo-cta'
import { SITE, getFaq, getOfferCopy } from '@/lib/marketing-config'

export const metadata: Metadata = {
  title: `FAQ's — ${SITE.name}`,
  description:
    'Answers to common questions about EQHO Player: pricing and the 30-day free trial, offline use, manual cloud upload, supported devices and cancelling.',
  alternates: { canonical: '/faq' },
  openGraph: {
    type: 'website',
    url: `${SITE.url}/faq`,
    siteName: SITE.name,
    title: `FAQ's — ${SITE.name}`,
    description: 'Common questions about EQHO Player, answered.',
  },
}

export default function FaqPage() {
  const faq = getFaq()
  const offer = getOfferCopy()

  // FAQPage structured data, moved here from the homepage so it lives on the
  // page that actually shows the questions. Built from the same config as the
  // visible list, so schema and on-page content never drift.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="bg-[#020617] text-white">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(70%_60%_at_50%_-10%,rgba(255,79,163,0.16),transparent_60%)]"
          />
          <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-14 text-center sm:px-6 sm:pt-20">
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Frequently asked questions
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
              Everything you need to know about pricing, offline use and getting set up.
            </p>
          </div>
        </section>

        {/* ── Questions ────────────────────────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#050814]">
          <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
            <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)]">
              {faq.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-white transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff4fa3]/60 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Plus
                      className="h-5 w-5 shrink-0 text-[#ff8a00] transition-transform duration-200 group-open:rotate-45"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="px-6 pb-5 text-pretty text-sm leading-relaxed text-[#94a3b8]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="border-t border-white/5">
          <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Still have a question?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
              Try the player for yourself, or start your 30-day free trial.
            </p>
            <div className="mt-8 flex justify-center">
              <DemoCta offerCta={offer.cta} offerCardNote={offer.cardNote} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
