import Link from 'next/link'
import {
  ArrowRight,
  ListMusic,
  CloudUpload,
  MonitorSmartphone,
  BadgePercent,
  Zap,
  Clock,
} from 'lucide-react'

const BENEFITS = [
  {
    icon: ListMusic,
    title: 'EQHO Player',
    body: 'Create playlists, organise running orders, control timings and set automatic repeats.',
  },
  {
    icon: CloudUpload,
    title: 'Cloud music storage',
    body: 'Keep your training and competition music organised and available from your EQHO account.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Device sync',
    body: 'Access your music, playlists and session settings across your supported devices.',
  },
  {
    icon: BadgePercent,
    title: 'Customer music pricing',
    body: 'Purchase competition tracks from £9.99 each instead of the standard price of £19.99.',
  },
  {
    icon: Zap,
    title: 'Fewer interruptions',
    body: 'Spend less time searching for tracks, restarting music and managing gaps between routines.',
  },
  {
    icon: Clock,
    title: 'More time to coach',
    body: 'Keep the session moving, complete more repetitions and give gymnasts more useful feedback.',
  },
]

export function JoinEqhoSection() {
  return (
    <section className="relative overflow-hidden border-t border-white/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgba(76,29,149,0.28)_0%,rgba(2,6,23,0)_70%)]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        {/* Heading */}
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#ffb673]">
            More than a music discount
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join EQHO. Save on music and transform your training sessions.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-[#94a3b8] sm:text-lg">
            EQHO customers can purchase competition music from £9.99 per track—and get access to EQHO
            Player, built to make running music during training faster, simpler and more reliable.
          </p>
        </div>

        {/* Set the music once callout */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Set the music once. Coach the whole session.
          </h3>
          <p className="mt-3 max-w-3xl text-pretty leading-relaxed text-[#94a3b8]">
            EQHO Player lets you prepare your running order, timings and repeats in around 30 seconds.
            Press play and focus on coaching while the session runs as planned.
          </p>
        </div>

        {/* Benefits grid */}
        <h3 className="mt-12 text-lg font-semibold text-white">Your EQHO benefits include</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3]/20 to-[#ff8a00]/20 text-[#ffb673]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h4 className="mt-4 text-base font-semibold text-white">{benefit.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{benefit.body}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/features"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
          >
            Explore EQHO Player
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 text-base font-semibold text-white transition-colors hover:bg-white/5"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  )
}
