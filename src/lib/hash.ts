/**
 * URL-hash encoding for trip state.
 *
 * Compact payload stored as base64url-encoded JSON in the URL fragment:
 *   /t#<base64url>
 *
 * Shape kept minimal — only IDs + selected options, never full place objects.
 */

import type { Trip, City, BudgetLevel, InterestTag } from "./types";

interface HashPayload {
  v: 1;
  c: string;    // city code
  d: number;    // days
  b: string;    // budget
  t: string[];  // selectedTags
  i: string[][]; // dayPlans: array of arrays of place IDs per day
}

function toBase64Url(str: string): string {
  // TextEncoder + btoa approach — works in browser and Node 16+
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeTripToHash(trip: Trip): string {
  const payload: HashPayload = {
    v: 1,
    c: trip.city,
    d: trip.days,
    b: trip.budget,
    t: trip.selectedTags,
    i: trip.dayPlans.map((plan) => plan.placeIds),
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeTripFromHash(hash: string): Trip | null {
  if (!hash) return null;
  try {
    const json = fromBase64Url(hash);
    const raw = JSON.parse(json) as HashPayload;
    if (raw.v !== 1) return null;

    return {
      v: 1,
      city: raw.c as City,
      days: raw.d,
      budget: raw.b as BudgetLevel,
      selectedTags: raw.t as InterestTag[],
      dayPlans: (raw.i as string[][]).map((placeIds, idx) => ({
        day: idx + 1,
        placeIds,
      })),
    };
  } catch {
    return null;
  }
}
