"use client";

import type { KeyboardEvent, PointerEvent, MouseEvent } from "react";
import { AlertTriangle, Check, Circle, FileX, Minus, Play, Plus, Ban } from "lucide-react";
import {
  MAX_TRACK_PLAYS as MAX_TARGET_PLAYS,
  MIN_TRACK_PLAYS as MIN_TARGET_PLAYS,
  type TrackRowStatus,
  type TrackRowStatusKind,
} from "@/lib/playback/track-plays";

type TrackPlaysControlProps = {
  trackTitle: string;
  target: number;
  included: boolean;
  status: TrackRowStatus;
  layout: "inline" | "stacked";
  onChangeTarget: (value: number) => void;
  onToggleIncluded: () => void;
};

// Keeps taps, clicks and key presses on the control from selecting, playing or
// dragging the row it sits in (dnd-kit listens for pointer and key events).
const stop = (e: PointerEvent | MouseEvent | KeyboardEvent) => e.stopPropagation();

// 44x44 minimum on every pointer type.
const touchTarget =
  "flex items-center justify-center shrink-0 min-w-11 min-h-11 rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70";

// Each status has its own icon and wording, so colour is never the only cue.
const STATUS_STYLE: Record<TrackRowStatusKind, { icon: typeof Check; className: string }> = {
  current: { icon: Play, className: "text-pink-300" },
  upcoming: { icon: Circle, className: "text-white/60" },
  complete: { icon: Check, className: "text-green-400" },
  excluded: { icon: Ban, className: "text-white/50" },
  "missing-audio": { icon: FileX, className: "text-amber-300" },
  error: { icon: AlertTriangle, className: "text-red-400" },
};

export function TrackPlaysControl({
  trackTitle,
  target,
  included,
  status,
  layout,
  onChangeTarget,
  onToggleIncluded,
}: TrackPlaysControlProps) {
  const canDecrease = target > MIN_TARGET_PLAYS;
  const canIncrease = target < MAX_TARGET_PLAYS;
  const { icon: StatusIcon, className: statusClass } = STATUS_STYLE[status.kind];

  const handleStepperKey = (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      if (canIncrease) onChangeTarget(target + 1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (canDecrease) onChangeTarget(target - 1);
    }
  };

  return (
    <div
      className={`flex items-center gap-1.5 ${layout === "stacked" ? "flex-wrap justify-end" : ""}`}
      onPointerDown={stop}
      onClick={stop}
      onKeyDown={stop}
      data-track-plays-control
    >
      <span
        className={`flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold ${statusClass}`}
        aria-live={status.kind === "current" ? "polite" : undefined}
        data-status={status.kind}
      >
        <StatusIcon size={12} aria-hidden="true" />
        {status.label}
      </span>

      <div
        role="group"
        aria-label={`Plays for ${trackTitle}`}
        onKeyDown={handleStepperKey}
        className={`flex items-center rounded-lg border border-white/10 bg-white/[0.04] ${included ? "" : "opacity-40"}`}
      >
        <span className="pl-2 pr-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">Plays</span>
        <button
          type="button"
          onClick={() => canDecrease && onChangeTarget(target - 1)}
          disabled={!canDecrease || !included}
          aria-label={`Decrease plays for ${trackTitle}`}
          className={`${touchTarget} text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <Minus size={14} strokeWidth={2.75} aria-hidden="true" />
        </button>
        <output
          aria-label={`${target} ${target === 1 ? "play" : "plays"}`}
          className="min-w-5 text-center text-sm font-bold tabular-nums text-white"
        >
          {target}
        </output>
        <button
          type="button"
          onClick={() => canIncrease && onChangeTarget(target + 1)}
          disabled={!canIncrease || !included}
          aria-label={`Increase plays for ${trackTitle}`}
          className={`${touchTarget} text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <Plus size={14} strokeWidth={2.75} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={included}
        onClick={onToggleIncluded}
        aria-label={`${trackTitle}: ${included ? "included in" : "excluded from"} this session`}
        className={`${touchTarget} gap-1 border px-2.5 text-[11px] font-bold ${
          included
            ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
            : "border-white/15 text-white/60 hover:bg-white/10 hover:text-white"
        }`}
      >
        {included ? <Check size={13} aria-hidden="true" /> : <Ban size={13} aria-hidden="true" />}
        {included ? "Included" : "Excluded"}
      </button>
    </div>
  );
}
