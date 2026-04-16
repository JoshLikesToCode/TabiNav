import type { Place, Trip, DayPlan, BudgetLevel, InterestTag, City } from "./types";
import rawTokyoPlaces from "@/data/places.tokyo.v1.json";
import rawKyotoPlaces from "@/data/places.kyoto.v1.json";

// ─── Dataset loader ───────────────────────────────────────────────────────────
// Validates every required Place field at the dataset boundary.
// Malformed entries are silently dropped so a single bad record never
// corrupts the entire city dataset.

const VALID_PLACE_CITIES = new Set<string>(["tokyo", "kyoto"]);
const VALID_PLACE_CATEGORIES = new Set<string>([
  "temple", "shrine", "garden", "food", "shopping",
  "museum", "entertainment", "park", "district", "landmark",
]);
const VALID_PLACE_TAGS = new Set<string>([
  "culture", "food", "nature", "shopping", "nightlife",
  "art", "history", "anime", "architecture", "entertainment",
]);
const VALID_PLACE_COSTS = new Set<string>(["$", "$$", "$$$"]);

// ─── Dev-mode diagnostic ──────────────────────────────────────────────────────
// Identifies the first failing validation field in a dropped entry.
// Mirrors the validation predicate in loadPlaces — keep both in sync when
// adding new required fields.  Never called in production.

function warnDropped(p: Record<string, unknown>): void {
  const id = typeof p.id === "string" && p.id ? p.id : "(no id)";
  let reason = "unknown field";

  if (typeof p.id !== "string" || !p.id) {
    reason = "id missing or empty";
  } else if (typeof p.name !== "string" || !p.name) {
    reason = "name missing or empty";
  } else if (typeof p.nameJa !== "string") {
    reason = "nameJa not a string";
  } else if (typeof p.city !== "string" || !VALID_PLACE_CITIES.has(p.city)) {
    reason = `city "${p.city}" not in [${[...VALID_PLACE_CITIES].join(", ")}]`;
  } else if (typeof p.category !== "string" || !VALID_PLACE_CATEGORIES.has(p.category)) {
    reason = `category "${p.category}" not recognized`;
  } else if (!Array.isArray(p.tags)) {
    reason = "tags must be an array";
  } else if ((p.tags as unknown[]).some((t) => typeof t !== "string" || !VALID_PLACE_TAGS.has(t as string))) {
    const bad = (p.tags as unknown[]).find((t) => typeof t !== "string" || !VALID_PLACE_TAGS.has(t as string));
    reason = `unknown tag "${bad}"`;
  } else if (typeof p.cost !== "string" || !VALID_PLACE_COSTS.has(p.cost)) {
    reason = `cost "${p.cost}" — expected $, $$, or $$$`;
  } else if (typeof p.durationMins !== "number" || p.durationMins <= 0) {
    reason = `durationMins "${p.durationMins}" must be a positive number`;
  } else if (typeof p.popularity !== "number" || p.popularity < 0 || p.popularity > 100) {
    reason = `popularity "${p.popularity}" must be 0–100`;
  } else if (typeof p.description !== "string" || !p.description) {
    reason = "description missing or empty";
  } else if (typeof p.area !== "string" || !p.area) {
    reason = "area missing or empty";
  } else if (typeof p.lat !== "number") {
    reason = `lat is not a number (got ${typeof p.lat})`;
  } else if (typeof p.lng !== "number") {
    reason = `lng is not a number (got ${typeof p.lng})`;
  }

  console.warn(`[TabiNav] loadPlaces: dropped "${id}" — ${reason}`);
}

