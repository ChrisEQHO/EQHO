"use client";

import type { KeyboardEvent, PointerEvent, MouseEvent } from "react";
import { Check, Eye, EyeOff, Minus, Plus } from "lucide-react";
import {
  MAX_TRACK_PLAYS as MAX_TARGET_PLAYS,
  MIN_TRACK_PLAYS as MIN_TARGET_PLAYS,
} from "@/lib/playback/track-plays";

type TrackPlaysControlProps = {
  trackTitle: string;
  target: number;
  included: boolean;
  status: string | null;
  layout: "inline" | "stacked";
  onChangeTarget: (value: number) => void;
  onToggleIncluded: () => void;
};

// Keeps taps, clicks and key presses on the control from selecting, playing or
// dragging the row it sits in (dnd-kit listens for pointer and key events).
const stop = (e: PointerEvent | MouseEvent | KeyboardEvent) => e.stopPropagation();

const touchTarget =
  "flex items-center justify-center shrink-0 rounded-md transition [@media(pointer:coarse)]:min-w-11 [@media(pointer:coarse)]:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70";

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
  const isComplete = status === "Complete";

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
      className={`flex items-center gap-1 ${layout === "stacked" ? "flex-wrap justify-end" : ""}`}
      onPointerDown={stop}
      onClick={stop}
      onKeyDown={stop}
      data-track-plays-control
    >
      {status && included && (
        <span
          className={`flex items-center gap-0.5 whitespace-nowrap text-[10px] font-semibold ${isComplete ? "text-green-400" : "text-pink-300"}`}
          aria-live="polite"
        >
          {isComplete && <Check size={11} aria-hidden="true" />}
          {status}
        </span>
      )}

      <div
        role="group"
        aria-label={`Plays for ${trackTitle}`}
        onKeyDown={handleStepperKey}
        className={`flex items-center rounded-lg border border-white/10 bg-white/[0.04] ${included ? "" : "opacity-40"}`}
      >
        <span className="pl-1.5 pr-0.5 text-[9px] font-bold uppercase tracking-wide text-white/50">Plays</span>
        <button
          type="button"
          onClick={() => canDecrease && onChangeTarget(target - 1)}
          disabled={!canDecrease || !included}
          aria-label={`Decrease plays for ${trackTitle}`}
          className={`${touchTarget} h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <Minus size={12} strokeWidth={2.75} aria-hidden="true" />
        </button>
        <output
          aria-label={`${target} ${target === 1 ? "play" : "plays"}`}
          className="min-w-4 text-center text-xs font-bold tabular-nums text-white"
        >
          {target}
        </output>
        <button
          type="button"
          onClick={() => canIncrease && onChangeTarget(target + 1)}
          disabled={!canIncrease || !included}
          aria-label={`Increase plays for ${trackTitle}`}
          className={`${touchTarget} h-6 w-6 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <Plus size={12} strokeWidth={2.75} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={included}
        onClick={onToggleIncluded}
        aria-label={included ? `Exclude ${trackTitle} from this session` : `Include ${trackTitle} in this session`}
        title={included ? "Included — tap to exclude" : "Excluded — tap to include"}
        className={`${touchTarget} h-7 w-7 ${included ? "text-cyan-400 hover:bg-cyan-500/15" : "text-white/40 hover:bg-white/10 hover:text-white/70"}`}
      >
        {included ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
        <span className="sr-only">{included ? "Included" : "Excluded"}</span>
      </button>
    </div>
  );
}
