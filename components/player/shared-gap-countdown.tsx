"use client";

import { useId } from "react";
import { Pause, Play } from "lucide-react";

/**
 * The one countdown visual used by every player surface (phone + iPad, normal
 * player + Coach View, and the desktop native-fullscreen coach).
 *
 * The number is SVG <text> with an SVG gradient fill: iPad Safari can fail to
 * paint `background-clip: text` at large sizes, but SVG fills paint reliably.
 * The <svg> is keyed by `count` so every tick mounts a fresh node, and there is
 * no animation, opacity transition or compositor-layer promotion — visibility
 * never depends on an animation advancing.
 */
export function SharedGapCountdown({
  count,
  nextTitle,
  paused,
  onTogglePause,
  mode,
  fill = false,
}: {
  count: number;
  nextTitle: string;
  paused: boolean;
  onTogglePause: () => void;
  mode: "inline" | "fullscreen";
  /**
   * Fullscreen only: use `absolute inset-0` instead of `fixed inset-0`. Needed
   * inside the desktop native-fullscreen element, where fixed children don't
   * paint reliably.
   */
  fill?: boolean;
}) {
  const gradientId = `eqho-gap-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const isFullscreen = mode === "fullscreen";

  const number = (
    <svg
      key={count}
      viewBox="0 0 200 170"
      className={isFullscreen ? "h-[52vh] max-h-[560px] w-auto max-w-[88vw]" : "h-20 w-auto"}
      role="img"
      aria-label={`Next track in ${count} seconds`}
      style={
        isFullscreen
          ? { filter: "drop-shadow(0 0 60px rgba(255,79,163,0.45)) drop-shadow(0 0 120px rgba(255,138,0,0.30))" }
          : { filter: "drop-shadow(0 0 14px rgba(255,79,163,0.45))" }
      }
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff4fa3" />
          <stop offset="100%" stopColor="#ff8a00" />
        </linearGradient>
      </defs>
      <text
        x="100"
        y="92"
        textAnchor="middle"
        dominantBaseline="central"
        fill={`url(#${gradientId})`}
        fontSize="170"
        fontWeight="900"
        style={{ fontFamily: "inherit", letterSpacing: "-0.03em" }}
      >
        {count}
      </text>
    </svg>
  );

  const pauseLabel = paused ? "Resume countdown" : "Pause countdown";

  if (!isFullscreen) {
    return (
      <div className="flex flex-col items-center text-center" aria-live="polite">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Up Next</p>
        <p className="mt-0.5 max-w-full truncate text-sm font-black uppercase tracking-wide text-white">
          {nextTitle}
        </p>
        <div className="mt-1 flex items-center justify-center gap-3">
          {number}
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={pauseLabel}
            aria-pressed={paused}
            className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white shadow-[0_0_20px_rgba(255,79,179,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>
        {paused && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/60" role="status">
            Paused
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`${fill ? "absolute" : "fixed"} inset-0 z-[400] flex flex-col items-center justify-center bg-black`}>
      {number}

      <div className="mt-4 px-6 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-white/50">Up Next</p>
        <p className="text-balance text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">{nextTitle}</p>
      </div>

      <button
        type="button"
        onClick={onTogglePause}
        aria-label={pauseLabel}
        aria-pressed={paused}
        className="mt-8 flex h-16 w-16 touch-manipulation items-center justify-center rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff8a00] text-white shadow-[0_0_30px_rgba(255,79,179,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        {paused ? <Play size={28} /> : <Pause size={28} />}
      </button>
      {paused && (
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.35em] text-white/60" role="status">
          Paused
        </p>
      )}
    </div>
  );
}
