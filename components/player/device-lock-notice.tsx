"use client";

import { AlertTriangle } from "lucide-react";

type DeviceLockNoticeProps = {
  onDismiss: () => void;
  className?: string;
};

export function DeviceLockNotice({ onDismiss, className = "" }: DeviceLockNoticeProps) {
  return (
    <div
      role="status"
      className={`mx-auto flex w-full max-w-md items-center gap-2.5 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-left ${className}`}
    >
      <AlertTriangle size={16} className="shrink-0 text-amber-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug text-white/90">
          Keep this device unlocked during playback
        </p>
        <p className="text-xs leading-snug text-white/60">
          Locking your phone or tablet may interrupt the music.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Got it, hide the device-lock reminder for this session"
        className="inline-flex min-h-8 shrink-0 items-center rounded-md border border-amber-400/30 px-2.5 text-xs font-semibold text-amber-300 outline-none transition hover:bg-amber-400/10 hover:text-amber-200 active:bg-amber-400/20 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070d1a] [@media(pointer:coarse)]:min-h-11"
      >
        Got it
      </button>
    </div>
  );
}
