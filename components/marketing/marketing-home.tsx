import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ListOrdered,
  Repeat,
  Eye,
  Timer,
  ListMusic,
  MonitorSmartphone,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { DemoCta } from '@/components/marketing/demo-cta'
import { FreeUntilPill } from '@/components/marketing/free-until-pill'
import { PROBLEM, FEATURES, getOfferCopy } from '@/lib/marketing-config'

// Resolve config icon names to lucide components (keeps the config JSX-free).
const ICONS: Record<string, LucideIcon> = {
  ListOrdered,
  Timer,
  Repeat,
  ListMusic,
  Eye,
  MonitorSmartphone,
}

function PrimaryCta({ className = '', href, label }: { className?: string; href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_8px_30px_rgba(255,79,163,0.35)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${className}`}
    >
      {label}
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </Link>
  )
}

export function MarketingHome() {
  // Date-driven, server-time offer copy — the single source of truth shared with
  // the header, pricing and signup, so every CTA flips together at the changeover.
  const offer = getOfferCopy()

  return (
    <main className="bg-[#020617] text-white">
      {/* ── Hero — the real player-interface screenshot sits behind the copy as a
              faded, glowing backdrop (never a solid framed box). On desktop the
              copy is left-aligned in a controlled max-width column with a localised
              dark gradient for readability, and the screenshot is nudged downward
              on the right so more of the interface shows. */}
      <section className="relative isolate flex min-h-[clamp(420px,72svh,720px)] flex-col overflow-hidden">
        {/* z-0 — navy base colour */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-[#020617]" />

        {/* z-1 — animated ambient brand glow (deep indigo + electric blue lead,
            violet/pink highlights). Freezes under reduced-motion via globals.css. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <div className="eqho-glow-a absolute left-[-12%] top-[-10%] h-[70vh] w-[55vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.95),transparent_70%)] blur-[90px]" />
          <div className="eqho-glow-b absolute right-[-14%] top-[4%] h-[66vh] w-[55vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(29,78,216,0.9),transparent_70%)] blur-[100px]" />
          <div className="eqho-glow-c absolute bottom-[-16%] left-[28%] h-[60vh] w-[52vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.55),rgba(255,79,163,0.35)_45%,transparent_72%)] blur-[100px]" />
        </div>

        {/* z-2 — MOBILE/TABLET: screenshot centered at the bottom, faded into the
            page. Copy sits centered above it. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center lg:hidden">
          <Image
            src="/marketing/hero-backdrop.png"
            alt=""
            aria-hidden="true"
            width={2940}
            height={1628}
            priority
            className="h-auto w-[168%] max-w-none translate-y-[8%] object-contain opacity-[0.16] [mask-image:radial-gradient(80%_84%_at_50%_46%,#000_60%,transparent_100%)] [-webkit-mask-image:radial-gradient(80%_84%_at_50%_46%,#000_60%,transparent_100%)] sm:w-[92%] sm:translate-y-[2%] sm:opacity-[0.24]"
          />
        </div>

        {/* z-2 — DESKTOP: screenshot on the right, nudged downward, faded and masked
            so the interface reads without competing with the copy. Proportions kept
            (object-contain); never stretched. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-[2] hidden w-[64%] overflow-hidden lg:block">
          <Image
            src="/marketing/hero-backdrop.png"
            alt=""
            aria-hidden="true"
            width={2940}
            height={1628}
            priority
            className="absolute right-[-3%] top-1/2 w-[116%] max-w-none -translate-y-[38%] object-contain opacity-[0.28] [mask-image:radial-gradient(78%_78%_at_62%_50%,#000_52%,transparent_100%)] [-webkit-mask-image:radial-gradient(78%_78%_at_62%_50%,#000_52%,transparent_100%)]"
          />
        </div>

        {/* z-3 — localised dark gradients for copy readability. Mobile: radial behind
            centered copy. Desktop: left→right gradient so the left column stays legible. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(56%_46%_at_50%_34%,rgba(2,6,23,0.82),rgba(2,6,23,0.4)_58%,transparent_100%)] lg:hidden" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] hidden bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.82)_38%,rgba(2,6,23,0.25)_68%,transparent_100%)] lg:block" />
        {/* lower-edge fade dissolves the screenshot into the next section */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-32 bg-gradient-to-b from-transparent to-[#020617]" />

        {/* z-4 — hero copy. Centered on mobile, left-aligned in a controlled column
            on desktop. */}
        <div className="relative z-[4] mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:items-start lg:py-24 lg:text-left">
          <div className="w-full max-w-xl">
            <h1 className="text-balance font-extrabold leading-[1.05] tracking-tight text-[clamp(2.25rem,6vw,4rem)]">
              Manage your music.
              <br />
              Make more time for coaching.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-pretty leading-relaxed text-[#cbd5e1] text-[clamp(1rem,1.4vw,1.25rem)] lg:mx-0">
              Keep your routine music organised, your sessions moving and your attention on coaching.
            </p>
            <div className="mt-8">
              <DemoCta offerCta={offer.cta} offerCardNote={offer.cardNote} align="left" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Core message — moved high on the page. Stated once, never repeated. */}
      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-balance font-extrabold leading-[1.1] tracking-tight text-[clamp(1.75rem,4vw,2.75rem)]">
            {PROBLEM.heading}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty leading-relaxed text-[#94a3b8] text-[clamp(1rem,1.3vw,1.125rem)]">
            {PROBLEM.body}
          </p>
        </div>
      </section>

      {/* ── Feature section — one functional grid, six cards. */}
      <section className="border-t border-white/5 bg-[#050814]">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to keep training moving.
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

      {/* ── Player CTA — routes to the interactive demo on The Player page. */}
      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            See EQHO Player in action
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
            Try a ready-made training session and explore the controls for yourself.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryCta href="/features#interactive-demo" label="Try the interactive demo" />
          </div>
        </div>
      </section>

      {/* ── Separate-page teasers ─────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-[#050814]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-20 sm:px-6 lg:grid-cols-2">
          {/* How it works */}
          <div className="flex flex-col items-start rounded-3xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-8">
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              From playlist to training session
            </h2>
            <p className="mt-3 text-pretty leading-relaxed text-[#94a3b8]">
              See how to prepare your music, set the session controls and start coaching.
            </p>
            <Link
              href="/how-it-works"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb673] transition-colors hover:text-white"
            >
              See how it works
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Who it's for */}
          <div className="flex flex-col items-start rounded-3xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-8">
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Built for gymnastics coaches
            </h2>
            <p className="mt-3 text-pretty leading-relaxed text-[#94a3b8]">
              Designed for coaches and clubs running real training sessions across multiple gymnastics
              disciplines.
            </p>
            <Link
              href="/who-its-for"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb673] transition-colors hover:text-white"
            >
              See who EQHO is for
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing preview — date-driven offer copy. */}
      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,79,163,0.14),transparent_55%)]">
            <div className="flex flex-col items-start gap-8 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  {offer.headline}
                </h2>
                <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                  {offer.supporting}
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-[#cbd5e1]">
                  {[
                    'Unlimited playlists and session plans',
                    'Cloud storage and playlist backup',
                    'Access on supported desktop, tablet and mobile devices',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#ff8a00]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto">
                <PrimaryCta className="w-full sm:w-auto" href="/signup" label={offer.cta} />
                <FreeUntilPill className="w-full sm:w-auto" />
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

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6">
          <h2 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Less time managing music. More time coaching.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
            Keep your music organised, your training moving and your attention where it matters most.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <PrimaryCta href="/signup" label={offer.cta} />
            <FreeUntilPill />
          </div>
        </div>
      </section>
    </main>
  )
}
