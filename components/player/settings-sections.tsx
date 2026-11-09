"use client";

import type { ReactNode } from "react";
import { BookOpen, Compass, Repeat, Timer, Wifi, WifiOff, Zap } from "lucide-react";

export type SettingsScope = "saved" | "session" | "info";

const SCOPE_LABEL: Record<SettingsScope, string> = {
  saved: "Saved on this device",
  session: "This session only",
  info: "Information",
};

function ScopeBadge({ scope }: { scope: SettingsScope }) {
  const tone =
    scope === "session"
      ? "border-[#ff8a00]/40 bg-[#ff8a00]/10 text-[#ffb35c]"
      : scope === "saved"
        ? "border-[#ff4fa3]/35 bg-[#ff4fa3]/10 text-[#ff8cc6]"
        : "border-white/15 bg-white/5 text-white/60";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {SCOPE_LABEL[scope]}
    </span>
  );
}

export function SettingsGroup({
  id,
  title,
  description,
  scope,
  compact = false,
  children,
}: {
  id: string;
  title: string;
  description: string;
  scope?: SettingsScope;
  compact?: boolean;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="flex flex-col gap-3 scroll-mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2
            id={headingId}
            className={`font-bold uppercase tracking-wide text-[#ff8a00] ${compact ? "text-xs" : "text-sm"}`}
          >
            {title}
          </h2>
          <p className="text-xs leading-relaxed text-white/50 text-pretty">{description}</p>
        </div>
        {scope && <ScopeBadge scope={scope} />}
      </div>
      <div
        className={
          compact ? "flex flex-col gap-2" : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        }
      >
        {children}
      </div>
    </section>
  );
}

export function CurrentSessionCard({
  gapSeconds,
  playlistRepeats,
  backToBack,
  sessionRunning,
  onEditOnPlayer,
  compact = false,
}: {
  gapSeconds: number;
  playlistRepeats: number;
  backToBack: boolean;
  sessionRunning: boolean;
  onEditOnPlayer: () => void;
  compact?: boolean;
}) {
  const items = [
    { icon: Timer, label: "Gap", value: `${gapSeconds}s` },
    { icon: Repeat, label: "Reps", value: `${playlistRepeats}x` },
    { icon: Zap, label: "Back to back", value: backToBack ? "On" : "Off" },
  ];
  return (
    <div className={`rounded-2xl border border-[#ff8a00]/30 bg-[#ff8a00]/[0.04] ${compact ? "p-3" : "p-5"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className={`${compact ? "text-sm" : "text-lg"} font-bold text-white`}>Current session</h3>
        <ScopeBadge scope="session" />
      </div>
      <p className="mb-3 text-xs leading-relaxed text-white/60 text-pretty">
        {sessionRunning
          ? "A session is playing with these values. Change them in the session controls on the player."
          : "These values apply to the next session you start. They reset to your saved defaults when the player restarts."}
      </p>
      <dl className="mb-3 grid grid-cols-3 gap-2">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2">
            <Icon size={14} className="text-[#ff8a00]" aria-hidden="true" />
            <dt className="text-[11px] text-white/55">{label}</dt>
            <dd className="text-sm font-bold text-white tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mb-3 text-xs leading-relaxed text-white/50">Plays per track are set on each track in Up Next.</p>
      <button
        type="button"
        onClick={onEditOnPlayer}
        className="min-h-11 w-full rounded-lg border border-white/15 bg-white/5 text-xs font-semibold text-white transition hover:bg-white/10 active:bg-white/15"
      >
        Change on the player
      </button>
    </div>
  );
}

export function OfflineStatusCard({ online, compact = false }: { online: boolean; compact?: boolean }) {
  const Icon = online ? Wifi : WifiOff;
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] ${compact ? "p-3" : "p-5"}`} role="status">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={compact ? 16 : 18} className={online ? "text-[#22c55e]" : "text-[#ffb35c]"} aria-hidden="true" />
        <h3 className={`${compact ? "text-sm" : "text-lg"} font-bold text-white`}>
          {online ? "Online" : "Offline"}
        </h3>
      </div>
      <p className="text-xs leading-relaxed text-white/60 text-pretty">
        {online
          ? "Playlists marked Offline ready are stored on this device and keep playing if the connection drops."
          : "You can still play any playlist marked Offline ready. Cloud downloads resume when you reconnect."}
      </p>
    </div>
  );
}

export function HelpSettingsCard({
  onReplayGuide,
  onOpenUserGuide,
  compact = false,
}: {
  onReplayGuide: () => void;
  onOpenUserGuide?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] ${compact ? "p-3" : "p-5"}`}>
      <div className="mb-2 flex items-center gap-2">
        <Compass size={compact ? 16 : 18} className="text-[#ff8a00]" aria-hidden="true" />
        <h3 className={`${compact ? "text-sm" : "text-lg"} font-bold text-white`}>Getting started</h3>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-white/60 text-pretty">
        Walk through preparing a playlist and running a class, step by step.
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onReplayGuide}
          className="min-h-11 w-full rounded-lg bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-xs font-semibold text-white transition active:scale-[0.99]"
        >
          Replay the getting started guide
        </button>
        {onOpenUserGuide && (
          <button
            type="button"
            onClick={onOpenUserGuide}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-xs font-semibold text-white transition hover:bg-white/10 active:bg-white/15"
          >
            <BookOpen size={14} aria-hidden="true" />
            Open the user guide
          </button>
        )}
      </div>
    </div>
  );
}
