// ─── Domain types ───────────────────────────────────────────────────────────

export type City = "tokyo" | "kyoto"; // osaka — coming soon

export type BudgetLevel = "$" | "$$" | "$$$";

export type InterestTag =
  | "culture"
  | "food"
  | "nature"
  | "shopping"
  | "nightlife"
  | "art"
  | "history"
  | "anime"
  | "architecture";

export type PlaceCategory =
  | "temple"
  | "shrine"
  | "garden"
  | "food"
  | "shopping"
  | "museum"
  | "entertainment"
  | "park"
  | "district"
  | "landmark";

export interface Place {
  id: string;
  name: string;
  nameJa: string;
  city: City;
  category: PlaceCategory;
  tags: InterestTag[];
  cost: BudgetLevel;
  durationMins: number;
  popularity: number;
  description: string;
  area: string;
  lat: number;
  lng: number;
}

// ─── Trip / itinerary ────────────────────────────────────────────────────────

export interface DayPlan {
  day: number; // 1-indexed
  placeIds: string[];
}

export interface Trip {
  v: 1;
  city: City;
  days: number;
  selectedTags: InterestTag[];
  budget: BudgetLevel;
  dayPlans: DayPlan[];
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export interface ScheduledPlace {
  place: Place;
  startTime: string;
  endTime: string;
}
