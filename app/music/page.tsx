import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { CreatorInterestForm } from '@/components/music/creator-interest-form'
import { MusicViewedBeacon } from '@/components/music/music-viewed-beacon'
import { SITE } from '@/lib/marketing-config'

export const metadata: Metadata = {
  title: `Music — ${SITE.name}`,
  description:
    'EQHO Music is coming: a curated catalogue of tracks built for gymnastics routines, ready to drop straight into the EQHO Player. Creators can register their interest now.',
  alternates: { canonical: '/music' },
  openGraph: {
    type: 'website',
    url: `${SITE.url}/music`,
    siteName: SITE.name,
    title: `Music — ${SITE.name}`,
    description:
      'A curated catalogue of tracks built for gymnastics routines, coming to the EQHO Player. Creators can register their interest now.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Music — ${SITE.name}`,
    description:
      'A curated catalogue of tracks built for gymnastics routines, coming to the EQHO Player.',
  },
}

const COACH_POINTS = [
  {
    title: 'Made for routines',
    body: 'Tracks arranged for floor and rhythmic routines — the right length, energy, and structure, not generic stock loops.',
  },
  {
    title: 'Cleared for competition',
    body: 'Every track will come with the licence you need to use it in training and competition with confidence.',
  },
  {
    title: 'One tap into the Player',
    body: 'Find a track, add it to a routine, and it is ready in the EQHO Player you already use — no exporting, no faff.',
  },
]

const CREATOR_POINTS = [
  'Reach coaches and gymnasts who need routine-ready music every season.',
  'Keep your rights — you decide what you list and licence.',
  'Get paid fairly for tracks that find a real, repeat audience.',
]

export default function MusicComingSoonPage() {
  return (
    <>
      <MusicViewedBeacon />
      <SiteHeader />
      <main className="bg-[#020617] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(70%_60%_at_50%_-10%,rgba(255,79,163,0.18),transparent_60%)]"
          />
          <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pt-20">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff8a00]/30 bg-[#ff8a00]/10 px-4 py-1.5 text-xs font-semibold text-[#ffb673]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a00]" />
                Coming soon
              </span>
              <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
                Routine-ready music,{' '}
                <span className="bg-[linear-gradient(135deg,#ff4fa3,#ff8a00)] bg-clip-text text-transparent">
                  built into EQHO
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-[#94a3b8] sm:text-lg">
                We&apos;re building a curated catalogue of tracks made for
                gymnastics routines — cleared for competition and ready to drop
                straight into the EQHO Player. It&apos;s on the way.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="#creators"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff4fa3,#ff8a00)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,79,163,0.6)] transition hover:scale-[1.02]"
                >
                  I make music — register interest
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                >
                  Explore the player
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What it will be — for coaches & gymnasts */}
        <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              For coaches &amp; gymnasts
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-[#94a3b8] sm:text-base">
              The same focus that shaped the EQHO Player, now applied to the
              music itself.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {COACH_POINTS.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <h3 className="text-base font-semibold text-white">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* For creators — enquiry form */}
        <section
          id="creators"
          className="relative scroll-mt-24 overflow-hidden border-t border-white/10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[360px] bg-[radial-gradient(60%_60%_at_50%_110%,rgba(255,138,0,0.14),transparent_60%)]"
          />
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-start">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff4fa3]/30 bg-[#ff4fa3]/10 px-4 py-1.5 text-xs font-semibold text-[#ff9ecb]">
                For music creators
              </span>
              <h2 className="mt-5 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                Make music for gymnasts? We&apos;d love to hear from you.
              </h2>
              <p className="mt-4 text-pretty text-sm leading-relaxed text-[#94a3b8] sm:text-base">
                We&apos;re inviting composers and producers to help build the EQHO
                Music catalogue. Register your interest and we&apos;ll be in touch
                as the creator programme opens.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {CREATOR_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[linear-gradient(135deg,#ff4fa3,#ff8a00)]"
                    />
                    <span className="text-sm leading-relaxed text-[#cbd5e1]">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <CreatorInterestForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
