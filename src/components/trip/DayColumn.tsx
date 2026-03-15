"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CalendarDays } from "lucide-react";
import type { Place } from "@/lib/types";
import { buildDaySchedule, formatDuration } from "@/lib/utils";
import { SortablePlaceCard } from "./SortablePlaceCard";

interface DayColumnProps {
  places: Place[];
  onPlaceClick: (place: Place, startTime?: string, endTime?: string) => void;
}

// 30-minute travel buffer between stops, matching itinerary generator + buildDaySchedule
const TRAVEL_BUFFER_MINS = 30;

export function DayColumn({ places, onPlaceClick }: DayColumnProps) {
  const schedule = buildDaySchedule(places.map((p) => p.durationMins));

  const totalMins =
    places.reduce((sum, p) => sum + p.durationMins, 0) +
    Math.max(0, places.length - 1) * TRAVEL_BUFFER_MINS;

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <CalendarDays className="mb-3 h-8 w-8 opacity-40" />
        <p className="text-sm">No places for this day.</p>
      </div>
    );
  }

  return (
    <SortableContext
      items={places.map((p) => p.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="space-y-3">
        {places.map((place, idx) => (
          <SortablePlaceCard
            key={place.id}
            place={place}
            index={idx}
            startTime={schedule[idx]?.startTime}
            endTime={schedule[idx]?.endTime}
            onPlaceClick={onPlaceClick}
          />
        ))}

        <p className="px-1 pt-1 text-xs text-muted-foreground/60">
          ~{formatDuration(totalMins)} total
        </p>
      </div>
    </SortableContext>
  );
}
