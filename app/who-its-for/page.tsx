import type { Metadata } from 'next'
import { Medal, Megaphone, Music2, type LucideIcon } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { DemoCta } from '@/components/marketing/demo-cta'
import { SITE, WHO_ITS_FOR, getOfferCopy } from '@/lib/marketing-config'

const ICONS: Record<string, LucideIcon> = { Medal, Megaphone }

export const metadata: Metadata = {
  title: `Who it’s for — ${SITE.name}`,
  description:
    'EQHO Player is built for gymnastics coaches and clubs — across Floor and Vault, Women’s Artistic, Acrobatic, Aerobic and Rhythmic Gymnastics.',
  alternates: { canonical: '/who-its-for' },
  openGraph: {
    type: 'website',
    url: `${SITE.url}/who-its-for`,
    siteName: SITE.name,
    title: `Who it’s for — ${SITE.name}`,
    description:
      'Built for gymnastics coaches and clubs across every discipline EQHO supports.',
  },
}

export default function WhoItsForPage() {
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
          <div className="mx-auto w-full max-w-4xl px-4 pb-4 pt-14 text-center sm:px-6 sm:pt-20">
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Made for gymnastics coaching
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
              EQHO Player is built for the people who run training floors — coaches and clubs who need
              routine music organised and ready throughout the session.
            </p>
          </div>
        </section>

        {/* ── People ───────────────────────────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#050814]">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {WHO_ITS_FOR.people.map((p) => {
                const Icon = ICONS[p.icon] ?? Medal
                return (
                  <div
                    key={p.title}
                    className="rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-6"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/15 ring-1 ring-white/10">
                      <Icon className="h-5 w-5 text-[#ff8a00]" aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-lg font-semibold text-white">{p.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{p.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Disciplines ──────────────────────────────────────────────── */}
        <section className="border-t border-white/5">
          <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6">
            <div className="text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Every discipline we support
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
                Built for routine-based gymnastics where the music has to follow the running order.
              </p>
            </div>
            <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-3">
              {WHO_ITS_FOR.disciplines.map((d) => (
                <li
                  key={d}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(9,15,28,0.9)] px-4 py-2 text-sm font-medium text-[#e2e8f0]"
                >
                  <Music2 className="h-4 w-4 text-[#ff8a00]" aria-hidden="true" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#050814]">
          <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Bring EQHO Player to your floor
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
              Try the player or start your 30-day free trial and run your next session with the music
              already sorted.
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
