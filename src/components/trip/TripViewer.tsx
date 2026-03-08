"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Calendar, Wallet } from "lucide-react";
import { decodeTripFromHash } from "@/lib/hash";
import { generateItinerary, getPlaceById } from "@/lib/itinerary";
import type { Trip, Place } from "@/lib/types";
import { BUDGET_LABELS } from "@/lib/utils";
import { DayColumn } from "./DayColumn";
import { MapPanel } from "./MapPanel";
import { ShareButton } from "./ShareButton";

// ─── Demo trip (loaded when hash = "demo") ───────────────────────────────────
function getDemoTrip(): Trip {
  return generateItinerary("tokyo", 3, ["culture", "food", "nature"], "$$");
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TripViewer() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [showMobileMap, setShowMobileMap] = useState(false);

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

  return (
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
          {/* Day tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 scrollbar-thin">
            {trip.dayPlans.map((d) => (
              <button
                key={d.day}
                onClick={() => setActiveDay(d.day)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  d.day === activeDay
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Day {d.day}
              </button>
            ))}
          </div>

          {/* Place list */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <DayColumn places={activePlaces} />
          </div>
        </aside>

        {/* ── Right: map (hidden on mobile unless toggled) ── */}
        <main className="hidden flex-1 overflow-hidden p-4 lg:block">
          <MapPanel places={activePlaces} activeDay={activeDay} />
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
            <MapPanel places={activePlaces} activeDay={activeDay} />
          </div>
        )}
      </div>
    </div>
  );
}
