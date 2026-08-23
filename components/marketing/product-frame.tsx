import Image from 'next/image'

/**
 * Hero product visual — the real EQHO Player app screenshot shown inside a
 * lightweight browser frame. The capture lives at /public/marketing/player-hero.png
 * (2900×1636). To refresh it, drop a new screenshot at the same path.
 *
 * The frame is tuned to blend into the surrounding sections (both pages use a
 * #020617 background): matched body colour, a soft gradient/inset border, a
 * brand-tinted ambient shadow and a feathered bottom edge so the capture melts
 * into the page rather than sitting on it as a hard card.
 */
export function ProductFrame() {
  return (
    <div className="relative">
      {/* Ambient brand glow behind the frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[3rem] bg-[radial-gradient(60%_55%_at_50%_0%,rgba(255,79,163,0.22),transparent_70%)] blur-3xl"
      />

      {/* Gradient hairline border that fades toward the bottom so the frame
          dissolves into the page instead of being boxed in. */}
      <div className="rounded-2xl bg-gradient-to-b from-white/12 via-white/5 to-transparent p-px">
        <div className="relative overflow-hidden rounded-2xl bg-[#020617] shadow-[0_40px_90px_-40px_rgba(255,79,163,0.35),0_20px_60px_-30px_rgba(0,0,0,0.9)] ring-1 ring-inset ring-white/[0.04]">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#060b18] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 truncate text-xs text-white/40">eqho-player.com/app</span>
          </div>

          <Image
            src="/marketing/player-hero.png"
            alt="EQHO Player app showing the playlists, the up-next running order and the now-playing panel with a session overview"
            width={2900}
            height={1636}
            className="h-auto w-full"
            priority
            sizes="(max-width: 1024px) 100vw, 960px"
          />

          {/* Feather just the extreme bottom edge into the page background so
              the frame dissolves without hiding the control bar. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-[#020617]"
          />
        </div>
      </div>
    </div>
  )
}
