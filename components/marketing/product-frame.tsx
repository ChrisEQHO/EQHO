import Image from 'next/image'

/**
 * Hero product visual — the real EQHO Player app screenshot shown inside a
 * lightweight browser frame. The capture lives at /public/marketing/player-hero.png
 * (2900×1636). To refresh it, drop a new screenshot at the same path.
 */
export function ProductFrame() {
  return (
    <div className="relative">
      {/* Ambient brand glow behind the frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,79,163,0.25),transparent_70%)] blur-2xl"
      />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050814] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-[#0a1020] px-4 py-3">
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
      </div>
    </div>
  )
}
