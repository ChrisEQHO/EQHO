import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowDown,
  ListMusic,
  ListOrdered,
  Repeat,
  Eye,
  Timer,
  CloudUpload,
  MonitorSmartphone,
  Play,
  SlidersHorizontal,
  Volume2,
  GripVertical,
  RefreshCw,
  ShieldCheck,
  Laptop,
  Tablet,
  Smartphone,
  WifiOff,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SessionControlsSnapshot, CloudSnapshot } from '@/components/marketing/feature-snapshots'
import { AppStoreButton } from '@/components/marketing/app-store-button'
import { ExploreScreenshot } from '@/components/marketing/explore-screenshot'
import { DemoCta } from '@/components/marketing/demo-cta'
import { DemoPlayerLazy } from '@/components/marketing/demo-player-lazy'
import { FreeUntilPill } from '@/components/marketing/free-until-pill'
import { SITE, CTA, FEATURES, APP, getOfferCopy } from '@/lib/marketing-config'

export const metadata: Metadata = {
  title: `The player — see everything ${SITE.name} does`,
  description:
    'A full tour of EQHO Player: build the running order, control the gap between routines, set repeats and back-to-back playback, back your sessions up to the cloud, and coach from any device.',
  alternates: { canonical: '/features' },
  openGraph: {
    type: 'website',
    url: `${SITE.url}/features`,
    siteName: SITE.name,
    title: `The player — see everything ${SITE.name} does`,
    description:
      'A full tour of EQHO Player: running order, timing, repeats, cloud backup and coaching from any device.',
  },
}

const ICONS: Record<string, LucideIcon> = {
  ListMusic,
  ListOrdered,
  Repeat,
  Eye,
  Timer,
  CloudUpload,
  MonitorSmartphone,
}

// The three panels of the real player, described with the controls you actually
// see in the app — playlists, the running order, and the now-playing panel.
const ANATOMY: { icon: LucideIcon; label: string; title: string; body: string; points: string[] }[] = [
  {
    icon: ListMusic,
    label: 'Playlists',
    title: 'Bring your routine music in one folder at a time.',
    body: 'Upload a folder of tracks and EQHO groups them into a named playlist. Keep a separate playlist per squad, level or competition and load the one you need.',
    points: ['Upload a whole folder at once', 'A playlist per squad, level or event', 'Add, load or clear playlists in a tap'],
  },
  {
    icon: ListOrdered,
    label: 'Running order',
    title: 'Lock the order your athletes go in.',
    body: 'Drag routines into the exact running order. Each row shows its duration and a remove button, and you can reset or clear the list whenever the session changes.',
    points: ['Drag to re-order the whole list', 'See every routine’s duration', 'Reset or clear in one tap'],
  },
  {
    icon: Play,
    label: 'Now playing',
    title: 'Run the session without having to manage the music.',
    body: 'Spend less time pressing play, pause and restarting tracks. Clear controls, a running timer and volume keep everything to hand, while a session overview totals your routines, running time, the gap between routines and the estimated session length.',
    points: ['Set it up, press play once and walk away', 'Use the session tools to adjust things as the routines run', 'Fine-tune gaps, repeats and back-to-back playback on the fly'],
  },
]

const CLOUD_POINTS = [
  { icon: CloudUpload, text: 'Push a playlist to save its audio and running order to your account.' },
  { icon: ShieldCheck, text: 'Once you push a playlist, it is stored securely and backed up on your account.' },
  { icon: RefreshCw, text: 'Build a session at home, then log in at training to download or load the playlist you pushed.' },
]

const DEVICE_POINTS = [
  { icon: Laptop, text: 'Use it in any web browser on desktop — nothing to install.' },
  { icon: Tablet, text: 'Coach from a tablet or laptop browser at the side of the training session.' },
  { icon: Smartphone, text: 'Download the free app for the best experience on iPad and iPhone.' },
  { icon: WifiOff, text: 'Load your session before you travel so it plays from your device.' },
]

// Genuine EQHO Player screenshots for the "Explore every part" tour. Each row
// alternates the screenshot and its bullet list on desktop / iPad landscape
// (lg:) and stacks the screenshot above the list on mobile / iPad portrait.
type ExploreSection = {
  label: string
  heading: string
  image: { src: string; alt: string; width: number; height: number }
  points?: string[]
  groups?: { label: string; items: string[] }[]
  reverse?: boolean
}

