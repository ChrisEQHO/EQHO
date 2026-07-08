"use client";

/**
 * Cross-platform drag-and-drop reordering for track lists.
 *
 * Built on dnd-kit so reordering works with BOTH mouse (desktop) and touch
 * (iPhone / iPad / Android / touch laptops):
 *   - MouseSensor  → desktop mouse, drag begins after an 8px move (so a click
 *     still selects/plays the track instead of starting a drag).
 *   - TouchSensor  → touch devices, drag begins after a 200ms press-and-hold
 *     with an 8px tolerance. Before the hold completes the browser scrolls the
 *     list normally, so vertical scrolling still works when not dragging.
 *
 * Auto-scroll is enabled so long playlists scroll while dragging near an edge.
 * The visual appearance of the rows is provided entirely by the caller — this
 * only wires up the drag behaviour and the "make way" animation.
 */

import type { CSSProperties, ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
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
      // Mobile/tablet: press and hold to start dragging; allow scroll before that.
      activationConstraint: { delay: 200, tolerance: 8 },
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
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

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
    // Let the browser scroll the list on touch until the press-and-hold delay
    // promotes the gesture to a drag; dnd-kit then blocks scrolling itself.
    touchAction: "manipulation",
    ...extraStyle,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
