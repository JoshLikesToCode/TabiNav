"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { PlaceCard } from "./PlaceCard";
import type { Place } from "@/lib/types";

interface SortablePlaceCardProps {
  place: Place;
  index: number;
  startTime?: string;
  endTime?: string;
}

export function SortablePlaceCard({
  place,
  index,
  startTime,
  endTime,
}: SortablePlaceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      // Fade the origin slot to indicate the card is "in flight"
      className={`flex items-start gap-1 ${isDragging ? "opacity-0" : ""}`}
    >
      {/* Drag handle — only this element triggers the drag */}
      <button
        {...attributes}
        {...listeners}
        className="mt-[18px] shrink-0 cursor-grab touch-none text-muted-foreground/25 hover:text-muted-foreground/60 active:cursor-grabbing"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <PlaceCard
          place={place}
          index={index}
          startTime={startTime}
          endTime={endTime}
        />
      </div>
    </div>
  );
}
