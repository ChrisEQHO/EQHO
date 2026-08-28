import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { ProductFrame } from '@/components/marketing/product-frame'
import { DemoCta } from '@/components/marketing/demo-cta'
import { SITE, STEPS, getOfferCopy } from '@/lib/marketing-config'

export const metadata: Metadata = {
  title: `How it works — ${SITE.name}`,
  description:
    'How EQHO Player works: prepare the running order before training, choose your session controls, push sessions to EQHO Cloud and load them on your devices before you coach.',
  alternates: { canonical: '/how-it-works' },
  openGraph: {
    type: 'website',
    url: `${SITE.url}/how-it-works`,
    siteName: SITE.name,
    title: `How it works — ${SITE.name}`,
    description:
      'Prepare the running order, choose your session controls and let EQHO handle the music while you coach.',
  },
}

export default function HowItWorksPage() {
  const offer = getOfferCopy()

  return (
    <>
      <SiteHeader />
      <main className="bg-[#020617] text-white">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(70%_60%_at_50%_-10%,rgba(255,79,163,0.16),transparent_60%)]"
          />
          <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                How EQHO Player works
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
                Prepare the running order before training, choose your session controls and let EQHO handle
                the music while you coach.
              </p>
            </div>
            <div className="mx-auto mt-14 max-w-5xl">
              <ProductFrame />
            </div>
          </div>
        </section>

        {/* ── Steps ────────────────────────────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#050814]">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
            <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-6"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-white">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── CTA: The Player + account creation ───────────────────────── */}
        <section className="border-t border-white/5">
          <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to set up your first session?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
              Explore the player or create your account and build a session in around 30 seconds.
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
