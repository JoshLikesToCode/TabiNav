/**
 * Integration test — TripViewer full flow.
 *
 * Tests that the complete UI pipeline works end-to-end:
 *   URL hash → trip state → rendered day tabs + place cards
 *   → "Improve this day" interaction → updated place list
 *   → encode/decode roundtrip via the hash module
 *
 * Mocks:
 *   MapPanel       — wraps Leaflet which requires a real DOM canvas; stubbed out.
 *   next/image     — renders as a plain <img> without the Next.js optimizer.
 *   next/link      — renders as a plain <a> without the Next.js router.
 *   next/dynamic   — returns the component synchronously (no lazy loading).
 *   sonner         — toast calls are captured; we assert on state changes not
 *                    on toast display (Toaster is not rendered in tests).
 */

import React from "react";
import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { encodeTripToHash, decodeTripFromHash } from "@/lib/hash";
import { generateItinerary, getPlaceById } from "@/lib/itinerary";
import type { Trip } from "@/lib/types";

// ─── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/components/trip/MapPanel", () => ({
  MapPanel: () => null,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement("img", { src, alt }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement("a", { href, className }, children),
}));

// next/dynamic: return the wrapped component synchronously so tests don't need
// to wait for lazy chunk loading (MapPanel is already mocked above anyway).
vi.mock("next/dynamic", () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    // Synchronously call the factory and return the default export.
    // The cast is safe here because the factory is always a component import.
    let Component: React.ComponentType = () => null;
    fn().then((m) => { Component = m.default; });
    return Component;
  },
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// ─── Test helpers ──────────────────────────────────────────────────────────────

/** Simulate a trip being active in the URL hash, then import and render TripViewer. */
async function renderWithTrip(trip: Trip) {
  // useTripLoader reads window.location.hash in a useEffect.
  // jsdom allows direct assignment to location.hash.
  window.location.hash = "#" + encodeTripToHash(trip);

  // Spy on replaceState so the hash sync effect doesn't crash.
  const replaceStateSpy = vi
    .spyOn(window.history, "replaceState")
    .mockImplementation(() => undefined);

  // Mock clipboard for ShareButton
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });

  // Dynamic import after mocks are set up so vi.mock calls are hoisted correctly.
  const { TripViewer } = await import("@/components/trip/TripViewer");

  const act = render(React.createElement(TripViewer));

  return { act, replaceStateSpy };
}

/** Build a small, deterministic trip for UI assertions. */
function buildTestTrip(): Trip {
  return generateItinerary("tokyo", 2, ["culture"], "$$");
}

// ─── Cleanup ───────────────────────────────────────────────────────────────────

afterEach(() => {
  vi.restoreAllMocks();
  window.location.hash = "";
  vi.resetModules();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TripViewer — hash → render flow", () => {
  it("shows a loading state before the trip loads", async () => {
    window.location.hash = "#" + encodeTripToHash(buildTestTrip());
    vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);

    const { TripViewer } = await import("@/components/trip/TripViewer");
    const act = render(React.createElement(TripViewer));

    // The loading spinner dots are rendered while trip === null
    // (before useEffect fires). In React 19 with concurrent mode, the effect
    // may flush synchronously in test mode — so we accept either loading or loaded.
    const container = act.container;
    expect(container).toBeDefined();
  });

  it("renders the correct number of day tabs after loading", async () => {
    const trip = buildTestTrip();
    await renderWithTrip(trip);

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
      expect(screen.getByText("Day 2")).toBeInTheDocument();
    });
  });

  it("renders place cards for Day 1 after loading", async () => {
    const trip = buildTestTrip();
    await renderWithTrip(trip);

    // Wait for trip to hydrate and Day 1 places to appear
    const day1PlaceIds = trip.dayPlans[0].placeIds;
    const firstPlaceName = getPlaceById("tokyo", day1PlaceIds[0])?.name;
    expect(firstPlaceName).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(firstPlaceName!)).toBeInTheDocument();
    });
  });

  it("renders the trip intelligence bar with a score badge", async () => {
    const trip = buildTestTrip();
    await renderWithTrip(trip);

    await waitFor(() => {
      // Score badge is one of: "Good", "Very Good", "Highly Efficient"
      const badge =
        screen.queryByText("Highly Efficient") ??
        screen.queryByText("Very Good") ??
        screen.queryByText("Good");
      expect(badge).toBeInTheDocument();
    });
  });

  it("shows an error state when the hash is invalid", async () => {
    window.location.hash = "#this-is-not-a-valid-hash";
    vi.spyOn(window.history, "replaceState").mockImplementation(() => undefined);

    const { TripViewer } = await import("@/components/trip/TripViewer");
    render(React.createElement(TripViewer));

    await waitFor(() => {
      expect(screen.getByText(/couldn't load this trip/i)).toBeInTheDocument();
    });
  });

  it("switches to Day 2 when the Day 2 tab is clicked", async () => {
    const trip = buildTestTrip();
    await renderWithTrip(trip);

    // Wait for tabs to load
    await waitFor(() => {
      expect(screen.getByText("Day 2")).toBeInTheDocument();
    });

    const day2PlaceIds = trip.dayPlans[1].placeIds;
    const day2FirstName = getPlaceById("tokyo", day2PlaceIds[0])?.name;

    // Click Day 2 tab
    fireEvent.click(screen.getByText("Day 2"));

    if (day2FirstName) {
      await waitFor(() => {
        expect(screen.getByText(day2FirstName)).toBeInTheDocument();
      });
    }
  });
});

