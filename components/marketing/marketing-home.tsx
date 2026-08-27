import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ListMusic,
  ListOrdered,
  Repeat,
  Eye,
  Timer,
  CloudUpload,
  MonitorSmartphone,
  Medal,
  Music2,
  Megaphone,
  Check,
  SlidersHorizontal,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import { ProductFrame } from '@/components/marketing/product-frame'
import { AppStoreButton } from '@/components/marketing/app-store-button'
import {
  SITE,
  LAUNCH,
  CTA,
  PROBLEM,
  FEATURES,
  STEPS,
  AUDIENCES,
  FAQ,
  APP,
} from '@/lib/marketing-config'

// Resolve config icon names to lucide components (keeps the config JSX-free).
const ICONS: Record<string, LucideIcon> = {
  ListMusic,
  ListOrdered,
  Repeat,
  Eye,
  Timer,
  CloudUpload,
  MonitorSmartphone,
  Medal,
  Music2,
  Megaphone,
}

// Two feature panels shown before the player preview — one for running a
// session, one for EQHO Cloud. Each carries its own accent gradient.
const HERO_PANELS: {
  icon: LucideIcon
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  gradient: string
  glow: string
  ring: string
}[] = [
  {
    icon: SlidersHorizontal,
    eyebrow: 'During training',
    title: 'Run smoother training sessions',
    body: 'Build your playlists, arrange the running order, set the gaps and repeats, then press play. EQHO Player keeps every routine organised with simple session controls and a clear full-screen view, reducing interruptions so you can focus on coaching.',
    bullets: [
      'Organised playlists and running orders',
      'Adjustable gaps, repeats and playback controls',
      'Clear full-screen timing for the whole floor',
    ],
    gradient: 'from-[#ff4fa3] to-[#ff8a00]',
    glow: 'rgba(255,79,163,0.6)',
    ring: 'hover:border-[#ff8a00]/40',
  },
  {
    icon: CloudUpload,
    eyebrow: 'EQHO Cloud',
    title: 'Keep your music ready across devices',
    body: 'Push your playlists and audio to your EQHO Cloud account to keep them securely saved and backed up. Log in from any web browser on desktop, tablet or mobile — or download the app on iPad and iPhone — to access the same music everywhere.',
    bullets: [
      'Secure cloud storage and backup',
      'Web browser on desktop, tablet and mobile',
      'Free app on iPad and iPhone for the best experience',
    ],
    gradient: 'from-[#8b5cf6] to-[#3b82f6]',
    glow: 'rgba(99,102,241,0.6)',
    ring: 'hover:border-[#3b82f6]/40',
  },
]

