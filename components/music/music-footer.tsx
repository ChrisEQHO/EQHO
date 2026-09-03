import Link from "next/link"

// Footer for the EQHO Music prototype. Carries the honest "internal preview"
// disclaimer so nobody mistakes the seeded catalog or illustrative figures for
// a live, public product.
export function MusicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050414] px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              EQHO <span className="text-[#b86cff]">Music</span>
            </p>
            <p className="mt-1 text-xs text-white/50">
              A royalty-free music licensing marketplace by EQHO.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/60">
            <Link href="/music" className="hover:text-white">
              Discover
            </Link>
            <Link href="/music/browse" className="hover:text-white">
              Browse
            </Link>
            <Link href="/music/creators" className="hover:text-white">
              Creators
            </Link>
            <Link href="/app" className="hover:text-white">
              Back to EQHO Player
            </Link>
          </nav>
        </div>
        <p className="max-w-3xl text-[11px] leading-relaxed text-white/35">
          Internal preview. Catalog tracks, artists and any popularity or
          country figures shown here are illustrative sample data for design
          review only — they do not represent real recordings, real artists or
          real sales. Checkout runs in Stripe test mode.
        </p>
      </div>
    </footer>
  )
}
