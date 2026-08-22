import Image from 'next/image'
import {
  Home,
  ListMusic,
  Cloud,
  Settings,
  HelpCircle,
  MonitorSmartphone,
  Download,
  GripVertical,
  X,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  RotateCcw,
  Music4,
  Clock,
  Timer,
} from 'lucide-react'

/**
 * Hero product visual.
 *
 * If a real screenshot has been added at /public/marketing/player-hero.png it is
 * shown inside a browser frame. Until then we render an on-brand HTML facsimile of
 * the ACTUAL three-column player — icon rail, Playlists, Up Next running order and
 * Now Playing with a session overview — built from the app's real design tokens
 * (dark #050814 canvas, the orange→pink brand gradient). This is NOT a fake
 * screenshot file; it is a faithful, honest representation of the interface that
 * needs no login, and it can be swapped for a real capture by dropping an image
 * into /public/marketing/.
 */

// Running order mirrored from the real app (Tigers Acro Cup session). Each row
// carries its own accent colour, matching the colour-coded numbers in the player.
const RUNNING_ORDER: { title: string; time: string; color: string }[] = [
  { title: 'DANIEL & SOPHIA', time: '2:00', color: '#ff8a00' },
  { title: 'ROSIE, NYAH & INAYYAH', time: '2:00', color: '#4f8bff' },
  { title: 'AVA & LILY', time: '2:00', color: '#a855f7' },
  { title: 'FRANKIE & ELLIE', time: '2:00', color: '#ff4fa3' },
  { title: 'MOLLY ELLA & SUHAYA', time: '1:58', color: '#22d3ee' },
  { title: 'LUCIA, CHLOE & SOPHIA', time: '1:59', color: '#34d399' },
  { title: 'INDICA, CHLOE & SHENALI', time: '1:57', color: '#ff8a00' },
]

const PLAYLISTS = ['TRAINING PLAYLIST', 'TEST PLAYLIST', 'MIAC MUSIC', 'NEW MUSIC', 'FIG GROUP']

const RAIL_ICONS = [Home, ListMusic, Cloud, Settings, HelpCircle, MonitorSmartphone]