function PrimaryCta({ className = '' }: { className?: string }) {
  return (
    <Link
      href={CTA.primary.href}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,79,163,0.35)] transition-transform hover:scale-[1.03] ${className}`}
    >
      {CTA.primary.label}
      <ArrowRight className="h-5 w-5" />
    </Link>
  )
}

export function MarketingHome() {
  return (
    <main className="bg-[#020617] text-white">
      {/* ── Hero — fills exactly one screen beneath the sticky nav ────────── */}
      <section className="relative isolate flex min-h-[calc(100svh-var(--header-height))] flex-col overflow-hidden">
        {/* z-0 — navy base colour */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-[#020617]" />

        {/* z-1 — animated ambient brand glow. Deep indigo + electric blue lead,
            with violet/pink only as subtle highlights. Motion is slow (19–26s),
            low opacity, transform/opacity only, and freezes under reduced-motion. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <div className="eqho-glow-a absolute left-[-12%] top-[-10%] h-[70vh] w-[55vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.95),transparent_70%)] blur-[90px]" />
          <div className="eqho-glow-b absolute right-[-14%] top-[4%] h-[66vh] w-[55vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(29,78,216,0.9),transparent_70%)] blur-[100px]" />
          <div className="eqho-glow-c absolute bottom-[-16%] left-[28%] h-[60vh] w-[52vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.55),rgba(255,79,163,0.35)_45%,transparent_72%)] blur-[100px]" />
        </div>

        {/* z-2 — the real player screenshot, sat below + behind the copy.
            Opacity is applied only to the image; no blur on desktop; aspect
            ratio preserved via object-contain; edges masked; lower edge faded. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center">
          <Image
            src="/marketing/hero-backdrop.png"
            alt=""
            aria-hidden="true"
            width={2940}
            height={1628}
            priority
            className="h-auto w-[168%] max-w-none translate-y-[8%] object-contain opacity-[0.16] [mask-image:radial-gradient(80%_84%_at_50%_46%,#000_60%,transparent_100%)] [-webkit-mask-image:radial-gradient(80%_84%_at_50%_46%,#000_60%,transparent_100%)] sm:w-[92%] sm:translate-y-[2%] sm:opacity-[0.25] lg:w-[88%] lg:opacity-[0.33]"
          />
        </div>
        {/* lower-edge fade dissolves the screenshot into the page background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-b from-transparent to-[#020617]" />

        {/* z-3 — localised navy readability gradient behind the copy only */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(56%_46%_at_50%_30%,rgba(2,6,23,0.82),rgba(2,6,23,0.4)_58%,transparent_100%)]" />

        {/* z-4 — hero copy + CTAs, balanced in the upper-middle */}
        <div className="relative z-[4] mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pb-[clamp(2rem,5vh,3rem)] pt-[clamp(2rem,9vh,6rem)] text-center sm:px-6">
          <h1 className="text-balance font-extrabold leading-[1.03] tracking-tight text-[clamp(2.25rem,6vw,4.25rem)]">
            Manage your music.
            <br />
            Make more time for coaching.
          </h1>
          <p className="mx-auto mt-[clamp(1rem,2.5vh,1.75rem)] max-w-[720px] text-pretty leading-relaxed text-[#cbd5e1] text-[clamp(1rem,1.4vw,1.25rem)]">
            EQHO Player makes training music easier to organise and control. Save time, reduce interruptions and keep your attention on your athletes.
          </p>
          <div className="mt-[clamp(1.5rem,3.5vh,2.5rem)] flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <PrimaryCta className="w-full sm:w-auto" />
            <Link
              href="/features"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/15 px-7 text-base font-semibold text-white transition-colors hover:bg-white/5 sm:w-auto"
            >
              Explore EQHO Player
            </Link>
          </div>
          <p className="mt-[clamp(0.75rem,2vh,1.25rem)] text-sm text-[#94a3b8]">
            Sign up and start your 30-day free trial. No charge until it ends.
          </p>
        </div>
      </section>

      {/* ── Below the fold: one player, two ways + the live preview ───────── */}
      <section className="relative overflow-hidden border-t border-white/5">
        {/* A much fainter continuation of the hero glow for visual continuity */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="eqho-glow-b absolute left-1/2 top-[-12%] h-[52vh] w-[62vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.5),transparent_72%)] opacity-50 blur-[130px]" />
        </div>

        <div className="relative z-[1] mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          {/* Two feature panels — one player, two ways to keep training moving.
              Side by side on desktop/large tablet, stacked on mobile. */}
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b]">
              One player. Two ways to keep training moving.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {HERO_PANELS.map(({ icon: Icon, eyebrow, title, body, bullets, gradient, glow, ring }) => (
                <div
                  key={title}
                  className={`group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-colors hover:bg-white/[0.05] ${ring}`}
                >
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white`}
                    style={{ boxShadow: `0 8px 24px -8px ${glow}` }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p
                    className={`mt-4 bg-gradient-to-r ${gradient} bg-clip-text text-xs font-semibold uppercase tracking-[0.15em] text-transparent`}
                  >
                    {eyebrow}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{body}</p>
                  <ul className="mt-4 space-y-2">
                    {bullets.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-[#cbd5e1]">
                        <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white`}>
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Availability: web everywhere + App Store download for iPad/iPhone */}
            <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-center sm:flex-row sm:gap-5 sm:text-left">
              <p className="text-sm leading-relaxed text-[#cbd5e1]">
                Works in any web browser on desktop, tablet and mobile.
                <span className="block text-[#94a3b8] sm:inline sm:pl-1">
                  {APP.bestOn} — download the free app.
                </span>
              </p>
              <AppStoreButton className="shrink-0" />
            </div>
          </div>

          {/* Branded prompt directing users down to the live player preview */}
          <a
            href="#player-preview"
            className="group mx-auto mt-6 flex w-full max-w-5xl flex-col items-center gap-3 rounded-3xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-6 py-3 text-center shadow-[0_20px_60px_-20px_rgba(255,79,163,0.6)] transition-transform hover:scale-[1.01] sm:mt-4 sm:flex-row sm:justify-between sm:py-4 sm:text-left"
          >
            <div>
              <p className="text-base font-bold text-white sm:text-xl">Take a look at the player below</p>
              <p className="mt-1 text-sm text-white/85">
                Scroll on to preview the running order, session controls and full-screen mode.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 transition-colors group-hover:bg-white/30">
              Explore more
              <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
            </span>
          </a>

          <div id="player-preview" className="mx-auto mt-5 w-full max-w-5xl scroll-mt-24">
            <ProductFrame />
            <div className="mt-6 text-center">
              <Link
                href="/features"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb673] transition-colors hover:text-white"
              >
                Take the full player tour
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem → outcome ─────────────────────────────────────────────── */}
      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {PROBLEM.heading}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
            {PROBLEM.body}
          </p>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 border-t border-white/5 bg-[#050814]">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">
              Made to make coaching easier
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to keep your music organised and your training moving.
            </h2>
            <Link
              href="/features"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb673] transition-colors hover:text-white"
            >
              See how EQHO Player works
              <ArrowRight className="h-4 w-4" />
            </Link>
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
                    <Icon className="h-5 w-5 text-[#ff8a00]" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{f.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────���────────────── */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-white/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">How it works</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Set up in around 30 seconds.
            </h2>
          </div>
          <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-white/10 bg-[#050814] p-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Audiences ─────────────────────────────────────────────────────── */}
      <section id="audiences" className="scroll-mt-20 border-t border-white/5 bg-[#050814]">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">Who it’s for</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Made for coaches who run full sessions.
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {AUDIENCES.map((a) => {
              const Icon = ICONS[a.icon] ?? Medal
              return (
                <div key={a.title} className="rounded-2xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/15 ring-1 ring-white/10">
                    <Icon className="h-5 w-5 text-[#ff4fa3]" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{a.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Why coaches use EQHO ──────────────────────────────────────────── */}
      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">
              Why coaches use EQHO
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Less admin around the music, more focus on the floor.
            </h2>
          </div>
          <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              'Spend less time searching for tracks.',
              'Prepare playlists before training begins.',
              'Reduce gaps and interruptions between routines.',
              'Keep music organised in one place.',
              'Access playlists across supported devices.',
              'Focus more attention on coaching and feedback.',
            ].map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-white">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="text-pretty leading-relaxed text-[#cbd5e1]">{benefit}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/features"
            className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb673] transition-colors hover:text-white"
          >
            Explore all Player features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Pricing preview ───────────────────────────────────────────────── */}
      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,79,163,0.14),transparent_55%)]">
            <div className="flex flex-col items-start gap-8 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  Start with a 30-day free trial.
                </h2>
                <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                  {LAUNCH.freeNote} When paid plans begin, pricing stays simple and transparent — no hidden tiers.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-[#cbd5e1]">
                  {['Unlimited playlists and session plans', 'Cloud backup of your sessions', 'Works in the browser and as an app'].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 shrink-0 text-[#ff8a00]" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto">
                <PrimaryCta className="w-full sm:w-auto" />
                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 text-base font-semibold text-white transition-colors hover:bg-white/5"
                >
                  See pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 border-t border-white/5 bg-[#050814]">
        <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Questions, answered.
          </h2>
          <dl className="mt-12 divide-y divide-white/10">
            {FAQ.map((item) => (
              <div key={item.q} className="py-6">
                <dt className="text-lg font-semibold text-white">{item.q}</dt>
                <dd className="mt-2 text-pretty leading-relaxed text-[#94a3b8]">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6">
          <h2 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Less time managing music. More time coaching.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
            Keep your music organised, your training moving and your attention where it matters most.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryCta />
          </div>
        </div>
      </section>
    </main>
  )
}
