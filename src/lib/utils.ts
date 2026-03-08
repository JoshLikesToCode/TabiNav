import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BudgetLevel } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert total minutes-from-midnight to a "9:30 AM" string. */
export function minutesToTimeStr(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Build a schedule for a day's places (30-min travel buffer between stops). */
export function buildDaySchedule(
  durations: number[], // durationMins per place
  startHour = 9
): { startTime: string; endTime: string }[] {
  let minutes = startHour * 60;
  return durations.map((durationMins, i) => {
    if (i > 0) minutes += 30; // travel buffer
    const startTime = minutesToTimeStr(minutes);
    minutes += durationMins;
    const endTime = minutesToTimeStr(minutes);
    return { startTime, endTime };
  });
}

/** Format a duration in minutes as a human-readable string (e.g. "1h 30m", "45m"). */
export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export const BUDGET_LABELS: Record<BudgetLevel, string> = {
  $: "Budget",
  $$: "Moderate",
  $$$: "Premium",
};

export const BUDGET_DESCRIPTIONS: Record<BudgetLevel, string> = {
  $: "Under ¥5,000 / day",
  $$: "¥5,000–15,000 / day",
  $$$: "¥15,000+ / day",
};