// Deterministic waveform bar heights (percent). Computed from a sine curve so the
// server and client render identical markup (no hydration mismatch, no Math.random).
const WAVEFORM = Array.from({ length: 56 }, (_, i) =>
  22 + Math.round(Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.17)) * 74),
)

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
            alt="EQHO Player showing a playlist, running order and now-playing controls"
            width={1280}
            height={800}
            className="h-auto w-full"
            priority
          />
        ) : (
          <div className="flex">
            {/* ── Icon rail (large screens only) ─────────────────────────── */}
            <div className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-[#070b17] py-4 xl:flex">
              {RAIL_ICONS.map((Icon, i) => (
                <span
                  key={i}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                    i === 0
                      ? 'bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-white'
                      : 'text-white/35'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              ))}
            </div>

            {/* ── Panels ─────────────────────────────────────────────────── */}
            <div className="grid flex-1 grid-cols-1 gap-3 p-3 sm:p-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.25fr)_minmax(0,1fr)]">
              {/* Playlists column */}
              <div className="hidden rounded-xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-4 xl:block">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">Playlists</span>
                  <span className="text-[11px] font-semibold text-[#ff8a00]">+ Upload Folder</span>
                </div>
                <ul className="space-y-3">
                  {PLAYLISTS.map((p, i) => (
                    <li key={p} className="flex items-center gap-2">
                      <Music4 className="h-4 w-4 shrink-0 text-[#ff4fa3]" />
                      <span
                        className={`flex-1 truncate text-[13px] ${i === 0 ? 'text-white' : 'text-white/70'}`}
                      >
                        {p}
                      </span>
                      <Download className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="rounded-md border border-[#4f8bff]/40 px-1.5 py-0.5 text-[10px] font-semibold text-[#7cb0ff]">
                        Add
                      </span>
                      <span className="rounded-md border border-[#ff4fa3]/40 px-1.5 py-0.5 text-[10px] font-semibold text-[#ff8ac0]">
                        Load
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Running order column */}
              <div className="rounded-xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff8a00]">
                    Up next (in order)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#4f8bff]/40 px-2 py-0.5 text-[10px] font-semibold text-[#7cb0ff]">
                      <RotateCcw className="h-3 w-3" /> Reset
                    </span>
                    <span className="rounded-md border border-[#ff8a00]/40 px-2 py-0.5 text-[10px] font-semibold text-[#ffb673]">
                      Clear
                    </span>
                  </div>
                </div>
                <p className="mb-3 text-[11px] text-white/40">Drag to re-order your playlist</p>
                <ul className="space-y-1.5">
                  {RUNNING_ORDER.map((t, i) => (
                    <li
                      key={t.title}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
                        i === 0 ? 'bg-white/[0.06] ring-1 ring-[#ff8a00]/30' : ''
                      }`}
                    >
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/20" />
                      <span
                        className="w-4 shrink-0 text-sm font-extrabold tabular-nums"
                        style={{ color: t.color }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`flex-1 truncate text-[13px] ${
                          i === 0 ? 'font-semibold text-white' : 'text-white/80'
                        }`}
                      >
                        {t.title}
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums" style={{ color: t.color }}>
                        {t.time}
                      </span>
                      <X className="h-3.5 w-3.5 shrink-0 text-white/25" />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Now playing column */}
              <div className="flex flex-col gap-3">
                {/* Now-playing card */}
                <div className="rounded-xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff4fa3]">
                      Now playing
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="h-3.5 w-3.5 text-white/50" />
                      <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
                        80%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff4fa3]/25 to-[#ff8a00]/20 ring-1 ring-white/10">
                      <Music4 className="h-5 w-5 text-[#ff8ac0]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">DANIEL &amp; SOPHIA</p>
                      <p className="text-[11px] text-white/45">Playing</p>
                    </div>
                    <span className="ml-auto text-lg font-extrabold tabular-nums text-white">00:00</span>
                  </div>

                  {/* Transport controls */}
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60">
                      <SkipBack className="h-4 w-4" />
                    </span>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white shadow-[0_8px_24px_rgba(255,79,163,0.45)]">
                      <Play className="h-5 w-5 fill-white" />
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60">
                      <SkipForward className="h-4 w-4" />
                    </span>
                  </div>

                  {/* Waveform scrubber */}
                  <div className="mt-4 flex h-10 items-end gap-[2px]" aria-hidden="true">
                    {WAVEFORM.map((h, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-full bg-white/25"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-1 text-[10px] tabular-nums text-white/40">00:00</div>
                </div>

                {/* Session overview card */}
                <div className="rounded-xl border border-white/10 bg-[rgba(9,15,28,0.9)] p-4">
                  <p className="text-sm font-extrabold tracking-tight text-white">TIGERS ACRO CUP</p>
                  <p className="mt-0.5 text-[11px] text-white/45">7 tracks · 13:54 total</p>

                  <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Session overview
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <SessionStat icon={<Music4 className="h-4 w-4 text-[#ff8ac0]" />} value="7" label="Routines in playlist" />
                    <SessionStat icon={<Timer className="h-4 w-4 text-[#ff8a00]" />} value="13:54" label="Total routine time" />
                    <SessionStat icon={<Clock className="h-4 w-4 text-[#ff8a00]" />} value="10 sec" label="Gap between routines" />
                    <SessionStat icon={<Timer className="h-4 w-4 text-[#a855f7]" />} value="14:54" label="Est. session (with gaps)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SessionStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-base font-extrabold leading-none text-white">{value}</p>
        <p className="mt-1 text-[10px] uppercase leading-tight tracking-wide text-white/45">{label}</p>
      </div>
    </div>
  )
}
