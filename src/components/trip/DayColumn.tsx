import { CalendarDays } from "lucide-react";
import type { Place } from "@/lib/types";
import { buildDaySchedule } from "@/lib/utils";
import { PlaceCard } from "./PlaceCard";

interface DayColumnProps {
  places: Place[];
}

export function DayColumn({ places }: DayColumnProps) {
  const schedule = buildDaySchedule(places.map((p) => p.durationMins));

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <CalendarDays className="mb-3 h-8 w-8 opacity-40" />
        <p className="text-sm">No places for this day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {places.map((place, idx) => (
        <PlaceCard
          key={place.id}
          place={place}
          index={idx}
          startTime={schedule[idx]?.startTime}
          endTime={schedule[idx]?.endTime}
        />
      ))}

      {/* End-of-day note */}
      <p className="px-1 pt-1 text-xs text-muted-foreground/60">
        Estimated end:{" "}
        {schedule[schedule.length - 1]?.endTime ?? "—"}
      </p>
    </div>
  );
}
