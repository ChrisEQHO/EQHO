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
    body: 'Push your playlists and audio to your EQHO Cloud account to keep them securely saved and backed up. Log in on desktop, tablet or phone to access the same music across multiple devices, so your coaching team can use the playlists they need.',
    bullets: [
      'Secure cloud storage and backup',
      'Access on desktop, tablet and phone',
      'Make playlists available on multiple logged-in devices',
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
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(80%_60%_at_50%_-10%,rgba(255,138,0,0.15),transparent_60%)]"
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-6 pt-5 sm:px-6 sm:pt-7 lg:pt-6">
          <div className="order-1 mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {SITE.tagline}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-[#94a3b8] sm:mt-4 sm:text-lg">
              {SITE.heroSupport}
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:mt-5 sm:flex-row">
              <PrimaryCta className="w-full sm:w-auto" />
              <Link
                href={CTA.secondary.href}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/15 px-7 text-base font-semibold text-white transition-colors hover:bg-white/5 sm:w-auto"
              >
                {CTA.secondary.label}
              </Link>
            </div>
            <p className="mt-3 text-sm text-[#64748b]">No card required. {LAUNCH.freeUntilLabel}.</p>
          </div>

          {/* Two feature panels — one player, two ways to keep training moving.
              Side by side on desktop/large tablet, stacked on mobile. */}
          <div className="order-3 mx-auto mt-6 w-full max-w-5xl sm:order-2 sm:mt-6">
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
          </div>

          {/* Branded prompt directing users down to the live player preview */}
          <a
            href="#player-preview"
            className="group order-2 mx-auto mt-6 flex w-full max-w-5xl flex-col items-center gap-3 rounded-3xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-6 py-3 text-center shadow-[0_20px_60px_-20px_rgba(255,79,163,0.6)] transition-transform hover:scale-[1.01] sm:order-3 sm:mt-4 sm:flex-row sm:justify-between sm:py-4 sm:text-left"
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

          <div id="player-preview" className="order-4 mx-auto mt-5 w-full max-w-5xl scroll-mt-24">
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
            <p className="text-sm font-semibold uppercase tracking-wider text-[#ff4fa3]">Features</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Built to make your life easier, so you can spend more time coaching.
            </h2>
            <Link
              href="/features"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb673] transition-colors hover:text-white"
            >
              See everything the player does
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

      {/* ── How it works ──────────────────────────────────────────────────── */}
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
            Spend the session coaching.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-[#94a3b8]">
            Build your first session plan in around 30 seconds. {LAUNCH.freeUntilLabel}.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryCta />
          </div>
        </div>
      </section>
    </main>
  )
}
