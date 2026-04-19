import { describe, it } from "vitest";
import { reorderDay, movePlaceToDay } from "@/lib/tripEdit";
import type { Trip } from "@/lib/types";
import { should } from "../helpers/should";

// ─── Shared fixture ────────────────────────────────────────────────────────────

/** A minimal 3-day trip with known place IDs, no real dataset dependency. */
function makeTrip(): Trip {
  return {
    v: 1,
    city: "tokyo",
    days: 3,
    budget: "$$",
    selectedTags: [],
    dayPlans: [
      { day: 1, placeIds: ["sensoji", "meiji-shrine", "shinjuku-gyoen"] },
      { day: 2, placeIds: ["shibuya-crossing", "harajuku-takeshita"] },
      { day: 3, placeIds: ["ueno-zoo"] },
    ],
  };
}

// ─── reorderDay ────────────────────────────────────────────────────────────────

describe("reorderDay", () => {
  it("moves an item from an earlier to a later position within the same day", () => {
    const trip = makeTrip();
    const sut = reorderDay(trip, 1, 0, 2);

    // sensoji was at index 0; after moving to index 2, the order should be:
    // [meiji-shrine, shinjuku-gyoen, sensoji]
    should(sut.dayPlans[0].placeIds).equal([
      "meiji-shrine",
      "shinjuku-gyoen",
      "sensoji",
    ]);
  });

  it("moves an item from a later to an earlier position within the same day", () => {
    const trip = makeTrip();
    const sut = reorderDay(trip, 1, 2, 0);

    // shinjuku-gyoen was at index 2; after moving to index 0:
    should(sut.dayPlans[0].placeIds).equal([
      "shinjuku-gyoen",
      "sensoji",
      "meiji-shrine",
    ]);
  });

  it("does not modify other days when reordering within one day", () => {
    const trip = makeTrip();
    const sut = reorderDay(trip, 1, 0, 2);

    should(sut.dayPlans[1].placeIds).equal(["shibuya-crossing", "harajuku-takeshita"]);
    should(sut.dayPlans[2].placeIds).equal(["ueno-zoo"]);
  });

  it("is a pure function — the original trip is not mutated", () => {
    const trip = makeTrip();
    const originalDay1 = [...trip.dayPlans[0].placeIds];

    reorderDay(trip, 1, 0, 2);

    should(trip.dayPlans[0].placeIds).equal(originalDay1);
  });

  it("preserves total place count across the trip", () => {
    const trip = makeTrip();
    const totalBefore = trip.dayPlans.flatMap((d) => d.placeIds).length;

    const sut = reorderDay(trip, 1, 0, 1);

    const totalAfter = sut.dayPlans.flatMap((d) => d.placeIds).length;
    should(totalAfter).be(totalBefore);
  });
});

// ─── movePlaceToDay ────────────────────────────────────────────────────────────

describe("movePlaceToDay", () => {
  it("removes the place from the source day", () => {
    const trip = makeTrip();
    const sut = movePlaceToDay(trip, "sensoji", 1, 2);

    should(sut.dayPlans[0].placeIds).not.contain("sensoji");
  });

  it("appends the place to the end of the target day", () => {
    const trip = makeTrip();
    const sut = movePlaceToDay(trip, "sensoji", 1, 2);

    const targetDay = sut.dayPlans.find((d) => d.day === 2)!;
    const lastId = targetDay.placeIds[targetDay.placeIds.length - 1];
    should(lastId).be("sensoji");
  });

  it("does not create duplicates — place exists exactly once across all days", () => {
    const trip = makeTrip();
    const sut = movePlaceToDay(trip, "meiji-shrine", 1, 2);

    const allIds = sut.dayPlans.flatMap((d) => d.placeIds);
    const occurrences = allIds.filter((id) => id === "meiji-shrine").length;
    should(occurrences).be(1);
  });

  it("preserves total place count across the trip", () => {
    const trip = makeTrip();
    const totalBefore = trip.dayPlans.flatMap((d) => d.placeIds).length;

    const sut = movePlaceToDay(trip, "sensoji", 1, 3);

    const totalAfter = sut.dayPlans.flatMap((d) => d.placeIds).length;
    should(totalAfter).be(totalBefore);
  });

  it("leaves unaffected days untouched", () => {
    const trip = makeTrip();
    const sut = movePlaceToDay(trip, "sensoji", 1, 2);

    // Day 3 had only ueno-zoo and should still only have ueno-zoo
    should(sut.dayPlans[2].placeIds).equal(["ueno-zoo"]);
  });

  it("is a pure function — the original trip is not mutated", () => {
    const trip = makeTrip();
    const originalDay1 = [...trip.dayPlans[0].placeIds];
    const originalDay2 = [...trip.dayPlans[1].placeIds];

    movePlaceToDay(trip, "sensoji", 1, 2);

    should(trip.dayPlans[0].placeIds).equal(originalDay1);
    should(trip.dayPlans[1].placeIds).equal(originalDay2);
  });
});
