import Image from 'next/image'
import { ListMusic, Play, GripVertical } from 'lucide-react'

/**
 * Hero product visual.
 *
 * If a real screenshot has been added at /public/marketing/player-hero.png it is
 * shown inside a browser frame. Until then we render an on-brand HTML facsimile of
 * the player built from the app's real design tokens (dark #050814 canvas, the
 * orange→pink brand gradient, playlist + running-order columns). This is NOT a
 * fake screenshot file — it's a faithful, honest representation of the interface
 * that needs no login, and it can be swapped for a real capture by dropping the
 * image into /public/marketing/.
 */

const SAMPLE_TRACKS = [
  { n: '1', title: 'Senior WP — Bal', time: '2:32' },
  { n: '2', title: 'Junior MxP — Dyn', time: '2:00' },
  { n: '3', title: 'Pre-Youth WG — Dyn', time: '2:02' },
  { n: '4', title: 'IDP1 WP — Dyn', time: '3:08' },
  { n: '5', title: 'Senior WP — Com', time: '2:32' },
]

export function ProductFrame({ hasScreenshot = false }: { hasScreenshot?: boolean }) {
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

        {hasScreenshot ? (
          <Image
            src="/marketing/player-hero.png"
            alt="EQHO Player showing a playlist and running order"
            width={1280}
            height={800}
            className="h-auto w-full"
            priority
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:p-5">
            {/* Playlists column */}
            <div className="rounded-xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00]">
                  <ListMusic className="h-4 w-4 text-white" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">Playlists</span>
              </div>
              <ul className="space-y-2">
                {['Competition Day', 'Squad A — Floor', 'Development Group', 'Showcase 2026'].map((p, i) => (
                  <li
                    key={p}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                      i === 0
                        ? 'bg-gradient-to-r from-[#ff4fa3]/20 to-[#ff8a00]/10 text-white ring-1 ring-[#ff4fa3]/30'
                        : 'text-white/60'
                    }`}
                  >
                    <span className="truncate">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Running order column */}
            <div className="rounded-xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-4">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">Running order</span>
                <span className="text-xs text-white/40">{SAMPLE_TRACKS.length} tracks · 12:14</span>
              </div>
              <ul className="space-y-1.5">
                {SAMPLE_TRACKS.map((t, i) => (
                  <li
                    key={t.n}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                      i === 0 ? 'bg-white/[0.06] ring-1 ring-white/10' : ''
                    }`}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-white/20" />
                    <span className="w-4 shrink-0 text-xs tabular-nums text-white/40">{t.n}</span>
                    {i === 0 ? (
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]">
                        <Play className="h-3 w-3 fill-white text-white" />
                      </span>
                    ) : (
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10">
                        <Play className="h-3 w-3 text-white/40" />
                      </span>
                    )}
                    <span className="flex-1 truncate text-white/85">{t.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-white/40">{t.time}</span>
                  </li>
                ))}
              </ul>

              {/* Now-playing bar */}
              <div className="mt-4 rounded-lg border border-white/10 bg-[#050816] p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-white/80">Now playing · Senior WP — Bal</span>
                  <span className="tabular-nums text-white/40">0:48 / 2:32</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
