import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const BENEFITS: { title: string; note?: string }[] = [
  { title: 'Unlimited playlists' },
  { title: 'Control the gap between routines' },
  { title: 'Set repeats and back-to-back playback' },
  { title: 'Cloud backup for your music and playlists' },
  { title: 'Sync your playlists across your devices' },
  { title: 'Use EQHO Player in your browser or install the app' },
  {
    title: 'Competition music from just £9.99 per track',
    note: 'Standard track prices start from £19.99',
  },
  { title: 'Manage your subscription whenever you need' },
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

        {/* Everything you need checklist */}
        <h3 className="mt-12 text-sm font-semibold uppercase tracking-wider text-white">
          Everything you need to keep training moving
        </h3>
        <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00]">
                <Check className="h-3 w-3 text-white" aria-hidden="true" />
              </span>
              <span className="text-pretty leading-relaxed text-[#e2e8f0]">
                {benefit.title}
                {benefit.note ? (
                  <span className="mt-0.5 block text-sm text-[#94a3b8]">{benefit.note}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] px-7 text-base font-semibold text-white shadow-[0_4px_20px_rgba(255,79,163,0.3)] transition-transform hover:scale-[1.03]"
          >
            Join EQHO and save on music
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/features"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 text-base font-semibold text-white transition-colors hover:bg-white/5"
          >
            Explore EQHO Player
          </Link>
        </div>
      </div>
    </section>
  )
}
