/**
 * Suggestion & Iteration Engine — deterministic, pure, no external deps.
 *
 * Two public exports:
 *   findNearbyAlternatives — given a place, return up to `limit` ranked
 *     alternatives from the city pool that are not already in the trip.
 *
 *   improveDayPlan — detect outlier places in a day (by distance from the
 *     day's centroid), swap them for better-fitting alternatives, then
 *     reorder the remaining places using nearest-neighbour for better flow.
 *     Returns the original trip reference unchanged when no improvement is
 *     possible, so callers can use referential equality to detect no-ops.
 */

import type { Place, Trip, InterestTag } from "./types";

// ─── Internal geometry ────────────────────────────────────────────────────────

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

// ─── Internal scoring ─────────────────────────────────────────────────────────

/**
 * Score a candidate place for how well it fits a day centred at (refLat, refLng)
 * with the given preferred tags.
 *
 * Weights:
 *   60% proximity  — exponential decay, half-score at 2 km, zero at ~8 km
 *   40% popularity — normalised 0–100 → 0–1
 *   +0.15 bonus    — when the candidate shares at least one preferred tag
 *
 * Higher is better. Score is not bounded above 1 (tag bonus can push past 1)
 * but comparisons are consistent.
 */
function scoreCandidate(
  candidate: Place,
  refLat: number,
  refLng: number,
  preferredTags: InterestTag[]
): number {
  const dist = distanceKm({ lat: refLat, lng: refLng }, candidate);
  const proximityScore = Math.exp(-dist / 2); // ~0.5 at 1.4 km, ~0 at 8+ km
  const popularityScore = candidate.popularity / 100;
  const tagBonus =
    preferredTags.length > 0 &&
    candidate.tags.some((t) => preferredTags.includes(t))
      ? 0.15
      : 0;
  return 0.6 * proximityScore + 0.4 * popularityScore + tagBonus;
}

/**
 * Return up to `limit` alternatives near (refLat, refLng) from `allPlaces`,
 * excluding any place whose id is in `excludeIds`.
 * Sorted by scoreCandidate descending.
 */
function findAlternativesNear(
  refLat: number,
  refLng: number,
  preferredTags: InterestTag[],
  excludeIds: Set<string>,
  allPlaces: Place[],
  limit = 3
): Place[] {
  return allPlaces
    .filter((p) => !excludeIds.has(p.id))
    .map((p) => ({
      place: p,
      score: scoreCandidate(p, refLat, refLng, preferredTags),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ place }) => place);
}

/**
 * Greedy nearest-neighbour reorder.
 * Starts from the highest-popularity place (the day's "anchor"), then at each
 * step picks the closest unvisited place. This minimises backtracking without
 * exhaustive search.
 */
function nearestNeighborOrder(places: Place[]): Place[] {
  if (places.length <= 1) return [...places];

  const unvisited = new Set(places.map((p) => p.id));
  const anchor = [...places].sort((a, b) => b.popularity - a.popularity)[0];
  const ordered: Place[] = [anchor];
  unvisited.delete(anchor.id);

  while (unvisited.size > 0) {
    const last = ordered[ordered.length - 1];
    let nearest: Place | null = null;
    let nearestDist = Infinity;

    for (const id of unvisited) {
      const candidate = places.find((p) => p.id === id)!;
      const d = distanceKm(last, candidate);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = candidate;
      }
    }

    if (!nearest) break;
    ordered.push(nearest);
    unvisited.delete(nearest.id);
  }

  return ordered;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Find up to `limit` alternative places for a given target place.
 *
 * Alternatives are scored by proximity to the target's coordinates,
 * popularity, and tag overlap — then deduplicated against every place already
 * in the trip across all days.
 */
export function findNearbyAlternatives(
  target: Place,
  trip: Trip,
  allPlaces: Place[],
  limit = 3
): Place[] {
  const usedIds = new Set(trip.dayPlans.flatMap((d) => d.placeIds));
  return findAlternativesNear(
    target.lat,
    target.lng,
    target.tags as InterestTag[],
    usedIds,
    allPlaces,
    limit
  );
}

/**
 * Improve a day's itinerary by:
 *   1. Detecting outlier places (distance from day centroid > OUTLIER_THRESHOLD_KM).
 *   2. Replacing up to 2 outliers with better-fitting alternatives.
 *   3. Reordering surviving + replacement places via nearest-neighbour.
 *
 * Returns the original `trip` reference (no new object) when no improvement
 * is made — callers can use `===` to detect no-ops.
 */
export function improveDayPlan(
  dayNumber: number,
  trip: Trip,
  allPlaces: Place[]
): Trip {
  const OUTLIER_THRESHOLD_KM = 4;

  const dayPlan = trip.dayPlans.find((d) => d.day === dayNumber);
  if (!dayPlan || dayPlan.placeIds.length < 2) return trip;

  const places = dayPlan.placeIds
    .map((id) => allPlaces.find((p) => p.id === id))
    .filter((p): p is Place => p !== undefined);

  if (places.length < 2) return trip;

  const centroidLat = places.reduce((s, p) => s + p.lat, 0) / places.length;
  const centroidLng = places.reduce((s, p) => s + p.lng, 0) / places.length;
  const dayTags = [
    ...new Set(places.flatMap((p) => p.tags)),
  ] as InterestTag[];

  // Identify up to 2 outliers (furthest from centroid first)
  const outliers = places
    .map((p) => ({
      place: p,
      dist: distanceKm({ lat: centroidLat, lng: centroidLng }, p),
    }))
    .filter(({ dist }) => dist > OUTLIER_THRESHOLD_KM)
    .sort((a, b) => b.dist - a.dist)
    .slice(0, 2);

  if (outliers.length === 0) {
    // No outliers — still reorder for better flow
    const reorderedIds = nearestNeighborOrder(places).map((p) => p.id);
    const unchanged =
      reorderedIds.length === dayPlan.placeIds.length &&
      reorderedIds.every((id, i) => id === dayPlan.placeIds[i]);
    if (unchanged) return trip;

    return {
      ...trip,
      dayPlans: trip.dayPlans.map((d) =>
        d.day === dayNumber ? { ...d, placeIds: reorderedIds } : d
      ),
    };
  }

  // Try to replace each outlier
  const usedIds = new Set(trip.dayPlans.flatMap((d) => d.placeIds));
  let newPlaceIds = [...dayPlan.placeIds];

  for (const { place: outlier } of outliers) {
    const alts = findAlternativesNear(
      centroidLat,
      centroidLng,
      dayTags,
      usedIds,
      allPlaces,
      1
    );
    if (alts.length > 0) {
      const replacement = alts[0];
      newPlaceIds = newPlaceIds.map((id) =>
        id === outlier.id ? replacement.id : id
      );
      usedIds.delete(outlier.id);
      usedIds.add(replacement.id);
    }
  }

  // Reorder for better flow
  const updatedPlaces = newPlaceIds
    .map((id) => allPlaces.find((p) => p.id === id))
    .filter((p): p is Place => p !== undefined);
  const reorderedIds = nearestNeighborOrder(updatedPlaces).map((p) => p.id);

  const unchanged =
    reorderedIds.length === dayPlan.placeIds.length &&
    reorderedIds.every((id, i) => id === dayPlan.placeIds[i]);
  if (unchanged) return trip;

  return {
    ...trip,
    dayPlans: trip.dayPlans.map((d) =>
      d.day === dayNumber ? { ...d, placeIds: reorderedIds } : d
    ),
  };
}