const EXPLORE_SECTIONS: ExploreSection[] = [
  {
    label: 'Playlists',
    heading: 'Organise your playlists',
    image: {
      src: '/marketing/explore-library.png',
      alt: 'EQHO Player library screen showing five local playlists — Training Playlist, Test Playlist, MIAC music, New Musics and Fig Group — each with a track count, duration, a synced status and a Send to Session button, above a drop zone for adding a playlist folder.',
      width: 2048,
      height: 1017,
    },
    points: [
      'Add a complete folder of routine music as a playlist.',
      'Create separate playlists for squads, levels or competitions.',
      'See track totals, playlist durations and synchronisation status.',
      'Review and remove individual tracks.',
      'Send any playlist directly into the session running order.',
      'Keep locally downloaded playlists ready on the device.',
    ],
  },
  {
    label: 'EQHO Cloud',
    heading: 'Back up and move your music',
    image: {
      src: '/marketing/explore-cloud.png',
      alt: 'EQHO Cloud screen with Upload to Cloud, Download from Cloud, Download Playlists and Push to Apps options for backing up and moving playlists between devices.',
      width: 2048,
      height: 1048,
    },
    points: [
      'Push playlists and audio to secure EQHO Cloud storage.',
      'Restore pushed playlists on another supported device.',
      'Download playlists for local backup and competition preparation.',
      'Push updated playlists to connected EQHO applications.',
      'Keep cloud and device copies under the same EQHO account.',
      'Use signed access URLs to help protect stored audio.',
    ],
    reverse: true,
  },
  {
    label: 'Settings',
    heading: 'Set the player up your way',
    image: {
      src: '/marketing/explore-settings.png',
      alt: 'EQHO Player settings screen with Subscription, Playback, Session Controls, Coach Display, Countdown Timer Sound, Warnings, EQHO Cloud, Account and Danger Zone panels.',
      width: 2048,
      height: 1078,
    },
    groups: [
      {
        label: 'Plan & playback',
        items: [
          'View the current plan and subscription status.',
          'Choose the default playback volume.',
          'Turn automatic next-track playback on or off.',
        ],
      },
      {
        label: 'Session timing',
        items: [
          'Set the default gap between routines.',
          'Choose the default number of playlist repeats.',
          'Enable or disable back-to-back playback.',
        ],
      },
      {
        label: 'Coaching cues',
        items: [
          'Show a countdown before each routine.',
          'Choose and preview the countdown sound.',
          'Turn pause and skip-track safety warnings on or off.',
        ],
      },
      {
        label: 'Backup & account',
        items: [
          'Download a local playlist backup.',
          'Push playlists to supported apps.',
          'Change the account password or sign out securely.',
          'Permanently delete the account and associated data.',
        ],
      },
    ],
  },
]

