import { useState, type Dispatch, type SetStateAction } from "react";
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { reorderDay, movePlaceToDay } from "@/lib/tripEdit";
import type { Trip } from "@/lib/types";

// Shared prefix for droppable day-tab IDs — used by the hook and DroppableDayTab.
export const DAY_TAB_PREFIX = "day-tab-";

interface UseDragHandlersArgs {
  trip: Trip | null;
  setTrip: Dispatch<SetStateAction<Trip | null>>;
  activeDay: number;
}

/**
 * Encapsulates all dnd-kit state and event handlers for TripViewer.
 * Handles within-day reordering and cross-day moves (appended to end of target day).
 */
export function useDragHandlers({ trip, setTrip, activeDay }: UseDragHandlersArgs) {
  // ID of the place card currently being dragged, or null when idle.
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  // Day number whose tab the drag pointer is over (for highlight), or null.
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  // 8px distance prevents accidental drags on tap/click.
  // 250ms touch delay gives mobile users time to scroll first.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // pointerWithin first: ensures day tabs are hit when the pointer physically
  // overlaps them. Falls back to closestCenter for within-list reordering.
  function collisionDetection(args: Parameters<typeof pointerWithin>[0]) {
    const hits = pointerWithin(args);
    if (hits.length > 0) return hits;
    return closestCenter(args);
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveDragId(active.id as string);
  }

  function handleDragOver({ over }: { over: DragEndEvent["over"] }) {
    if (!over) {
      setDragOverDay(null);
      return;
    }
    const id = over.id as string;
    if (id.startsWith(DAY_TAB_PREFIX)) {
      setDragOverDay(parseInt(id.slice(DAY_TAB_PREFIX.length), 10));
    } else {
      setDragOverDay(null);
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveDragId(null);
    setDragOverDay(null);

    if (!over || !trip) return;

    const placeId = active.id as string;
    const overId = over.id as string;

    // Cross-day move: dropped on a day tab → appended to the end of the target day.
    if (overId.startsWith(DAY_TAB_PREFIX)) {
      const targetDay = parseInt(overId.slice(DAY_TAB_PREFIX.length), 10);
      if (targetDay !== activeDay) {
        setTrip((prev) =>
          prev ? movePlaceToDay(prev, placeId, activeDay, targetDay) : prev
        );
      }
      return;
    }

    // Within-day reorder: dropped on another place card.
    if (placeId !== overId) {
      const plan = trip.dayPlans.find((d) => d.day === activeDay);
      if (!plan) return;
      const oldIdx = plan.placeIds.indexOf(placeId);
      const newIdx = plan.placeIds.indexOf(overId);
      if (oldIdx !== -1 && newIdx !== -1) {
        setTrip((prev) =>
          prev ? reorderDay(prev, activeDay, oldIdx, newIdx) : prev
        );
      }
    }
  }

  function handleDragCancel() {
    setActiveDragId(null);
    setDragOverDay(null);
  }

  return {
    sensors,
    collisionDetection,
    activeDragId,
    dragOverDay,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
