import { describe, it } from "vitest";
import { improveDayPlan, findNearbyAlternatives } from "@/lib/suggestions";
import { getAllPlaces, getPlaceById } from "@/lib/itinerary";
import type { Trip } from "@/lib/types";
import { should } from "../helpers/should";

// ─── Shared fixtures ───────────────────────────────────────────────────────────

const tokyoPlaces = getAllPlaces("tokyo");
const kyotoPlaces = getAllPlaces("kyoto");

/**
 * A trip whose Day 1 contains two Harajuku-area places plus Senso-ji
 * (Asakusa), which sits ~6 km from the Harajuku centroid — well above
 * the 4 km outlier threshold.
 *
 * After improveDayPlan, sensoji should be replaced or the day reordered.
 *
 * Coordinates used:
 *   meiji-shrine       lat 35.6763  lng 139.6993  (Harajuku)
 *   harajuku-takeshita lat 35.6712  lng ~139.70   (Harajuku)
 *   sensoji            lat 35.7148  lng 139.7967  (Asakusa  ← outlier)
 */
function makeTripWithOutlier(): Trip {
  return {
    v: 1,
    city: "tokyo",
    days: 1,
    budget: "$$$",
    selectedTags: [],
    dayPlans: [
      {
        day: 1,
        placeIds: ["meiji-shrine", "harajuku-takeshita", "sensoji"],
      },
    ],
  };
}

/** A well-spread 2-day trip used as context for findNearbyAlternatives. */
function makeTwoDayTrip(): Trip {
  return {
    v: 1,
    city: "tokyo",
    days: 2,
    budget: "$$$",
    selectedTags: [],
    dayPlans: [
      { day: 1, placeIds: ["sensoji", "meiji-shrine"] },
      { day: 2, placeIds: ["shibuya-crossing"] },
    ],
  };
}

// ─── improveDayPlan ────────────────────────────────────────────────────────────

describe("improveDayPlan", () => {
  it("returns a different trip object when the day contains a geographic outlier", () => {
    const trip = makeTripWithOutlier();
    const sut = improveDayPlan(1, trip, tokyoPlaces);

    // Reference inequality proves the function returned a new trip
    should(sut === trip).beFalse();
  });

  it("removes the outlier place and replaces it with one closer to the day centroid", () => {
    const trip = makeTripWithOutlier();
    const sut = improveDayPlan(1, trip, tokyoPlaces);

    const resultIds = sut.dayPlans[0].placeIds;

    // sensoji was the outlier and should no longer appear
    should(resultIds).not.contain("sensoji");

    // meiji-shrine and harajuku-takeshita were within threshold — at least
    // one should survive (the day keeps the same number of places)
    const eitherSurvived =
      resultIds.includes("meiji-shrine") ||
      resultIds.includes("harajuku-takeshita");
    should(eitherSurvived).beTrue();
  });

  it("preserves the total number of places in the day after improvement", () => {
    const trip = makeTripWithOutlier();
    const originalCount = trip.dayPlans[0].placeIds.length;
    const sut = improveDayPlan(1, trip, tokyoPlaces);

    should(sut.dayPlans[0].placeIds).haveLength(originalCount);
  });

  it("does not introduce duplicate place IDs after improvement", () => {
    const trip = makeTripWithOutlier();
    const sut = improveDayPlan(1, trip, tokyoPlaces);

    const ids = sut.dayPlans[0].placeIds;
    const unique = new Set(ids);
    should(unique.size).be(ids.length);
  });

  it("returns the original trip reference when the day has fewer than 2 places (no-op)", () => {
    const trip: Trip = {
      v: 1,
      city: "tokyo",
      days: 1,
      budget: "$$",
      selectedTags: [],
      dayPlans: [{ day: 1, placeIds: ["sensoji"] }],
    };

    const sut = improveDayPlan(1, trip, tokyoPlaces);

    // Reference equality — same object, no allocation
    should(sut === trip).beTrue();
  });

  it("returns the original trip reference for an empty day", () => {
    const trip: Trip = {
      v: 1,
      city: "tokyo",
      days: 1,
      budget: "$$",
      selectedTags: [],
      dayPlans: [{ day: 1, placeIds: [] }],
    };

    const sut = improveDayPlan(1, trip, tokyoPlaces);

    should(sut === trip).beTrue();
  });

  it("does not modify other days when improving day 1", () => {
    const trip: Trip = {
      v: 1,
      city: "tokyo",
      days: 2,
      budget: "$$$",
      selectedTags: [],
      dayPlans: [
        {
          day: 1,
          placeIds: ["meiji-shrine", "harajuku-takeshita", "sensoji"],
        },
        { day: 2, placeIds: ["shibuya-crossing"] },
      ],
    };

    const sut = improveDayPlan(1, trip, tokyoPlaces);

    should(sut.dayPlans[1].placeIds).equal(["shibuya-crossing"]);
  });

  it("does not place a Kyoto place into a Tokyo day", () => {
    const trip = makeTripWithOutlier();
    const sut = improveDayPlan(1, trip, tokyoPlaces);

    // getAllPlaces('tokyo') is the pool passed in — no Kyoto places exist in it
    for (const id of sut.dayPlans[0].placeIds) {
      const place = getPlaceById("tokyo", id);
      should(place).exist();
      should(place!.city).be("tokyo");
    }
  });
});

