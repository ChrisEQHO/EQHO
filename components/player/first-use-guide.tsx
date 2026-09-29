"use client";

import { Cloud, FolderUp, Lightbulb, ListPlus, Play, X } from "lucide-react";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

type FirstUseStepsProps = {
  uploadInputId: string;
  onOpenCloud: () => void;
  compact?: boolean;
};

export function FirstUseSteps({ uploadInputId, onOpenCloud, compact = false }: FirstUseStepsProps) {
  const pad = compact ? "p-4" : "p-6";
  return (
    <section
      aria-labelledby="first-use-heading"
      className={`flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] ${pad} text-left`}
    >
      <div className="flex flex-col gap-1">
        <h3 id="first-use-heading" className="text-sm font-bold text-white text-balance">
          Get your music ready
        </h3>
        <p className="text-xs leading-relaxed text-white/60 text-pretty">
          Each playlist is normally one folder holding a single athlete&apos;s or group&apos;s routine music.
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        <li>
          <button
            type="button"
            onClick={() => document.getElementById(uploadInputId)?.click()}
            className={`flex w-full items-center gap-3 rounded-lg bg-pink-500/15 px-3 py-2.5 text-left text-sm font-semibold text-white transition hover:bg-pink-500/25 ${FOCUS_RING}`}
          >
            <StepNumber n={1} />
            <FolderUp size={16} className="shrink-0 text-pink-300" aria-hidden="true" />
            Upload a playlist folder
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={onOpenCloud}
            className={`flex w-full items-center gap-3 rounded-lg border border-violet-400/25 px-3 py-2.5 text-left text-sm font-semibold text-white/85 transition hover:bg-violet-500/10 ${FOCUS_RING}`}
          >
            <StepNumber n={2} />
            <Cloud size={16} className="shrink-0 text-violet-300" aria-hidden="true" />
            Or open EQHO Cloud
          </button>
        </li>
        <li className="flex items-center gap-3 px-3 py-1.5 text-sm text-white/60">
          <StepNumber n={3} />
          <ListPlus size={16} className="shrink-0 text-white/40" aria-hidden="true" />
          Add a playlist to your session
        </li>
        <li className="flex items-center gap-3 px-3 py-1.5 text-sm text-white/60">
          <StepNumber n={4} />
          <Play size={16} className="shrink-0 text-white/40" aria-hidden="true" />
          Press play
        </li>
      </ol>
    </section>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/70"
    >
      {n}
    </span>
  );
}

export function SessionTip({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-28 z-[60] mx-auto flex max-w-sm gap-3 rounded-xl border border-cyan-300/30 bg-[#0b0b12]/95 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur sm:inset-x-auto sm:right-6"
    >
      <Lightbulb size={18} className="mt-0.5 shrink-0 text-cyan-300" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-sm font-semibold">Your session is ready</p>
        <ul className="flex flex-col gap-1 text-xs leading-relaxed text-white/70">
          <li>
            <span className="font-semibold text-white">Add</span> builds one combined session queue.
          </li>
          <li>
            <span className="font-semibold text-white">Open</span> replaces the current session.
          </li>
          <li>Drag tracks to reorder them before you press play.</li>
          <li>Downloaded playlists work offline.</li>
        </ul>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss tip"
        className={`-m-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white ${FOCUS_RING}`}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
