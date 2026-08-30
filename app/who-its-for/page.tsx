import type { Metadata } from 'next'
import Image from 'next/image'
import {
  Medal,
  Megaphone,
  Music2,
  Laptop,
  Cloud,
  WifiOff,
  ListOrdered,
  GripVertical,
  Timer,
  Repeat,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { DemoCta } from '@/components/marketing/demo-cta'
import { SITE, WHO_ITS_FOR, getOfferCopy } from '@/lib/marketing-config'

const ICONS: Record<string, LucideIcon> = { Medal, Megaphone }

export const metadata: Metadata = {
  title: `Who it’s for — ${SITE.name}`,
  description:
    'Why EQHO Player exists and who it’s built for: gymnastics coaches and clubs who need routine music managed on a computer, pushed to every device through the cloud, and played offline through a session-first player.',
  alternates: { canonical: '/who-its-for' },
  openGraph: {
    type: 'website',
    url: `${SITE.url}/who-its-for`,
    siteName: SITE.name,
    title: `Who it’s for — ${SITE.name}`,
    description:
      'Built for gymnastics coaches and clubs — manage music on a computer, sync it everywhere through the cloud, and run the session offline.',
  },
}

/** The everyday pain points EQHO Player exists to remove. */
const PAIN_POINTS = [
  'Hunting for each routine’s music on a phone or tablet mid-session is slow and stressful.',
  'Relying on the internet — or playing straight from emails — means a dropout can stop the floor.',
  'Opening different files across phones and tablets is a hassle when floor time is tight.',
  'Changing or editing one track means re-uploading to the device — usually by plugging into a computer or emailing the file to download again.',
] as const

/** The in-session player capabilities, several unique to EQHO. */
const PLAYER_FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ListOrdered,
    title: 'Set the number of routines',
    body: 'Decide how many routines the session should run and the player builds the running order around them.',
  },
  {
    icon: Timer,
    title: 'Choose the gap between routines',
    body: 'Set how long a gap you want between each routine so gymnasts have a consistent, predictable reset.',
  },
  {
    icon: Repeat,
    title: 'Back-to-back session mode',
    body: 'Run routines continuously with a feature that doesn’t exist anywhere else — no touching the device between them.',
  },
  {
    icon: GripVertical,
    title: 'Drag to change the running order',
    body: 'The running order is clearly displayed, and you reorder the whole session just by dragging tracks.',
  },
]

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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff8a00]">
              Who it’s for &amp; why it exists
            </p>
            <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Set the music once. Let the coaching take priority.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
              EQHO Player is built for the people who run training floors — coaches and clubs who need
              routine music organised, synced to every device, and ready to play throughout the
              session without fighting their phone.
            </p>
          </div>
        </section>

        {/* ── Why it exists ────────────────────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#050814]">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Why EQHO Player exists
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                Finding music on a tablet or phone to play one routine at a time isn’t time-efficient
                — it’s a pain. EQHO Player was built to take that hassle off the floor.
              </p>
            </div>
            <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              {PAIN_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00]"
                  />
                  <p className="text-sm leading-relaxed text-[#cbd5e1]">{point}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Two sides ────────────────────────────────────────────────── */}
        <section className="border-t border-white/5">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Two sides that work together
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                One side manages the music. The other runs the session. The cloud keeps them in sync.
              </p>
            </div>

            {/* Side 1 — Music management */}
            <div className="mt-14 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(9,15,28,0.9)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#ff8a00]">
                  <Laptop className="h-4 w-4" aria-hidden="true" />
                  Side one · Music management
                </span>
                <h3 className="mt-4 text-2xl font-bold tracking-tight">
                  Build playlists on a computer — sync them everywhere
                </h3>
                <p className="mt-3 text-pretty leading-relaxed text-[#94a3b8]">
                  Create playlists on a computer and upload them directly to the player. Push them to
                  your other devices through the cloud, so the running order and audio are the same on
                  every screen — no plugging in, no emailing files to yourself.
                </p>
                <ul className="mt-5 space-y-3">
                  <li className="flex gap-3 text-sm leading-relaxed text-[#cbd5e1]">
                    <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-[#ff8a00]" aria-hidden="true" />
                    Upload playlists straight from your computer and push them to every logged-in
                    device.
                  </li>
                  <li className="flex gap-3 text-sm leading-relaxed text-[#cbd5e1]">
                    <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-[#ff8a00]" aria-hidden="true" />
                    Once a playlist is pushed to the cloud, download it on your device and take the
                    music offline.
                  </li>
                  <li className="flex gap-3 text-sm leading-relaxed text-[#cbd5e1]">
                    <Music2 className="mt-0.5 h-5 w-5 shrink-0 text-[#ff8a00]" aria-hidden="true" />
                    Change or edit a track once — the update syncs out instead of a device-by-device
                    re-upload.
                  </li>
                </ul>
              </div>
              <div className="order-1 grid gap-4 lg:order-2">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40">
                  <Image
                    src="/marketing/explore-library.png"
                    alt="EQHO Library showing routine playlists organised into folders, each marked as synced with a Send to Session button."
                    width={1568}
                    height={840}
                    className="h-auto w-full"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40">
                  <Image
                    src="/marketing/explore-cloud.png"
                    alt="EQHO Cloud panel with Upload to Cloud, Download from Cloud and Push to Apps actions for syncing playlists across devices."
                    width={1568}
                    height={773}
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </div>

            {/* Side 2 — In-session player */}
            <div className="mt-16 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40">
                  <Image
                    src="/marketing/player-hero.png"
                    alt="EQHO Player dashboard showing the Up Next running order with numbered routines and per-track durations."
                    width={1568}
                    height={882}
                    className="h-auto w-full"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40">
                  <Image
                    src="/marketing/player-fullscreen.png"
                    alt="EQHO Player full-screen coach mode showing the countdown to the next track and the routine name."
                    width={1568}
                    height={980}
                    className="h-auto w-full"
                  />
                </div>
              </div>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(9,15,28,0.9)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#ff8a00]">
                  <ListOrdered className="h-4 w-4" aria-hidden="true" />
                  Side two · The player in training
                </span>
                <h3 className="mt-4 text-2xl font-bold tracking-tight">
                  Run the session hands-free while you coach
                </h3>
                <p className="mt-3 text-pretty leading-relaxed text-[#94a3b8]">
                  With the music offline and the running order set, the session runs itself. Play the
                  music straight through your training without being connected to the internet, and
                  watch the session progress as routines are completed.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {PLAYER_FEATURES.map((f) => {
                    const Icon = f.icon
                    return (
                      <div
                        key={f.title}
                        className="rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-4"
                      >
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/15 ring-1 ring-white/10">
                          <Icon className="h-4 w-4 text-[#ff8a00]" aria-hidden="true" />
                        </span>
                        <h4 className="mt-3 text-sm font-semibold text-white">{f.title}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-[#94a3b8]">{f.body}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-5 flex gap-3 rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-4 text-sm leading-relaxed text-[#cbd5e1]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#ff8a00]" aria-hidden="true" />
                  See how many routines have been completed as the session goes, so you always know
                  exactly where the floor is up to.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── People ───────────────────────────────────────────────────── */}
        <section className="border-t border-white/5 bg-[#050814]">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Who it’s built for
              </h2>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                    <h3 className="mt-4 text-lg font-semibold text-white">{p.title}</h3>
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
