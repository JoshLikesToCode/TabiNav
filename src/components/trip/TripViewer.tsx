"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import { DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import { encodeTripToHash } from "@/lib/hash";
import { getPlaceById, getAllPlaces } from "@/lib/itinerary";
import { improveDayPlan, findNearbyAlternatives } from "@/lib/suggestions";
import type { Place, Trip, City } from "@/lib/types";
import { BUDGET_LABELS } from "@/lib/utils";
import { analyzeTripPlaces } from "@/lib/intelligence";
import { useTripLoader } from "@/hooks/useTripLoader";
import { useDragHandlers, DAY_TAB_PREFIX } from "@/hooks/useDragHandlers";
import { DayColumn } from "./DayColumn";
import { MapPanel } from "./MapPanel";
import { PlaceCard } from "./PlaceCard";
import { PlaceDetailSheet } from "./PlaceDetailSheet";
import { SwapPanel } from "./SwapPanel";
import { TripHeader } from "./TripHeader";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolves the ordered Place objects for a given day number. */
function resolveDayPlaces(trip: Trip, day: number): Place[] {
  return (trip.dayPlans.find((d) => d.day === day)?.placeIds ?? [])
    .map((id) => getPlaceById(trip.city, id))
    .filter((p): p is Place => !!p);
}

// Tag suggestions shown when a city+filter combination produces zero places.
// Listed in descending coverage order for each city.
const CITY_TAG_SUGGESTIONS: Record<City, string> = {
  tokyo: "Culture, Food, Shopping, or History",
  kyoto: "Culture, History, Architecture, or Nature",
};

// ─── Droppable day tab ────────────────────────────────────────────────────────
// Extracted as a component so useDroppable can be called per-tab without
// violating the rules of hooks (no hooks inside .map()).

