/**
 * Trip Intelligence Layer — lightweight, deterministic heuristic analysis.
 *
 * All functions are pure: same inputs always produce the same output.
 * No external dependencies, no React, no browser APIs.
 *
 * Day analysis:  derives a short human-readable label from the places
 *                scheduled for a single day (area focus, thematic cluster,
 *                or structural character).
 *
 * Trip analysis: derives a 1–2 line summary and a quality rating from the
 *                full multi-day itinerary using coherence and day balance.
 */

import type { Place } from "./types";
import { scoreDayCoherence } from "./itinerary";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayInsight {
  /** Short human-readable label for the day's character. */
  label: string;
  /**
   * Geographic cohesion score 0–100 (from scoreDayCoherence).
   * Higher means stops are physically closer together.
   */
  coherenceScore: number;
}

export interface TripInsight {
  score: "Good" | "Very Good" | "Highly Efficient";
  /** 1–2 short lines describing the trip's structure in product language. */
  summaryLines: string[];
}

// ─── Internal constants ───────────────────────────────────────────────────────

// Matches the travel buffer in the itinerary generator and DayColumn.
const TRAVEL_BUFFER_MINS = 30;

// ─── Day-level helpers ────────────────────────────────────────────────────────

/**
 * Returns an area-based label when one or two areas dominate the day's
 * schedule — e.g. "Higashiyama focus" or "Gion + Fushimi".
 * Returns null when no clear area dominance exists.
 */
function deriveAreaLabel(places: Place[]): string | null {
  const counts = new Map<string, number>();
  for (const p of places) counts.set(p.area, (counts.get(p.area) ?? 0) + 1);

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const [[topArea, topCount]] = sorted;
  const total = places.length;

  if (topCount / total >= 0.6) return `${topArea} focus`;
  if (sorted.length >= 2 && (topCount + sorted[1][1]) / total >= 0.7) {
    return `${topArea} + ${sorted[1][0]}`;
  }
  return null;
}

/**
 * Returns a theme label when a single interest category dominates the
 * day's tag mentions — e.g. "Cultural cluster" or "Nature day".
 * Returns null when no single theme is dominant.
 */
function deriveThemeLabel(places: Place[]): string | null {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const p of places) {
    for (const tag of p.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
      total++;
    }
  }
  if (total === 0) return null;

  const cultural =
    (counts.culture ?? 0) + (counts.history ?? 0) +
    (counts.architecture ?? 0) + (counts.art ?? 0);
  const food    = (counts.food ?? 0) + (counts.nightlife ?? 0);
  const nature  = counts.nature ?? 0;
  const entertainment = (counts.entertainment ?? 0) + (counts.anime ?? 0);

  if (cultural / total >= 0.55) return "Cultural cluster";
  if (food / total >= 0.45)     return "Food & Nightlife";
  if (nature / total >= 0.45)   return "Nature day";
  if (entertainment / total >= 0.40) return "Entertainment focus";
  return null;
}

// ─── Public: day analysis ─────────────────────────────────────────────────────

/**
 * Analyzes the places scheduled for a single day and returns a short
 * human-readable label plus a geographic coherence score.
 *
 * Label derivation priority:
 *   1. Area focus  — one or two areas dominate the schedule.
 *   2. Theme       — a single interest category dominates tag mentions.
 *   3. Structural  — "Compact day" when stops are geographically tight.
 *   4. Default     — "Mixed areas".
 */
export function analyzeDayPlaces(places: Place[]): DayInsight {
  if (places.length === 0) {
    return { label: "Empty day", coherenceScore: 100 };
  }

  const coherenceScore = scoreDayCoherence(places);
  const label =
    deriveAreaLabel(places) ??
    deriveThemeLabel(places) ??
    (coherenceScore >= 75 ? "Compact day" : "Mixed areas");

  return { label, coherenceScore };
}

// ─── Public: trip analysis ────────────────────────────────────────────────────

/**
 * Analyzes the full multi-day itinerary and returns a quality score
 * plus 1–2 summary lines describing how the trip is structured.
 *
 * @param dayPlaces  One Place[] per day (empty arrays are allowed).
 */
export function analyzeTripPlaces(dayPlaces: Place[][]): TripInsight {
  const nonEmptyDays = dayPlaces.filter((d) => d.length > 0);

  if (nonEmptyDays.length === 0) {
    return {
      score: "Good",
      summaryLines: ["Add places to see trip insights"],
    };
  }

  // ── Geographic coherence ─────────────────────────────────────────────────────
  // Average of per-day coherence scores (0–100). Higher = stops are closer
  // together within each day.
  const coherenceScores = nonEmptyDays.map(scoreDayCoherence);
  const avgCoherence =
    coherenceScores.reduce((s, c) => s + c, 0) / coherenceScores.length;

  // ── Day balance ──────────────────────────────────────────────────────────────
  // Measures how evenly activity-minutes are distributed across days.
  // Normalised against half a day (240 min): a stddev of 240 → score 0, 0 → 1.
  const dayMinutes = nonEmptyDays.map(
    (d) =>
      d.reduce((s, p) => s + p.durationMins, 0) +
      Math.max(0, d.length - 1) * TRAVEL_BUFFER_MINS
  );
  const avgMins = dayMinutes.reduce((s, m) => s + m, 0) / dayMinutes.length;
  const variance =
    dayMinutes.reduce((s, m) => s + (m - avgMins) ** 2, 0) / dayMinutes.length;
  const balanceScore = Math.max(0, 1 - Math.sqrt(variance) / 240);

  // ── Geographic spread ────────────────────────────────────────────────────────
  const uniqueAreas = new Set(nonEmptyDays.flat().map((p) => p.area)).size;

  // Dominant anchor area per day: the area with the most places that day.
  const anchorAreas = nonEmptyDays.map((d) => {
    const counts = new Map<string, number>();
    for (const p of d) counts.set(p.area, (counts.get(p.area) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  });
  const uniqueAnchors = new Set(anchorAreas).size;

  // ── Score ────────────────────────────────────────────────────────────────────
  let score: TripInsight["score"];
  if (avgCoherence >= 72 && balanceScore >= 0.60) {
    score = "Highly Efficient";
  } else if (avgCoherence >= 55 || balanceScore >= 0.55) {
    score = "Very Good";
  } else {
    score = "Good";
  }

  // ── Summary lines ────────────────────────────────────────────────────────────
  const summaryLines: string[] = [];

  // Line 1: overall character
  if (avgCoherence >= 72) {
    summaryLines.push("Optimized for walkability");
  } else if (uniqueAnchors === nonEmptyDays.length) {
    summaryLines.push("Balanced across key neighborhoods");
  } else if (uniqueAreas <= Math.ceil(nonEmptyDays.length * 1.5)) {
    summaryLines.push("Minimal backtracking");
  } else {
    summaryLines.push("Well-rounded itinerary");
  }

  // Line 2: optional additional detail (only for multi-day trips)
  if (nonEmptyDays.length > 1) {
    if (balanceScore < 0.50) {
      summaryLines.push("Consider balancing stops across days");
    } else if (uniqueAreas >= 5) {
      summaryLines.push(`${uniqueAreas} distinct neighborhoods`);
    }
  }

  return { score, summaryLines };
}
