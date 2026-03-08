import { Clock, MapPin } from "lucide-react";
import type { Place, PlaceCategory, InterestTag } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  temple: "🏯",
  shrine: "⛩️",
  garden: "🌸",
  food: "🍜",
  shopping: "🛍️",
  museum: "🏛️",
  entertainment: "🎪",
  park: "🌳",
  district: "🗺️",
  landmark: "📍",
};

const TAG_COLORS: Record<InterestTag, string> = {
  culture: "bg-amber-50 text-amber-700",
  food: "bg-orange-50 text-orange-700",
  nature: "bg-green-50 text-green-700",
  shopping: "bg-purple-50 text-purple-700",
  nightlife: "bg-indigo-50 text-indigo-700",
  art: "bg-pink-50 text-pink-700",
  history: "bg-stone-100 text-stone-700",
  anime: "bg-sky-50 text-sky-700",
  architecture: "bg-teal-50 text-teal-700",
};

interface PlaceCardProps {
  place: Place;
  index: number;
  startTime?: string;
  endTime?: string;
}

export function PlaceCard({ place, index, startTime, endTime }: PlaceCardProps) {
  const emoji = CATEGORY_EMOJI[place.category];

  return (
    <div className="group flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-shadow duration-150 hover:shadow-card-hover">
      {/* Index badge */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-base font-bold text-primary ring-1 ring-primary/20">
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        {/* Name row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{emoji}</span>
            <h4 className="text-sm font-semibold leading-snug text-foreground">
              {place.name}
            </h4>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {place.cost}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {place.area}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(place.durationMins)}
          </span>
          {startTime && endTime && (
            <span className="font-medium text-foreground/60">
              {startTime} – {endTime}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {place.description}
        </p>

        {/* Tags */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                TAG_COLORS[tag]
              )}
            >
              {tag}
            </span>
          ))}
          {/* Japanese name */}
          <span className="ml-auto text-[10px] text-muted-foreground/60">
            {place.nameJa}
          </span>
        </div>
      </div>
    </div>
  );
}
