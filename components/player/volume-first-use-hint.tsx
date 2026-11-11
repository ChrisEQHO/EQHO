"use client";

import { Volume2, X } from "lucide-react";

export const VOLUME_HINT_STORAGE_KEY = "eqho-volume-hint-seen";

type VolumeFirstUseHintProps = {
  onDismiss: () => void;
  deviceVolumeOnly?: boolean;
  placement?: "below-end" | "above-center";
};

export function VolumeFirstUseHint({
  onDismiss,
  deviceVolumeOnly = false,
  placement = "below-end",
}: VolumeFirstUseHintProps) {
  const positionClass =
    placement === "above-center"
      ? "bottom-full left-1/2 mb-3 -translate-x-1/2"
      : "top-full right-0 mt-3";
  const arrowClass =
    placement === "above-center"
      ? "-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r"
      : "-top-1.5 right-5 border-l border-t";

  return (
    <div
      role="status"
      className={`absolute z-50 w-60 rounded-xl border border-pink-500/50 bg-[#141a2b] p-3 text-left shadow-[0_8px_30px_rgba(0,0,0,0.5)] ${positionClass}`}
    >
      <span
        aria-hidden="true"
        className={`absolute h-3 w-3 rotate-45 border-pink-500/50 bg-[#141a2b] ${arrowClass}`}
      />
      <div className="relative flex items-start gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#ff4fa3] to-[#ff8a00] text-white">
          <Volume2 size={14} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-sm font-bold text-white">Volume</p>
          <p className="text-xs leading-relaxed text-white/70 text-pretty">
            {deviceVolumeOnly
              ? "Tap the speaker to mute. Use your device buttons to change the level."
              : "Tap the speaker to mute. Drag the bar to change the level."}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss volume tip"
          className="-m-1 grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
