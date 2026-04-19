"use client";

import { X, Clock, MapPin } from "lucide-react";
import type { Place, PlaceCategory } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

// Mirror from PlaceCard — kept local so SwapPanel has no cross-component dep
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

interface SwapPanelProps {
  target: Place;
  alternatives: Place[];
  onSelect: (replacement: Place) => void;
  onClose: () => void;
}

/**
 * Fixed-position overlay listing alternative places for the target.
 * Rendered via createPortal from TripViewer (outside DndContext) — do NOT
 * move this inside a sortable/draggable component (Incident #012).
 */
export function SwapPanel({
  target,
  alternatives,
  onSelect,
  onClose,
}: SwapPanelProps) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-elevated sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Swap
            </p>
            <h3 className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {CATEGORY_EMOJI[target.category]} {target.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alternatives */}
        {alternatives.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No nearby alternatives found.
          </p>
        ) : (
          <ul className="space-y-2">
            {alternatives.map((alt) => (
              <li key={alt.id}>
                <button
                  onClick={() => onSelect(alt)}
                  className="group w-full rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {CATEGORY_EMOJI[alt.category]} {alt.name}
                    </span>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {alt.cost}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alt.area}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(alt.durationMins)}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {alt.description}
                  </p>
                  <span className="mt-2 inline-block text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Choose →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
