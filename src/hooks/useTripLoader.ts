import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { decodeTripFromHash } from "@/lib/hash";
import { generateItinerary } from "@/lib/itinerary";
import type { Trip } from "@/lib/types";

function getDemoTrip(): Trip {
  return generateItinerary("tokyo", 3, ["culture", "food", "nature"], "$$");
}

/**
 * Reads the URL hash on mount and hydrates trip state.
 * Returns `error: true` if a hash is present but cannot be decoded.
 */
export function useTripLoader(): {
  trip: Trip | null;
  setTrip: Dispatch<SetStateAction<Trip | null>>;
  error: boolean;
} {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "").trim();

    if (!hash || hash === "demo") {
      setTrip(getDemoTrip());
      return;
    }

    const decoded = decodeTripFromHash(hash);
    if (decoded) {
      setTrip(decoded);
    } else {
      setError(true);
    }
  }, []);

  return { trip, setTrip, error };
}