function PrimaryCta({ className = '', label }: { className?: string; label?: string }) {
  return (
    <Link
      href={CTA.primary.href}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,79,163,0.35)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${className}`}
    >
      {label ?? CTA.primary.label}
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </Link>
  )
}

export default function FeaturesPage() {
  // Shared, date-driven offer state — the SAME source the homepage, header,
  // pricing and signup use, so every trial button flips together at changeover.
  const offer = getOfferCopy()
  return (
    <>
      <SiteHeader />
      <main className="bg-[#020617] text-white">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(80%_60%_at_50%_-10%,rgba(255,138,0,0.15),transparent_60%)]"
          />
          <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Try EQHO Player
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
                Explore a ready-made training session and see how the player works. No account needed.
              </p>
              <div className="mt-8 flex justify-center">
                <DemoCta
                  offerCta={offer.cta}
                  offerCardNote={offer.cardNote}
                  demoLabel="Start the demo"
                  demoHref="#interactive-demo"
                  demoSamePage
                  showSecondary={false}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Interactive demo ─────────────────────────────────────────────
              The public, isolated demo player is embedded INLINE here (no launch
              card, no overlay). It is lazy-loaded (code-split) and reads exclusively
              from the read-only /api/demo endpoint — no auth, Stripe, cloud sync or
              private player code is involved. It mounts the real shared
              <EqhoPlayer demoMode presentation="embedded" />; there is no
              static-image fallback. Loading, empty and error (with Retry) states are
              handled inside the player against /api/demo, so production always gets
              the real interactive player. The indicator button below scrolls the
              visitor to the already-visible player. A date-driven "Create free
              account" CTA sits further down. */}
        <section id="interactive-demo" className="scroll-mt-24 border-t border-white/5">
          <div className="w-full py-16">
            {/* 1–4: label, heading, explanatory text, demo indicator button */}
            <div className="mx-auto mb-10 max-w-2xl px-4 text-center sm:px-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">
                Live interactive demo
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Try the real EQHO Player
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-[#94a3b8]">
                This is a working demonstration of the real EQHO Player. Experiment with the
                playlists, reorder tracks, adjust the session controls and play the routines to see
                how everything works. Nothing you do here will be saved, so feel free to try every
                feature.
              </p>
              <div className="mt-8 flex justify-center">
                <a
                  href="#eqho-embedded-player"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-8 text-base font-bold text-white shadow-[0_0_30px_rgba(255,79,163,0.35)] transition hover:opacity-95"
                >
                  Try the demo below
                  <ArrowDown size={20} aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* 5: the large, genuine embedded player (always visible below) */}
            <DemoPlayerLazy />

            {/* Directly beneath the demo: a branded free-offer CTA. Uses the
                site's pink→orange gradient for the primary "Create free account"
                button and the blue→cyan→green FreeUntilPill to make the
                free-until-1-October offer unmistakable. Copy is driven by the
                shared date-aware offer, so it flips automatically at launch. */}
            <div className="mx-auto mt-12 max-w-2xl px-4 text-center sm:px-6">
              <h3 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                Liked the demo? It&apos;s free until 1 October 2026.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-[#94a3b8]">
                Create your free account today and use every EQHO Player feature — build your own
                playlists, save them to the cloud and coach live sessions. No card required.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <PrimaryCta className="w-full sm:w-auto" label={offer.cta} />
                <FreeUntilPill className="w-full sm:w-auto" />
              </div>
              <p className="mt-4 text-sm text-[#94a3b8]">{offer.cardNote}</p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl px-4 text-center sm:px-6">
              <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to set up your own sessions?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-[#94a3b8]">
                The demo resets each time and doesn’t save. Create a free account to build your own
                playlists, push them to the cloud and use them in your training sessions.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <PrimaryCta className="w-full sm:w-auto" label={offer.cta} />
                <Link
                  href="/how-it-works"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/15 px-7 text-base font-semibold text-white transition-colors hover:bg-white/5 sm:w-auto"
                >
                  See how it works
                </Link>
              </div>
              <p className="mt-4 text-sm text-[#94a3b8]">{offer.cardNote}</p>
            </div>
          </div>
        </section>

        {/* ── Anatomy of the player ────────────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#050814]">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">The interface</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Three panels, the whole session.
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                Playlists on the left, the running order in the middle, and the now-playing controls with a
                live session overview on the right.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {ANATOMY.map((panel) => {
                const Icon = panel.icon
                return (
                  <div
                    key={panel.label}
                    className="flex flex-col rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-6"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/15 ring-1 ring-white/10">
                      <Icon className="h-5 w-5 text-[#ff8a00]" aria-hidden="true" />
                    </span>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#ff8ac0]">
                      {panel.label}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{panel.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{panel.body}</p>
                    <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
                      {panel.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-sm text-[#cbd5e1]">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8a00]" aria-hidden="true" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Explore every part (genuine screenshots) ─────────────────── */}
        <section className="relative overflow-hidden border-t border-white/5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(255,138,0,0.10),transparent_65%)]"
          />
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">A closer look</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Explore every part of EQHO Player
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                From organising routine music to setting up playback and backing up playlists, EQHO Player
                gives coaches the tools they need to prepare sessions and keep training moving.
              </p>
            </div>

            <div className="mt-16 flex flex-col gap-20">
              {EXPLORE_SECTIONS.map((section) => (
                <div
                  key={section.heading}
                  className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12"
                >
                  {/* Screenshot — first in the DOM so it sits ABOVE the list when
                      stacked on mobile / iPad portrait; re-ordered on lg screens
                      to alternate sides. */}
                  <div className={section.reverse ? 'lg:order-2' : 'lg:order-1'}>
                    <ExploreScreenshot
                      src={section.image.src}
                      alt={section.image.alt}
                      width={section.image.width}
                      height={section.image.height}
                    />
                  </div>

                  <div className={section.reverse ? 'lg:order-1' : 'lg:order-2'}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#ff8ac0]">
                      {section.label}
                    </p>
                    <h3 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                      {section.heading}
                    </h3>

                    {section.points && (
                      <ul className="mt-6 space-y-3">
                        {section.points.map((point) => (
                          <li key={point} className="flex items-start gap-3 text-[15px] leading-relaxed text-[#cbd5e1]">
                            <Check className="mt-1 h-4 w-4 shrink-0 text-[#ff8a00]" aria-hidden="true" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.groups && (
                      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                        {section.groups.map((group) => (
                          <div key={group.label}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#ff8ac0]/80">
                              {group.label}
                            </p>
                            <ul className="mt-3 space-y-2.5">
                              {group.items.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#cbd5e1]">
                                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8a00]" aria-hidden="true" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Session controls callout ─────────────────────────────────── */}
        <section className="border-t border-white/5">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">Session controls</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Set the timing once and let it run.
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                Choose the gap between routines, set how many times a routine repeats and switch on
                back-to-back playback. EQHO keeps the session moving so you can stay focused on coaching.
              </p>
              <div className="mt-8">
                <PrimaryCta label={offer.cta} />
              </div>
            </div>
            <div className="space-y-4">
              <SessionControlsSnapshot />
              <div className="grid grid-cols-2 gap-4">
                <ControlTile icon={<Timer className="h-5 w-5 text-[#ff8a00]" />} title="Gap between routines" body="Give athletes a set number of seconds before the next track." />
                <ControlTile icon={<Repeat className="h-5 w-5 text-[#ff8a00]" />} title="Repeats" body="Run a routine as many times as the session needs." />
                <ControlTile icon={<SlidersHorizontal className="h-5 w-5 text-[#ff8a00]" />} title="Back-to-back" body="Flow from one routine straight into the next." />
                <ControlTile icon={<Volume2 className="h-5 w-5 text-[#ff8a00]" />} title="Volume & scrub" body="Adjust volume and scrub the waveform from the panel." />
              </div>
            </div>
          </div>
        </section>

        {/* ── Full-screen session view ─────────────────────────────────── */}
        <section className="relative overflow-hidden border-t border-white/5 bg-[#050814]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(255,79,163,0.12),transparent_65%)]"
          />
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">Session mode</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Press play and the whole room can read the clock.
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                Start the session and EQHO switches to a full-screen view — a giant countdown of the time
                remaining, the current round, the track that is playing and the running order down the side.
              </p>
            </div>

            <figure className="mx-auto mt-12 max-w-5xl">
              {/* Gradient hairline that fades toward the bottom so the frame
                  reads as part of the page rather than a hard card. */}
              <div className="relative rounded-2xl bg-gradient-to-b from-white/12 to-transparent p-px shadow-[0_50px_140px_-50px_rgba(255,79,163,0.4)]">
                <div className="relative overflow-hidden rounded-2xl bg-[#050814]">
                  <Image
                    src="/marketing/player-fullscreen.png"
                    alt="EQHO Player full-screen session view showing 1 hour 55 minutes remaining, Round 1 of 4, the current routine and the running order"
                    width={2982}
                    height={1864}
                    sizes="(min-width: 1024px) 1024px, 100vw"
                    className="h-auto w-full"
                  />
                  {/* Feather the bottom edge into the section background */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#050814]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5"
                  />
                </div>
              </div>
              <figcaption className="mt-4 text-center text-sm text-[#64748b]">
                Full-screen session view — session remaining, rounds and the live running order.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── Cloud storage ────────────────────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#050814]">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div className="order-2 space-y-5 lg:order-1">
              <CloudSnapshot />
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {CLOUD_POINTS.map(({ icon: Icon, text }) => (
                  <li
                    key={text}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-4"
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                      <Icon className="h-4 w-4 text-[#ff8ac0]" aria-hidden="true" />
                    </span>
                    <span className="text-sm leading-relaxed text-[#cbd5e1]">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">Cloud storage</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Your sessions, saved and backed up.
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                When you push a playlist to EQHO Cloud, its audio and running order are securely saved to
                your account. Log in on another supported device and download or load the pushed playlist
                before training or travelling to a competition.
              </p>
            </div>
          </div>
        </section>

        {/* ── Push to devices ─────��─────────────────────────��──────────── */}
        <section className="border-t border-white/5">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">Any device</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Build at home. Coach at the venue.
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                EQHO Player runs in any web browser on desktop, tablet and mobile. Prepare a session on your
                laptop and push it to EQHO Cloud, then log in on a tablet or phone at training and download or
                load the pushed playlist — it is the same account everywhere you log in. For the best
                experience on iPad and iPhone, download the free app from the App Store.
              </p>
              <div className="mt-6 flex flex-col items-start gap-2">
                <AppStoreButton />
                <span className="text-sm text-[#7c8596]">{APP.bestOn}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DEVICE_POINTS.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-5"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/15 ring-1 ring-white/10">
                    <Icon className="h-5 w-5 text-[#ff8a00]" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-[#cbd5e1]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Full feature grid ────────────────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#050814]">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">Everything included</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                The full feature set.
              </h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => {
                const Icon = ICONS[f.icon] ?? ListMusic
                return (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-6 transition-colors hover:border-white/20"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/15 ring-1 ring-white/10">
                      <Icon className="h-5 w-5 text-[#ff8a00]" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{f.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="border-t border-white/5">
          <div className="mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6">
            <h2 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              Try the whole player for yourself.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
              Create an account and build your first session in around 30 seconds. {offer.cardNote}
            </p>
            <div className="mt-8 flex justify-center">
              <PrimaryCta label={offer.cta} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

function ControlTile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/15 ring-1 ring-white/10">
        {icon}
      </span>
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-[#94a3b8]">{body}</p>
    </div>
  )
}
