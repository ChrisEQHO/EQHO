"use client";

/**
 * Cross-platform drag-and-drop reordering for track lists.
 *
 * Built on dnd-kit so reordering works with BOTH mouse (desktop) and touch
 * (iPhone / iPad / Android / Capacitor webview):
 *   - MouseSensor → desktop mouse, drag begins after an 8px move (so a click
 *     still selects/plays the track instead of starting a drag).
 *   - TouchSensor → touch devices, drag begins after a 180ms press-and-hold.
 *
 * WHY A DRAG HANDLE:
 * On a scrollable touch list you cannot make the *whole row* reliably draggable,
 * because the mobile browser claims the vertical gesture for scrolling before
 * dnd-kit can promote it to a drag. The reliable, documented fix is a dedicated
 * drag handle with `touch-action: none` (only the handle opts out of native
 * scrolling), while the rest of the row keeps normal tap-to-play and scrolling.
 *
 * The row therefore wires up:
 *   - the sortable node + transform animation (rows animate out of the way), and
 *   - a <TrackDragHandle> (exposed via context) that carries the drag listeners.
 * Whole-row press-and-hold is ALSO kept as a convenience where the browser
 * allows it, but the handle is what guarantees reliability on mobile.
 */

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableTrackList({
  ids,
  onReorder,
  children,
}: {
  /** Track ids in the exact order they are rendered. */
  ids: string[];
  /** Called on drop with the dragged track id and the track id it was dropped onto. */
  onReorder: (activeId: string, overId: string) => void;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Desktop: require a small drag before activating so plain clicks still work.
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      // Mobile/tablet: press and hold to start dragging; a move during the delay
      // is treated as a scroll, so normal scrolling still works when not dragging.
      activationConstraint: { delay: 180, tolerance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
      autoScroll={{ threshold: { x: 0, y: 0.2 } }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/**
 * Context that hands the current row's drag listeners down to <TrackDragHandle>,
 * so the caller can place the handle anywhere inside the row layout.
 */
type SortableListeners = ReturnType<typeof useSortable>["listeners"];
type DragHandleCtx = {
  attributes: Record<string, unknown>;
  listeners: SortableListeners;
  setActivatorNodeRef: (el: HTMLElement | null) => void;
};
const TrackDragHandleContext = createContext<DragHandleCtx | null>(null);

export function SortableTrackItem({
  id,
  className,
  onClick,
  children,
  style: extraStyle,
}: {
  id: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 30 : undefined,
    position: "relative",
    // The row keeps normal touch behaviour (tap to play, scroll the list).
    // Only the drag handle opts out of native scrolling (touch-action: none),
    // which is what makes touch dragging reliable without breaking scrolling.
    ...extraStyle,
  };

  return (
    <TrackDragHandleContext.Provider
      value={{ attributes: attributes as Record<string, unknown>, listeners, setActivatorNodeRef }}
    >
      <div ref={setNodeRef} style={style} className={className} onClick={onClick}>
        {children}
      </div>
    </TrackDragHandleContext.Provider>
  );
}

/**
 * Drag handle to place inside a SortableTrackItem. Carries the drag listeners
 * and sets `touch-action: none` so touch dragging is reliable on mobile.
 * Renders its children (e.g. a grip icon). Stops click propagation so tapping
 * the handle never triggers the row's play/select onClick.
 */
export function TrackDragHandle({
  children,
  className,
  ariaLabel = "Drag to reorder",
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const ctx = useContext(TrackDragHandleContext);

  return (
    <button
      type="button"
      ref={ctx?.setActivatorNodeRef}
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      className={className}
      style={{ touchAction: "none", cursor: "grab" }}
      {...(ctx?.attributes ?? {})}
      {...(ctx?.listeners ?? {})}
    >
      {children}
    </button>
  );
}