function loadPlaces(data: unknown): Place[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Place => {
    if (typeof item !== "object" || item === null) return false;
    const p = item as Record<string, unknown>;
    const ok = (
      typeof p.id === "string" && p.id.length > 0 &&
      typeof p.name === "string" && p.name.length > 0 &&
      typeof p.nameJa === "string" &&
      typeof p.city === "string" && VALID_PLACE_CITIES.has(p.city) &&
      typeof p.category === "string" && VALID_PLACE_CATEGORIES.has(p.category) &&
      Array.isArray(p.tags) &&
      (p.tags as unknown[]).every((t) => typeof t === "string" && VALID_PLACE_TAGS.has(t)) &&
      typeof p.cost === "string" && VALID_PLACE_COSTS.has(p.cost) &&
      typeof p.durationMins === "number" && p.durationMins > 0 &&
      typeof p.popularity === "number" && p.popularity >= 0 && p.popularity <= 100 &&
      typeof p.description === "string" && p.description.length > 0 &&
      typeof p.area === "string" && p.area.length > 0 &&
      typeof p.lat === "number" &&
      typeof p.lng === "number"
    );
    if (!ok && process.env.NODE_ENV !== "production") {
      warnDropped(p);
    }
    return ok;
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

// Areas within this radius of the anchor are eligible for same-day fill
const NEARBY_AREA_KM = 5;

// ─── Area-aware itinerary helpers ─────────────────────────────────────────────

interface AreaGroup {
  area: string;
  places: Place[];                      // sorted popularity desc
  centroid: { lat: number; lng: number };
  score: number;                        // sum of popularity — used for anchor ranking
}

function buildAreaGroups(places: Place[]): AreaGroup[] {
  const byArea = new Map<string, Place[]>();
  for (const place of places) {
    const group = byArea.get(place.area) ?? [];
    group.push(place);
    byArea.set(place.area, group);
  }
  const groups: AreaGroup[] = [];
  for (const [area, areaPlaces] of byArea) {
    const sorted = [...areaPlaces].sort((a, b) => b.popularity - a.popularity);
    const centroid = {
      lat: areaPlaces.reduce((s, p) => s + p.lat, 0) / areaPlaces.length,
      lng: areaPlaces.reduce((s, p) => s + p.lng, 0) / areaPlaces.length,
    };
    const score = areaPlaces.reduce((s, p) => s + p.popularity, 0);
    groups.push({ area, places: sorted, centroid, score });
  }
  return groups.sort((a, b) => b.score - a.score);
}

// Haversine distance — fast approximation sufficient for city-scale distances
function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Greedily fills dayPlaceIds from candidates, mutating dayPlaceIds and remaining.
// Returns the updated dayMinutes total.
function greedyFill(
  candidates: Place[],
  dayPlaceIds: string[],
  dayMinutes: number,
  remaining: Map<string, Place>
): number {
  for (const place of candidates) {
    if (!remaining.has(place.id)) continue;
    const travel = dayPlaceIds.length === 0 ? 0 : TRAVEL_BUFFER_MINS;
    const cost = travel + place.durationMins;
    if (dayPlaceIds.length === 0 || dayMinutes + cost <= MAX_DAY_MINUTES) {
      dayPlaceIds.push(place.id);
      dayMinutes += cost;
      remaining.delete(place.id);
    }
  }
  return dayMinutes;
}

// Mean pairwise distance of a day's places mapped to a 0–100 coherence score.
// 100 = all places in the same spot; 0 = mean pair is ≥ 20 km apart.
export function scoreDayCoherence(places: Place[]): number {
  if (places.length < 2) return 100;
  let totalDist = 0;
  let pairs = 0;
  for (let i = 0; i < places.length - 1; i++) {
    for (let j = i + 1; j < places.length; j++) {
      totalDist += distanceKm(places[i], places[j]);
      pairs++;
    }
  }
  const meanDist = totalDist / pairs;
  const REF_KM = 20;
  return Math.max(0, Math.round(100 * (1 - meanDist / REF_KM)));
}

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

  // Filter by budget and tags; sort by popularity descending
  const candidates = allPlaces
    .filter((p) => affordable.includes(p.cost))
    .filter(
      (p) =>
        selectedTags.length === 0 ||
        p.tags.some((t) => selectedTags.includes(t))
    )
    .sort((a, b) => b.popularity - a.popularity);

  const areaGroups = buildAreaGroups(candidates);
  const remaining = new Map<string, Place>(candidates.map((p) => [p.id, p]));
  const usedAnchors = new Set<string>();
  const dayPlans: DayPlan[] = [];

  for (let dayIdx = 0; dayIdx < days; dayIdx++) {
    const dayPlaceIds: string[] = [];

    // Anchor = highest-score group not yet used that still has remaining places.
    // Fallback: any group with remaining places (handles trips longer than unique areas).
    const anchor =
      areaGroups.find(
        (g) => !usedAnchors.has(g.area) && g.places.some((p) => remaining.has(p.id))
      ) ??
      areaGroups.find((g) => g.places.some((p) => remaining.has(p.id)));

    if (!anchor) {
      // Pool exhausted — push empty day and continue
      dayPlans.push({ day: dayIdx + 1, placeIds: [] });
      continue;
    }

    usedAnchors.add(anchor.area);

    // Phase 1: fill from the anchor area
    let dayMinutes = greedyFill(anchor.places, dayPlaceIds, 0, remaining);

    // Phase 2: fill from nearby areas (≤ NEARBY_AREA_KM), closest first
    const nearbyGroups = areaGroups
      .filter(
        (g) =>
          g.area !== anchor.area &&
          g.places.some((p) => remaining.has(p.id)) &&
          distanceKm(anchor.centroid, g.centroid) <= NEARBY_AREA_KM
      )
      .sort(
        (a, b) =>
          distanceKm(anchor.centroid, a.centroid) -
          distanceKm(anchor.centroid, b.centroid)
      );

    for (const group of nearbyGroups) {
      dayMinutes = greedyFill(group.places, dayPlaceIds, dayMinutes, remaining);
    }

    // Phase 3: fallback — fill remaining capacity with any popular remaining place
    // (handles tag-filtered datasets with few, dispersed places)
    if (dayMinutes < MAX_DAY_MINUTES && remaining.size > 0) {
      const fallbackCandidates = [...remaining.values()].sort(
        (a, b) => b.popularity - a.popularity
      );
      greedyFill(fallbackCandidates, dayPlaceIds, dayMinutes, remaining);
    }

    dayPlans.push({ day: dayIdx + 1, placeIds: dayPlaceIds });
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