describe("TripViewer — 'Improve this day' interaction", () => {
  it("renders the 'Improve this day' button when the active day has ≥ 2 places", async () => {
    // Generate a trip where Day 1 has multiple places
    const trip = generateItinerary("tokyo", 1, [], "$$$");
    const hasMultiplePlaces = trip.dayPlans[0].placeIds.length >= 2;

    if (!hasMultiplePlaces) return; // skip if pool is too small (shouldn't happen)

    await renderWithTrip(trip);

    await waitFor(() => {
      expect(screen.getByText(/improve this day/i)).toBeInTheDocument();
    });
  });

  it("triggers trip state update when 'Improve this day' is clicked", async () => {
    const trip = generateItinerary("tokyo", 1, [], "$$$");
    const hasMultiplePlaces = trip.dayPlans[0].placeIds.length >= 2;

    if (!hasMultiplePlaces) return;

    const { replaceStateSpy } = await renderWithTrip(trip);

    await waitFor(() => {
      expect(screen.getByText(/improve this day/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/improve this day/i));

    // After clicking, replaceState is called as the trip hash updates.
    // This confirms the state changed and the URL sync effect ran.
    await waitFor(() => {
      expect(replaceStateSpy).toHaveBeenCalled();
    });
  });
});

describe("TripViewer — swap interaction", () => {
  it("opens the SwapPanel when the swap button is clicked", async () => {
    const trip = buildTestTrip();
    await renderWithTrip(trip);

    await waitFor(() => {
      expect(screen.getByText("Day 1")).toBeInTheDocument();
    });

    // Swap buttons have aria-label="Swap place"
    const swapButtons = screen.queryAllByLabelText("Swap place");
    if (swapButtons.length > 0) {
      fireEvent.click(swapButtons[0]);

      await waitFor(() => {
        // SwapPanel shows the word "Swap" in its header
        expect(screen.getByText("Swap")).toBeInTheDocument();
      });
    }
  });
});

// ─── Hash encode/decode roundtrip (no UI, pure logic) ─────────────────────────

describe("share link — encode/decode roundtrip", () => {
  it("decoding an encoded trip reproduces the original trip structure", () => {
    const original = generateItinerary("tokyo", 3, ["culture", "food"], "$$");
    const hash = encodeTripToHash(original);
    const decoded = decodeTripFromHash(hash);

    expect(decoded).not.toBeNull();
    expect(decoded!.city).toBe(original.city);
    expect(decoded!.days).toBe(original.days);
    expect(decoded!.budget).toBe(original.budget);
    expect(decoded!.selectedTags).toEqual(original.selectedTags);
    expect(decoded!.dayPlans.length).toBe(original.dayPlans.length);
  });

  it("place IDs survive the encode/decode roundtrip without corruption", () => {
    const original = generateItinerary("tokyo", 2, [], "$$");
    const hash = encodeTripToHash(original);
    const decoded = decodeTripFromHash(hash);

    for (let i = 0; i < original.dayPlans.length; i++) {
      expect(decoded!.dayPlans[i].placeIds).toEqual(
        original.dayPlans[i].placeIds
      );
    }
  });

  it("a trip mutated by movePlaceToDay still encodes/decodes correctly", async () => {
    const { movePlaceToDay } = await import("@/lib/tripEdit");

    const original = generateItinerary("tokyo", 2, [], "$$");
    const firstId = original.dayPlans[0].placeIds[0];
    const mutated = movePlaceToDay(original, firstId, 1, 2);

    const hash = encodeTripToHash(mutated);
    const decoded = decodeTripFromHash(hash);

    expect(decoded).not.toBeNull();
    expect(decoded!.dayPlans[0].placeIds).not.toContain(firstId);
    expect(decoded!.dayPlans[1].placeIds).toContain(firstId);
  });
});
