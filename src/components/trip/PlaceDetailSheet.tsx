"use client";

import { useEffect } from "react";
import { X, MapPin, Clock, Wallet } from "lucide-react";
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
  entertainment: "bg-rose-50 text-rose-700",
};

interface PlaceDetailSheetProps {
  place: Place;
  startTime?: string;
  endTime?: string;
  onClose: () => void;
}

export function PlaceDetailSheet({
  place,
  startTime,
  endTime,
  onClose,
}: PlaceDetailSheetProps) {
  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent body scroll while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* Sheet panel — stop clicks propagating to backdrop */}
      <div
        className="w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card shadow-xl sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-4">
          <div className="flex items-start gap-2.5">
            <span className="text-2xl leading-none mt-0.5">
              {CATEGORY_EMOJI[place.category]}
            </span>
            <div>
              <h3 className="font-semibold leading-snug text-foreground">
                {place.name}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground/60">
                {place.nameJa}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-px bg-border mx-5" />

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {place.area}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(place.durationMins)}
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            {place.cost}
          </span>
          {startTime && endTime && (
            <span className="font-medium text-foreground/70">
              {startTime} – {endTime}
            </span>
          )}
        </div>

        <div className="h-px bg-border mx-5" />

        {/* Full description */}
        <p className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          {place.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 px-5 pb-6">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                TAG_COLORS[tag]
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
