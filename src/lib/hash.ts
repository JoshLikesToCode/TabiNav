/**
 * URL-hash encoding for trip state.
 *
 * Compact payload stored as base64url-encoded JSON in the URL fragment:
 *   /t#<base64url>
 *
 * Shape kept minimal — only IDs + selected options, never full place objects.
 */

import type { Trip, City, BudgetLevel, InterestTag } from "./types";

// Mirror the union types — keep in sync when adding new cities/budgets/tags
const VALID_CITIES = new Set<string>(["tokyo"]);
const VALID_BUDGETS = new Set<string>(["$", "$$", "$$$"]);
const VALID_TAGS = new Set<string>([
  "culture", "food", "nature", "shopping",
  "nightlife", "art", "history", "anime", "architecture",
]);

/** Compact wire format stored in the URL hash. */
interface HashPayload {
  v: 1;
  c: string;     // city code
  d: number;     // days
  b: string;     // budget
  t: string[];   // selectedTags
  i: string[][]; // dayPlans: array of place-ID arrays, one per day
}

// ─── Base64url helpers ────────────────────────────────────────────────────────

function toBase64Url(str: string): string {
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

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates an unknown JSON value against the HashPayload schema and domain
 * constraints, then constructs a trusted Trip.  Returns null on any violation.
 *
 * All `as` narrowing assertions below are safe: each field is checked before
 * it is cast.  This is the single boundary where untrusted data enters the
 * type system.
 */
function validatePayload(raw: unknown): Trip | null {
  if (typeof raw !== "object" || raw === null) return null;
  const p = raw as Record<string, unknown>;

  if (p.v !== 1) return null;
  if (typeof p.c !== "string" || !VALID_CITIES.has(p.c)) return null;
  if (typeof p.b !== "string" || !VALID_BUDGETS.has(p.b)) return null;
  if (
    !Array.isArray(p.t) ||
    p.t.some((t) => typeof t !== "string" || !VALID_TAGS.has(t))
  ) return null;
  if (
    typeof p.d !== "number" ||
    !Number.isInteger(p.d) ||
    p.d < 1 ||
    p.d > 30
  ) return null;
  if (
    !Array.isArray(p.i) ||
    p.i.some((day) => !Array.isArray(day) || day.some((id) => typeof id !== "string"))
  ) return null;
  if (p.i.length !== p.d) return null;

  return {
    v: 1,
    city: p.c as City,
    days: p.d,
    budget: p.b as BudgetLevel,
    selectedTags: p.t as InterestTag[],
    dayPlans: (p.i as string[][]).map((placeIds, idx) => ({
      day: idx + 1,
      placeIds,
    })),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

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
    const raw: unknown = JSON.parse(fromBase64Url(hash));
    return validatePayload(raw);
  } catch {
    return null;
  }
}