function DroppableDayTab({
  day,
  isActive,
  isOver,
  onClick,
}: {
  day: number;
  isActive: boolean;
  isOver: boolean;
  onClick: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: `${DAY_TAB_PREFIX}${day}` });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : isOver
          ? "bg-primary/20 text-primary ring-1 ring-primary/40"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      Day {day}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TripViewer() {
  const { trip, setTrip, error } = useTripLoader();
  const [activeDay, setActiveDay] = useState(1);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<{
    place: Place;
    startTime?: string;
    endTime?: string;
  } | null>(null);
  const [swapTarget, setSwapTarget] = useState<Place | null>(null);

  function handlePlaceClick(place: Place, startTime?: string, endTime?: string) {
    setSelectedPlaceInfo({ place, startTime, endTime });
  }

  function handleSwapClick(place: Place) {
    setSwapTarget(place);
  }

  function handleSwapSelect(replacement: Place) {
    if (!trip || !swapTarget) return;
    const updatedDayPlans = trip.dayPlans.map((d) => ({
      ...d,
      placeIds: d.placeIds.map((id) =>
        id === swapTarget.id ? replacement.id : id
      ),
    }));
    setTrip({ ...trip, dayPlans: updatedDayPlans });
    setSwapTarget(null);
    toast.success(`Swapped for ${replacement.name}`, { duration: 2500 });
  }

  function handleImproveDay() {
    if (!trip) return;
    const allPlaces = getAllPlaces(trip.city);
    const improved = improveDayPlan(activeDay, trip, allPlaces);
    if (improved === trip) {
      toast("Day is already well-optimized", { duration: 2000 });
    } else {
      setTrip(improved);
      toast.success("Day optimized", {
        description: "Reordered stops for better flow.",
        duration: 2500,
      });
    }
  }

  // Sync URL hash whenever trip changes so ShareButton always shares current state.
  useEffect(() => {
    if (!trip) return;
    const hash = encodeTripToHash(trip);
    window.history.replaceState(null, "", `#${hash}`);
  }, [trip]);

  const {
    sensors,
    collisionDetection,
    activeDragId,
    dragOverDay,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragHandlers({ trip, setTrip, activeDay });

  // ── Error state ──
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-4xl">🗺️</p>
        <h2 className="text-xl font-semibold text-foreground">
          Couldn&apos;t load this trip
        </h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          The link might be broken or outdated. Build a new trip below.
        </p>
        <Link
          href="/build"
          className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Build my trip
        </Link>
      </div>
    );
  }

  // ── Loading state ──
  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const activePlaces = resolveDayPlaces(trip, activeDay);
  const hasNoResults = trip.dayPlans.every((d) => d.placeIds.length === 0);
  const cityLabel = trip.city.charAt(0).toUpperCase() + trip.city.slice(1);
  const allDayPlaces = trip.dayPlans.map((d) => resolveDayPlaces(trip, d.day));
  const tripInsight = analyzeTripPlaces(allDayPlaces);
  const activeFilterSummary = [
    cityLabel,
    trip.selectedTags.length > 0
      ? trip.selectedTags
          .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
          .join(", ")
      : null,
    BUDGET_LABELS[trip.budget],
  ]
    .filter(Boolean)
    .join(" · ");
  const activeDragPlace = activeDragId
    ? getPlaceById(trip.city, activeDragId)
    : null;

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <TripHeader trip={trip} />

        {/* ── Main layout ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: day tabs + place list ── */}
          <aside className="flex w-full flex-col overflow-hidden border-r border-border bg-muted/20 lg:w-[420px] lg:shrink-0">
            {/* ── Trip intelligence bar ── */}
            {!hasNoResults && (
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <p className="min-w-0 truncate text-[11px] text-muted-foreground">
                  {tripInsight.summaryLines[0]}
                  {tripInsight.summaryLines[1] && (
                    <span className="ml-2 text-muted-foreground/50">
                      · {tripInsight.summaryLines[1]}
                    </span>
                  )}
                </p>
                <span className="ml-3 shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                  {tripInsight.score}
                </span>
              </div>
            )}

            {/* Day tabs — each is a droppable drop zone for cross-day moves */}
            <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 scrollbar-thin">
              {trip.dayPlans.map((d) => (
                <DroppableDayTab
                  key={d.day}
                  day={d.day}
                  isActive={d.day === activeDay}
                  isOver={dragOverDay === d.day && d.day !== activeDay}
                  onClick={() => setActiveDay(d.day)}
                />
              ))}
            </div>

            {/* Place list */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {hasNoResults ? (
                /* Shown when the tag+budget combination matched zero places. */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="mb-2 text-3xl">🔍</p>
                  <p className="mb-1 text-sm font-semibold text-foreground">
                    No places match your filters
                  </p>
                  <p className="mb-1 text-xs text-muted-foreground/60">
                    {activeFilterSummary}
                  </p>
                  <p className="mb-5 max-w-[220px] text-xs text-muted-foreground">
                    Try {CITY_TAG_SUGGESTIONS[trip.city]} for the best{" "}
                    {cityLabel} results.
                  </p>
                  <Link
                    href="/build"
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Edit trip
                  </Link>
                </div>
              ) : (
                <>
                  {activeDragId && (
                    <p className="mb-2 text-center text-[10px] text-muted-foreground/50">
                      Drop on a day tab to move between days
                    </p>
                  )}
                  <DayColumn
                    places={activePlaces}
                    onPlaceClick={handlePlaceClick}
                    onSwap={handleSwapClick}
                    onImprove={handleImproveDay}
                  />
                </>
              )}
            </div>
          </aside>

          {/* ── Right: map ── */}
          <main className="hidden flex-1 overflow-hidden p-4 lg:block">
            <MapPanel places={activePlaces} city={trip.city} />
          </main>
        </div>

        {/* ── Mobile: map toggle bar + expandable map ── */}
        <div className="flex-none lg:hidden">
          <div className="border-t border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {activePlaces.length} stops · Day {activeDay}
              </span>
              <button
                onClick={() => setShowMobileMap((v) => !v)}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
              >
                {showMobileMap ? "Hide map" : "Show map"}
              </button>
            </div>
          </div>
          {showMobileMap && (
            <div className="h-[40vh] overflow-hidden border-t border-border">
              <MapPanel places={activePlaces} city={trip.city} />
            </div>
          )}
        </div>
      </div>

      {/* ── Drag overlay — floating card that follows the pointer ── */}
      <DragOverlay dropAnimation={null}>
        {activeDragPlace ? (
          <div className="flex items-start gap-1 rotate-1 opacity-95 drop-shadow-xl">
            <div className="mt-[18px] w-4 shrink-0" /> {/* grip placeholder */}
            <div className="min-w-0 flex-1">
              <PlaceCard place={activeDragPlace} index={0} />
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>

    {/* Detail sheet — rendered outside DndContext so dnd-kit's event handling
        cannot interfere. Portal escapes any stacking context within the app. */}
    {selectedPlaceInfo &&
      createPortal(
        <PlaceDetailSheet
          place={selectedPlaceInfo.place}
          startTime={selectedPlaceInfo.startTime}
          endTime={selectedPlaceInfo.endTime}
          onClose={() => setSelectedPlaceInfo(null)}
        />,
        document.body
      )}

    {/* Swap panel — outside DndContext for the same reason (Incident #012). */}
    {swapTarget &&
      trip &&
      createPortal(
        <SwapPanel
          target={swapTarget}
          alternatives={findNearbyAlternatives(
            swapTarget,
            trip,
            getAllPlaces(trip.city)
          )}
          onSelect={handleSwapSelect}
          onClose={() => setSwapTarget(null)}
        />,
        document.body
      )}
    </>
  );
}
