/**
 * Pure helpers for mutating trip itinerary state.
 * All functions return a new Trip — inputs are never modified.
 */

import type { Trip } from "./types";

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

/** Returns a new Trip with the place order within a day changed. */
export function reorderDay(
  trip: Trip,
  day: number,
  fromIndex: number,
  toIndex: number
): Trip {
  return {
    ...trip,
    dayPlans: trip.dayPlans.map((d) =>
      d.day === day
        ? { ...d, placeIds: arrayMove(d.placeIds, fromIndex, toIndex) }
        : d
    ),
  };
}

/** Returns a new Trip with a place moved from one day to the end of another. */
export function movePlaceToDay(
  trip: Trip,
  placeId: string,
  fromDay: number,
  toDay: number
): Trip {
  return {
    ...trip,
    dayPlans: trip.dayPlans.map((d) => {
      if (d.day === fromDay) {
        return { ...d, placeIds: d.placeIds.filter((id) => id !== placeId) };
      }
      if (d.day === toDay) {
        return { ...d, placeIds: [...d.placeIds, placeId] };
      }
      return d;
    }),
  };
}
