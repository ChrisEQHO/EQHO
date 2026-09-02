import type { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Scheduled maintenance | EQHO Player",
  description: "EQHO Player is undergoing scheduled updates and will be back shortly.",
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#020617] px-6 py-16 text-center">
      {/* Soft brand glow behind the content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#ff2d78]/25 via-[#ff5a1f]/15 to-transparent blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8">
        <Image
          src="/eqho-player-email-logo.png"
          alt="EQHO Player"
          width={320}
          height={90}
          priority
          className="h-auto w-56 sm:w-64"
        />

        <div className="flex flex-col gap-4">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gradient-to-r from-[#ff2d78] to-[#ff8a1f]" />
            Scheduled maintenance
          </span>

          <h1 className="text-balance text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {"We're making some improvements"}
          </h1>

          <p className="text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
            {
              "EQHO Player is currently undergoing updates. The site will be back online Thursday 3rd September from 12:00 (UK time). Thanks for your patience \u2014 we'll be ready for your next session."
            }
          </p>
        </div>

        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4">
          <p className="text-sm font-medium uppercase tracking-wider text-white/50">Back online</p>
          <p className="mt-1 bg-gradient-to-r from-[#ff2d78] to-[#ff8a1f] bg-clip-text text-lg font-semibold text-transparent">
            Thursday 3rd September from 12:00 UK time
          </p>
        </div>
      </div>
    </main>
  )
}
