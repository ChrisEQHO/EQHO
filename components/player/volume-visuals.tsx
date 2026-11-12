"use client";

import { Minus, Plus, Volume, Volume1, Volume2, VolumeX } from "lucide-react";

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

type VolumeSliderVisualsProps = {
  volume: number;
  muted: boolean;
  compact?: boolean;
};

export function VolumeSliderVisuals({ volume, muted, compact = false }: VolumeSliderVisualsProps) {
  const level = muted ? 0 : volume;
  return (
    <>
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#ff4fa3]/45 to-[#ff8a00]/45 transition-[width] duration-150"
          style={{ width: `${level}%` }}
        />
      </div>
      <div
        className="absolute top-1 bottom-1 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,79,163,0.8)] pointer-events-none"
        style={{ left: `clamp(4px, ${level}%, calc(100% - 4px))` }}
        aria-hidden="true"
      />
      {!compact && (
        <>
          <Minus size={10} className="absolute left-1.5 z-10 text-white/60 pointer-events-none" aria-hidden="true" />
          <Plus size={10} className="absolute right-1.5 z-10 text-white/60 pointer-events-none" aria-hidden="true" />
        </>
      )}
      <span
        className={`absolute inset-0 grid place-items-center z-10 font-bold text-white tabular-nums pointer-events-none ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        {muted ? "Muted" : `${volume}%`}
      </span>
    </>
  );
}
