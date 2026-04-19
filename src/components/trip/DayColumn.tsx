"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CalendarDays, Wand2 } from "lucide-react";
import type { Place } from "@/lib/types";
import { buildDaySchedule, formatDuration } from "@/lib/utils";
import { analyzeDayPlaces } from "@/lib/intelligence";
import { SortablePlaceCard } from "./SortablePlaceCard";

interface DayColumnProps {
  places: Place[];
  onPlaceClick: (place: Place, startTime?: string, endTime?: string) => void;
  onSwap: (place: Place) => void;
  onImprove: () => void;
}

// 30-minute travel buffer between stops, matching itinerary generator + buildDaySchedule
const TRAVEL_BUFFER_MINS = 30;

export function DayColumn({ places, onPlaceClick, onSwap, onImprove }: DayColumnProps) {
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

  const dayInsight = analyzeDayPlaces(places);

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
            onSwap={onSwap}
          />
        ))}

        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-xs text-muted-foreground/60">
            ~{formatDuration(totalMins)} total
          </p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary/80">
            {dayInsight.label}
          </span>
        </div>

        {places.length >= 2 && (
          <button
            onClick={onImprove}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Improve this day
          </button>
        )}
      </div>
    </SortableContext>
  );
}
