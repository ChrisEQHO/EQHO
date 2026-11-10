"use client";

import { useEffect, useRef } from "react";
import { GripVertical } from "lucide-react";
import { SortableTrackItem, TrackDragHandle } from "@/components/sortable-track-list";
import { PlayCountBadge } from "@/components/play-count-badge";
import { STATUS_STYLE, TrackPlaysControl } from "@/components/player/track-plays-control";
import type { TrackRowStatus } from "@/lib/playback/track-plays";

type QueueTrackRowProps = {
  id: string;
  order: number;
  title: string;
  duration: string;
  status: TrackRowStatus;
  target: number;
  included: boolean;
  isCurrent: boolean;
  isPlaying: boolean;
  /** Finished every play/round this session — shown dimmed. */
  isFinished: boolean;
  completionCount: number;
  orderColourClass: string;
  /** Extra context for the status line, e.g. gap countdown or round. */
  note?: string;
  onSelect: () => void;
  onChangeTarget: (value: number) => void;
  onToggleIncluded: () => void;
  /** "button" = labelled Hide/Show button (full-screen queue only). */
  visibilityControl?: "switch" | "button";
};

/**
 * One compact Up Next row, shared by the normal and full-screen queues so both
 * render identical state through identical handlers.
 * Layout: Drag | Order | Title + status | Duration | Plays | Include.
 * Must be rendered inside a SortableTrackList, inside a `[data-queue-scroll]`
 * `@container` scroll area (used for auto-scroll and responsive columns).
 */
export function QueueTrackRow({
  id,
  order,
  title,
  duration,
  status,
  target,
  included,
  isCurrent,
  isPlaying,
  isFinished,
  completionCount,
  orderColourClass,
  note,
  onSelect,
  onChangeTarget,
  onToggleIncluded,
  visibilityControl = "switch",
}: QueueTrackRowProps) {
  const usesButton = visibilityControl === "button";
  // Button variant fades row content individually so the Show action stays vivid.
  const hiddenFade = usesButton && !included ? "opacity-70" : "";
  const rowRef = useRef<HTMLDivElement>(null);

  // Keep the current track visible as playback advances, without moving the
  // list while the user is operating a control on a different row.
  useEffect(() => {
    if (!isCurrent) return;
    const row = rowRef.current;
    const scroller = row?.closest<HTMLElement>("[data-queue-scroll]");
    if (!row || !scroller) return;
    const focused = document.activeElement;
    if (focused && focused !== document.body && scroller.contains(focused) && !row.contains(focused)) return;
    const r = row.getBoundingClientRect();
    const s = scroller.getBoundingClientRect();
    if (s.height === 0) return;
    if (r.top < s.top || r.bottom > s.bottom) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scroller.scrollBy({ top: r.top - s.top - 8, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }, [isCurrent]);

  const { icon: StatusIcon, className: statusClass } = STATUS_STYLE[status.kind];
  const statusLabel = isCurrent && included
    ? `${isPlaying ? "Playing" : "Current"}${status.label !== "Current" ? ` · ${status.label}` : ""}`
    : status.label;

  const stateClass = !included
    ? "border-dashed border-white/20 bg-transparent"
    : isCurrent
      ? "border-[#ff4fa3]/60 bg-gradient-to-r from-[#ff4fa3]/25 to-[#ff8a00]/15"
      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]";

  return (
    <SortableTrackItem
      id={id}
      onClick={() => {
        if (included) onSelect();
      }}
      className={`h-[72px] shrink-0 rounded-lg border transition-colors data-[drop-target]:ring-2 data-[drop-target]:ring-cyan-400/70 data-[dragging]:shadow-[0_8px_24px_rgba(0,0,0,0.5)] ${
        included ? "cursor-pointer" : "cursor-default"
      } ${stateClass}`}
    >
      <div
        ref={rowRef}
        aria-current={isCurrent ? "true" : undefined}
        className={`flex h-full w-full items-center gap-1 pr-1 ${
          !included ? (usesButton ? "" : "opacity-60") : isFinished ? "opacity-55" : ""
        }`}
      >
        <TrackDragHandle
          ariaLabel={`Reorder ${title}. Press space, then use arrow keys`}
          className={`${hiddenFade} flex min-h-11 min-w-9 shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/40 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70`}
        >
          <GripVertical size={16} aria-hidden="true" />
        </TrackDragHandle>

        <span
          className={`${hiddenFade} w-7 shrink-0 text-center text-lg font-black tabular-nums leading-none ${
            included ? orderColourClass : "text-white/50"
          }`}
          aria-label={`Position ${order}`}
        >
          {order}
        </span>

        <div className={`${hiddenFade} min-w-0 flex-1 pl-1`}>
          <div className="flex min-w-0 items-center gap-1.5">
            <p
              title={title}
              className={`truncate text-sm font-semibold leading-tight ${
                !included ? "text-white/70" : isCurrent ? "text-white" : "text-white/90"
              }`}
            >
              {title}
            </p>
            {included && <PlayCountBadge count={completionCount} />}
          </div>
          <p
            className={`mt-1 flex min-w-0 items-center gap-1 text-[11px] font-semibold leading-none ${
              isCurrent && included ? "text-[#ffb36b]" : statusClass
            }`}
            data-status={status.kind}
            aria-live={isCurrent ? "polite" : undefined}
          >
            {isCurrent && isPlaying && included ? (
              <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-0.5 animate-pulse rounded-full bg-[#ff4fa3]"
                    style={{ height: `${4 + i * 2}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </span>
            ) : (
              <StatusIcon size={11} className="shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">
              {statusLabel}
              {note ? ` · ${note}` : ""}
            </span>
            {usesButton && !included && (
              <span className="shrink-0 rounded border border-white/25 px-1 py-px text-[10px] font-bold uppercase tracking-wide text-white/80">
                Hidden
              </span>
            )}
          </p>
        </div>

        <span className={`${hiddenFade} w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-white/70 @max-[300px]:hidden`}>
          <span className="sr-only">Duration </span>
          {duration}
        </span>

        <TrackPlaysControl
          trackTitle={title}
          target={target}
          included={included}
          status={status}
          layout="compact"
          onChangeTarget={onChangeTarget}
          onToggleIncluded={onToggleIncluded}
          visibilityControl={visibilityControl}
          hideLocked={usesButton && included && isCurrent && isPlaying}
        />
      </div>
    </SortableTrackItem>
  );
}
