"use client";

import type { CSSProperties } from "react";
import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";

type VolumeLevelIconProps = {
  volume: number;
  muted: boolean;
  size: number;
};

export function VolumeLevelIcon({ volume, muted, size }: VolumeLevelIconProps) {
  if (muted) return <VolumeX size={size} aria-hidden="true" />;
  if (volume === 0) return <Volume size={size} aria-hidden="true" />;
  if (volume < 50) return <Volume1 size={size} aria-hidden="true" />;
  return <Volume2 size={size} aria-hidden="true" />;
}

type PlayerVolumeControlProps = {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  useDeviceButtons?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: { button: "h-8 w-8", icon: 16, slider: "w-24", readout: "text-[11px] w-8" },
  md: { button: "h-10 w-10", icon: 20, slider: "w-32", readout: "text-xs w-9" },
  lg: { button: "h-12 w-12", icon: 22, slider: "w-40", readout: "text-sm w-10" },
} as const;

export function PlayerVolumeControl({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  useDeviceButtons = false,
  size = "md",
  className = "",
}: PlayerVolumeControlProps) {
  const s = SIZES[size];
  const level = muted ? 0 : volume;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
        title={muted ? "Unmute" : "Mute"}
        className={`grid ${s.button} shrink-0 place-items-center rounded-full transition ${
          muted ? "bg-red-500/15 text-red-400 hover:bg-red-500/25" : "text-white/85 hover:bg-white/10 hover:text-white"
        }`}
      >
        <VolumeLevelIcon volume={volume} muted={muted} size={s.icon} />
      </button>
      {useDeviceButtons ? (
        <span className="max-w-[200px] text-[11px] leading-tight text-white/60">
          Use your device volume buttons to adjust playback volume.
        </span>
      ) : (
        <>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={level}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Volume"
            aria-valuetext={muted ? "Muted" : `${volume}%`}
            className={`eqho-volume-range ${s.slider} shrink-0`}
            style={{ "--eqho-volume": `${level}%` } as CSSProperties}
          />
          <span className={`${s.readout} shrink-0 tabular-nums text-white/60`} aria-hidden="true">
            {muted ? "Off" : `${volume}%`}
          </span>
        </>
      )}
    </div>
  );
}
