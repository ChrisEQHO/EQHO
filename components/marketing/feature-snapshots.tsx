import {
  Timer,
  Repeat,
  SlidersHorizontal,
  Play,
  Music4,
  Clock,
  CloudUpload,
  CloudDownload,
  Check,
  Download,
  RefreshCw,
} from 'lucide-react'

/**
 * On-brand facsimiles of two specific player panels, built from the app's REAL UI
 * (labels, controls and design tokens taken from app/app/page.tsx): the Session
 * Controls panel and the EQHO Cloud panel. These are honest depictions of the
 * interface — not fabricated photo files — used to illustrate the matching
 * sections of the marketing site. If real captures are ever added under
 * /public/marketing/, these can be swapped for <Image> tags.
 */

/* ── Session controls snapshot ──────────────────────────────────────────── */

function ControlRow({
  icon,
  label,
  value,
  accent = '#ff8a00',
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
      <span className="flex items-center gap-2.5 text-[13px] font-medium text-white/80">
        <span className="text-[color:var(--a)]" style={{ ['--a' as string]: accent }}>
          {icon}
        </span>
        {label}
      </span>
      <span className="text-[13px] font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </span>
    </div>
  )
}

export function SessionControlsSnapshot() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[1.75rem] bg-[radial-gradient(60%_60%_at_70%_10%,rgba(255,138,0,0.2),transparent_70%)] blur-2xl"
      />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050814] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0a1020] px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff4fa3]">
            Session controls
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
        </div>

        <div className="space-y-2.5 p-4">
          <ControlRow icon={<Timer className="h-4 w-4" />} label="Gap between routines" value="10s" />
          <ControlRow icon={<Repeat className="h-4 w-4" />} label="Repeat playlist" value="1x" accent="#ff4fa3" />
          <ControlRow
            icon={<SlidersHorizontal className="h-4 w-4" />}
            label="Back to back"
            value="Off"
            accent="#a855f7"
          />
          <ControlRow icon={<Clock className="h-4 w-4" />} label="Total session time" value="14:54" accent="#4f8bff" />

          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(255,79,163,0.4)]"
          >
            <Play className="h-4 w-4 fill-white" />
            Start Session
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Cloud upload snapshot ──────────────────────────────────────────────── */

function CloudPlaylistRow({
  name,
  meta,
  state,
}: {
  name: string
  meta: string
  state: 'synced' | 'push' | 'download'
}) {
  const pill =
    state === 'synced'
      ? { label: 'Synced', cls: 'text-[#7cb0ff] ring-[#4f8bff]/40', icon: <Check className="h-3 w-3" /> }
      : state === 'push'
        ? { label: 'Push Updates', cls: 'text-[#ffb673] ring-[#ff8a00]/40', icon: <RefreshCw className="h-3 w-3" /> }
        : { label: 'Download to Device', cls: 'text-[#ff8ac0] ring-[#ff4fa3]/40', icon: <Download className="h-3 w-3" /> }
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <Music4 className="h-4 w-4 shrink-0 text-[#ff4fa3]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white/90">{name}</p>
        <p className="text-[11px] text-white/40">{meta}</p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${pill.cls}`}
      >
        {pill.icon}
        {pill.label}
      </span>
    </div>
  )
}

export function CloudSnapshot() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[1.75rem] bg-[radial-gradient(60%_60%_at_30%_10%,rgba(255,79,163,0.22),transparent_70%)] blur-2xl"
      />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050814] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0a1020] px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <CloudUpload className="h-4 w-4 text-[#ff8a00]" />
            EQHO Cloud
          </span>
          <span className="text-[11px] text-white/40">3 playlists backed up</span>
        </div>

        <div className="space-y-4 p-4">
          {/* Upload / download action tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-white">
                <CloudUpload className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-[13px] font-semibold text-white">Upload to Cloud</p>
              <p className="mt-0.5 text-[11px] leading-snug text-white/45">
                Back up every playlist to your account.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-[#7cb0ff] ring-1 ring-white/10">
                <CloudDownload className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-[13px] font-semibold text-white">Download from Cloud</p>
              <p className="mt-0.5 text-[11px] leading-snug text-white/45">
                Restore your sessions on any device.
              </p>
            </div>
          </div>

          {/* Playlist sync states */}
          <div className="space-y-2">
            <CloudPlaylistRow name="TRAINING PLAYLIST" meta="7 tracks · 13:54" state="synced" />
            <CloudPlaylistRow name="TIGERS ACRO CUP" meta="5 tracks · 12:14" state="push" />
            <CloudPlaylistRow name="SHOWCASE 2026" meta="9 tracks · 21:03" state="download" />
          </div>
        </div>
      </div>
    </div>
  )
}
