import Link from 'next/link'
import {
  ArrowRight,
  ListMusic,
  ListOrdered,
  SlidersHorizontal,
  Timer,
  CloudUpload,
  MonitorSmartphone,
  Medal,
  Music2,
  Megaphone,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { ProductFrame } from '@/components/marketing/product-frame'
import {
  SITE,
  LAUNCH,
  CTA,
  PROBLEM,
  FEATURES,
  STEPS,
  AUDIENCES,
  FAQ,
} from '@/lib/marketing-config'

// Resolve config icon names to lucide components (keeps the config JSX-free).
const ICONS: Record<string, LucideIcon> = {
  ListMusic,
  ListOrdered,
  SlidersHorizontal,
  Timer,
  CloudUpload,
  MonitorSmartphone,
  Medal,
  Music2,
  Megaphone,
}

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
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(80%_60%_at_50%_-10%,rgba(255,138,0,0.15),transparent_60%)]"
        />
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ff8a00]/30 bg-[#ff8a00]/10 px-4 py-1.5 text-xs font-semibold text-[#ffb673]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a00]" />
              {LAUNCH.freeUntilLabel}
            </span>
            <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              {SITE.tagline}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
              {SITE.description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryCta className="w-full sm:w-auto" />
              <Link
                href={CTA.secondary.href}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/15 px-7 text-base font-semibold text-white transition-colors hover:bg-white/5 sm:w-auto"
              >
                {CTA.secondary.label}
              </Link>
            </div>
            <p className="mt-4 text-sm text-[#64748b]">No card required. {LAUNCH.freeUntilLabel}.</p>
          </div>

          <div className="mx-auto mt-14 max-w-5xl">
            <ProductFrame />
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
            <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">Features</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to run the music, nothing you don’t.
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

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-white/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">How it works</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              From a folder of tracks to floor-ready in three steps.
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
              Built for coaches who run the floor.
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

      {/* ── Pricing preview ───────────────────────────────────────────────── */}
      <section className="border-t border-white/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,79,163,0.14),transparent_55%)]">
            <div className="flex flex-col items-start gap-8 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  Free while we launch.
                </h2>
                <p className="mt-4 text-pretty text-lg leading-relaxed text-[#94a3b8]">
                  {LAUNCH.freeNote} When paid plans begin, pricing stays simple and transparent — no hidden tiers.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-[#cbd5e1]">
                  {['Unlimited playlists and running orders', 'Cloud backup of your sessions', 'Works in the browser and as an app'].map(
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
            Press play with confidence.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
            Set up your first session in minutes. {LAUNCH.freeUntilLabel}.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryCta />
          </div>
        </div>
      </section>
    </main>
  )
}
