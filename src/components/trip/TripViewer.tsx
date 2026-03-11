"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Calendar, Wallet } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { decodeTripFromHash, encodeTripToHash } from "@/lib/hash";
import { generateItinerary, getPlaceById } from "@/lib/itinerary";
import { reorderDay, movePlaceToDay } from "@/lib/tripEdit";
import type { Trip, Place } from "@/lib/types";
import { BUDGET_LABELS } from "@/lib/utils";
import { DayColumn } from "./DayColumn";
import { MapPanel } from "./MapPanel";
import { PlaceCard } from "./PlaceCard";
import { ShareButton } from "./ShareButton";

// ─── Demo trip ────────────────────────────────────────────────────────────────

function getDemoTrip(): Trip {
  return generateItinerary("tokyo", 3, ["culture", "food", "nature"], "$$");
}

// ─── Droppable day tab ────────────────────────────────────────────────────────
// Extracted as a component so it can call useDroppable (hooks can't be called
// conditionally or inside loops at the parent level).

const DAY_TAB_PREFIX = "day-tab-";

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
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  // Track which day tab the drag pointer is currently over (for highlight)
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  // ── Load trip from hash ──
  useEffect(() => {
    const hash = window.location.hash.replace("#", "").trim();

    if (!hash || hash === "demo") {
      setTrip(getDemoTrip());
      return;
    }

    const decoded = decodeTripFromHash(hash);
    if (decoded) {
      setTrip(decoded);
    } else {
      setError(true);
    }
  }, []);

  // ── Sync URL hash whenever trip changes so ShareButton always shares current state ──
  useEffect(() => {
    if (!trip) return;
    const hash = encodeTripToHash(trip);
    window.history.replaceState(null, "", `#${hash}`);
  }, [trip]);

  // ── dnd-kit sensors ──
  // PointerSensor: 8px activation distance prevents accidental drags on click.
  // TouchSensor: 250ms press delay gives mobile users time to scroll first.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // ── Collision detection ──
  // pointerWithin first: ensures day tabs are hit when the pointer physically
  // overlaps them.  Falls back to closestCenter for within-list reordering.
  function collisionDetection(args: Parameters<typeof pointerWithin>[0]) {
    const hits = pointerWithin(args);
    if (hits.length > 0) return hits;
    return closestCenter(args);
  }

  // ── Drag handlers ──
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

    // ── Cross-day move: dropped on a day tab ──
    if (overId.startsWith(DAY_TAB_PREFIX)) {
      const targetDay = parseInt(overId.slice(DAY_TAB_PREFIX.length), 10);
      if (targetDay !== activeDay) {
        setTrip((prev) =>
          prev ? movePlaceToDay(prev, placeId, activeDay, targetDay) : prev
        );
      }
      return;
    }

    // ── Within-day reorder: dropped on another place card ──
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

  // ── Resolve places ──
  const dayPlaces = (day: number): Place[] =>
    (trip.dayPlans.find((d) => d.day === day)?.placeIds ?? [])
      .map((id) => getPlaceById(trip.city, id))
      .filter((p): p is Place => !!p);

  const activePlaces = dayPlaces(activeDay);
  const cityLabel = trip.city.charAt(0).toUpperCase() + trip.city.slice(1);

  // Place being dragged — used by DragOverlay
  const activeDragPlace = activeDragId
    ? getPlaceById(trip.city, activeDragId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* ── Top bar ── */}
        <header className="z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/build"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Edit trip</span>
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <Image
              src="/images/tabinav-logo.png"
              alt="TabiNav"
              height={80}
              width={120}
              className="h-20 w-auto"
            />
          </div>

          {/* Trip meta */}
          <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {cityLabel}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {trip.days} day{trip.days !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              {BUDGET_LABELS[trip.budget]}
            </span>
          </div>

          <ShareButton />
        </header>

        {/* ── Main layout ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: day tabs + place list ── */}
          <aside className="flex w-full flex-col overflow-hidden border-r border-border bg-muted/20 lg:w-[420px] lg:shrink-0">
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
              {activeDragId && (
                <p className="mb-2 text-center text-[10px] text-muted-foreground/50">
                  Drop on a day tab to move between days
                </p>
              )}
              <DayColumn places={activePlaces} />
            </div>
          </aside>

          {/* ── Right: map ── */}
          <main className="hidden flex-1 overflow-hidden p-4 lg:block">
            <MapPanel places={activePlaces} />
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
              <MapPanel places={activePlaces} />
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
  );
}