// ─── findNearbyAlternatives ────────────────────────────────────────────────────

describe("findNearbyAlternatives", () => {
  it("returns a non-empty list when alternatives exist", () => {
    const trip = makeTwoDayTrip();
    const target = getPlaceById("tokyo", "sensoji")!;

    const sut = findNearbyAlternatives(target, trip, tokyoPlaces);

    should(sut.length).greaterThan(0);
  });

  it("never returns more than the requested limit (default 3)", () => {
    const trip = makeTwoDayTrip();
    const target = getPlaceById("tokyo", "sensoji")!;

    const sut = findNearbyAlternatives(target, trip, tokyoPlaces);

    should(sut.length).lessThanOrEqual(3);
  });

  it("does not include the target place itself in the results", () => {
    const trip = makeTwoDayTrip();
    const target = getPlaceById("tokyo", "sensoji")!;

    const sut = findNearbyAlternatives(target, trip, tokyoPlaces);

    const containsTarget = sut.some((p) => p.id === target.id);
    should(containsTarget).beFalse();
  });

  it("does not include any place already in the trip", () => {
    const trip = makeTwoDayTrip();
    const usedIds = new Set(trip.dayPlans.flatMap((d) => d.placeIds));
    const target = getPlaceById("tokyo", "sensoji")!;

    const sut = findNearbyAlternatives(target, trip, tokyoPlaces);

    for (const alt of sut) {
      should(usedIds.has(alt.id)).beFalse();
    }
  });

  it("all returned alternatives belong to the same city as the pool provided", () => {
    const trip = makeTwoDayTrip();
    const target = getPlaceById("tokyo", "sensoji")!;

    const sut = findNearbyAlternatives(target, trip, tokyoPlaces);

    for (const alt of sut) {
      should(alt.city).be("tokyo");
    }
  });

  it("returned alternatives are Place objects with all required fields", () => {
    const trip = makeTwoDayTrip();
    const target = getPlaceById("tokyo", "meiji-shrine")!;

    const sut = findNearbyAlternatives(target, trip, tokyoPlaces);

    for (const alt of sut) {
      should(typeof alt.id).be("string");
      should(typeof alt.name).be("string");
      should(typeof alt.lat).be("number");
      should(typeof alt.lng).be("number");
      should(typeof alt.durationMins).be("number");
    }
  });

  it("works correctly for Kyoto places when provided Kyoto pool", () => {
    const kyotoTrip: Trip = {
      v: 1,
      city: "kyoto",
      days: 1,
      budget: "$$$",
      selectedTags: [],
      dayPlans: [{ day: 1, placeIds: ["kinkakuji"] }],
    };
    const target = getPlaceById("kyoto", "kinkakuji")!;
    should(target).exist();

    const sut = findNearbyAlternatives(target, kyotoTrip, kyotoPlaces);

    should(sut.length).greaterThan(0);
    for (const alt of sut) {
      should(alt.city).be("kyoto");
    }
  });
});
