import type { Place, Trip, DayPlan, BudgetLevel, InterestTag, City } from "./types";
import rawTokyoPlaces from "@/data/places.tokyo.v1.json";
import rawKyotoPlaces from "@/data/places.kyoto.v1.json";

// ─── Dataset loader ───────────────────────────────────────────────────────────
// Validates each JSON record at the dataset boundary, replacing the unsafe
// `as Place[]` cast.  Enum fields are trusted from the data file; the hash
// decoder handles enum validation at the network boundary.

function loadPlaces(data: unknown): Place[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Place => {
    if (typeof item !== "object" || item === null) return false;
    const p = item as Record<string, unknown>;
    return (
      typeof p.id === "string" &&
      typeof p.name === "string" &&
      typeof p.nameJa === "string" &&
      typeof p.lat === "number" &&
      typeof p.lng === "number" &&
      typeof p.durationMins === "number"
    );
  });
}

// ─── Data registry (add an entry here when new cities ship) ──────────────────

const CITY_PLACES: Record<City, Place[]> = {
  tokyo: loadPlaces(rawTokyoPlaces),
  kyoto: loadPlaces(rawKyotoPlaces),
};

// Each day is capped at 8 hours of activity; 30 minutes of travel between stops
const MAX_DAY_MINUTES = 480;
const TRAVEL_BUFFER_MINS = 30;
const BUDGET_ORDER: BudgetLevel[] = ["$", "$$", "$$$"];

// ─── Core generator ──────────────────────────────────────────────────────────

export function generateItinerary(
  city: City,
  days: number,
  selectedTags: InterestTag[],
  budget: BudgetLevel
): Trip {
  const allPlaces = CITY_PLACES[city] ?? [];

  // Include places that cost at-or-below the selected budget tier
  const maxIdx = BUDGET_ORDER.indexOf(budget);
  const affordable = BUDGET_ORDER.slice(0, maxIdx + 1);

  // Filter by budget and tags, then sort by popularity descending
  const candidates = allPlaces
    .filter((p) => affordable.includes(p.cost))
    .filter(
      (p) =>
        selectedTags.length === 0 ||
        p.tags.some((t) => selectedTags.includes(t))
    )
    .sort((a, b) => b.popularity - a.popularity);

  // Greedy time-based fill: consume candidates in order, rolling over to the
  // next day whenever adding a place (plus a 30-min travel buffer) would
  // exceed MAX_DAY_MINUTES.  The first place in each day always gets added
  // regardless of duration so no place is ever silently skipped.
  const dayPlans: DayPlan[] = [];
  let dayIdx = 0;
  let dayMinutes = 0;
  let dayPlaceIds: string[] = [];

  for (const place of candidates) {
    if (dayIdx >= days) break;

    const travel = dayPlaceIds.length === 0 ? 0 : TRAVEL_BUFFER_MINS;
    const cost = travel + place.durationMins;

    if (dayPlaceIds.length === 0 || dayMinutes + cost <= MAX_DAY_MINUTES) {
      dayPlaceIds.push(place.id);
      dayMinutes += cost;
    } else {
      // Current day is full — close it and retry this place on the next day
      dayPlans.push({ day: dayIdx + 1, placeIds: dayPlaceIds });
      dayIdx++;
      if (dayIdx >= days) break;

      dayPlaceIds = [place.id];
      dayMinutes = place.durationMins;
    }
  }

  // Close the last in-progress day
  if (dayIdx < days && dayPlaceIds.length > 0) {
    dayPlans.push({ day: dayIdx + 1, placeIds: dayPlaceIds });
    dayIdx++;
  }

  // Pad any remaining days with empty plans (edge case: few places, many days)
  while (dayPlans.length < days) {
    dayPlans.push({ day: dayPlans.length + 1, placeIds: [] });
  }

  return { v: 1, city, days, selectedTags, budget, dayPlans };
}

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function getPlaceById(city: City, id: string): Place | undefined {
  return CITY_PLACES[city]?.find((p) => p.id === id);
}

export function getAllPlaces(city: City): Place[] {
  return CITY_PLACES[city] ?? [];
}
