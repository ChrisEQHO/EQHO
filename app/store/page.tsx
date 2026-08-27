import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Music4 } from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { TrackCard } from '@/components/store/track-card'
import { JoinEqhoSection } from '@/components/store/join-eqho-section'
import { getTracksGroupedByCategory } from '@/lib/store/catalog'
import { isStoreEnabled } from '@/lib/store/flags'
import { SITE, CTA } from '@/lib/marketing-config'

// Store is hidden pre-launch: keep it out of search indexes while disabled.
export const metadata: Metadata = {
  title: `Music store — competition tracks | ${SITE.name}`,
  description:
    'Browse and preview competition music for gymnastics coaches and clubs. Included with an EQHO subscription, or buy individual tracks.',
  alternates: { canonical: '/store' },
  robots: { index: false, follow: false },
}

// Catalogue is DB-backed and changes with admin edits, so render dynamically.
export const dynamic = 'force-dynamic'

export default async function StorePage() {
  // Marketplace is hidden pre-launch. Old/bookmarked /store links go to the homepage.
  if (!isStoreEnabled()) {
    redirect('/')
  }

  const groups = await getTracksGroupedByCategory()
  const isEmpty = groups.length === 0

  return (
    <div className="flex min-h-screen flex-col bg-[#020617]">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(76,29,149,0.35)_0%,rgba(2,6,23,0)_70%)]"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff8a00]/40 bg-gradient-to-r from-[#ff4fa3]/15 to-[#ff8a00]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#ffb673]">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]" />
              EQHO Music
            </span>
            <h1 className="mt-4 max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Competition-ready music. Find the track that fits.
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-[#94a3b8] sm:text-lg">
              Browse, preview and listen to music created for competition. When you find the right
              track, purchase and download your clean competition master.
            </p>

            <div className="mt-6 flex flex-col gap-1">
              <p className="text-sm font-semibold uppercase tracking-wider text-white">
                From £19.99 per track
              </p>
              <p className="text-sm text-[#94a3b8]">
                EQHO customers get tracks from just{' '}
                <span className="font-semibold text-[#ffb673]">£9.99 each</span>.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#catalogue"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
              >
                Browse competition music
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 text-base font-semibold text-white transition-colors hover:bg-white/5"
              >
                Join EQHO and save
              </Link>
            </div>
          </div>
        </section>

        {/* Catalogue */}
        <section
          id="catalogue"
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6 lg:py-16"
        >
          {isEmpty ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-14">
              {groups.map((group) => (
                <div key={group.category?.id ?? 'uncategorized'}>
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white sm:text-2xl">
                        {group.category?.name ?? 'More tracks'}
                      </h2>
                      {group.category?.description ? (
                        <p className="mt-1 max-w-2xl text-sm text-[#94a3b8]">
                          {group.category.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm text-[#7c8596]">
                      {group.tracks.length} {group.tracks.length === 1 ? 'track' : 'tracks'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.tracks.map((track) => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Membership value proposition */}
        <JoinEqhoSection />
      </main>

      <SiteFooter />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#aeb9d4]">
        <Music4 className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-white">The store is opening soon</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">
        We&apos;re adding competition tracks now. In the meantime, you can start building sessions in
        the player.
      </p>
      <Link
        href={CTA.openApp.href}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
      >
        Open EQHO
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
