import type { Place, Trip, DayPlan, BudgetLevel, InterestTag, City } from "./types";
import tokyoPlaces from "@/data/places.tokyo.v1.json";

// ─── Data registry (extend here for Week 2 cities) ───────────────────────────

const CITY_PLACES: Record<City, Place[]> = {
  tokyo: tokyoPlaces as Place[],
};

const PLACES_PER_DAY = 4;
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
  const filtered = allPlaces
    .filter((p) => affordable.includes(p.cost))
    .filter(
      (p) =>
        selectedTags.length === 0 ||
        p.tags.some((t) => selectedTags.includes(t))
    )
    .sort((a, b) => b.popularity - a.popularity);

  // Build pool without duplicates; loop the list if we don't have enough
  const desired = days * PLACES_PER_DAY;
  const pool: Place[] = [];
  let pass = 0;
  while (pool.length < desired && filtered.length > 0) {
    const idx = pass % filtered.length;
    const candidate = filtered[idx];
    if (!pool.find((p) => p.id === candidate.id)) {
      pool.push(candidate);
    }
    pass++;
    // Safety valve — avoid infinite loop if filtered list is exhausted
    if (pass > filtered.length * 3) break;
  }

  const dayPlans: DayPlan[] = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    placeIds: pool
      .slice(i * PLACES_PER_DAY, (i + 1) * PLACES_PER_DAY)
      .map((p) => p.id),
  }));

  return { v: 1, city, days, selectedTags, budget, dayPlans };
}

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function getPlaceById(city: City, id: string): Place | undefined {
  return CITY_PLACES[city]?.find((p) => p.id === id);
}

export function getAllPlaces(city: City): Place[] {
  return CITY_PLACES[city] ?? [];
}
