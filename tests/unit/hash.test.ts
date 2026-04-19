import { describe, it } from "vitest";
import { encodeTripToHash, decodeTripFromHash } from "@/lib/hash";
import type { Trip } from "@/lib/types";
import { should } from "../helpers/should";

// ─── Shared fixture ────────────────────────────────────────────────────────────

function makeSampleTrip(): Trip {
  return {
    v: 1,
    city: "tokyo",
    days: 3,
    budget: "$$",
    selectedTags: ["culture", "food"],
    dayPlans: [
      { day: 1, placeIds: ["sensoji", "meiji-shrine"] },
      { day: 2, placeIds: ["shibuya-crossing"] },
      { day: 3, placeIds: [] },
    ],
  };
}

// ─── Encode → decode roundtrip ─────────────────────────────────────────────────

describe("encodeTripToHash / decodeTripFromHash", () => {
  it("roundtrip preserves city", () => {
    const trip = makeSampleTrip();
    const sut = decodeTripFromHash(encodeTripToHash(trip));

    should(sut).exist();
    should(sut!.city).be("tokyo");
  });

  it("roundtrip preserves day count", () => {
    const trip = makeSampleTrip();
    const sut = decodeTripFromHash(encodeTripToHash(trip));

    should(sut!.days).be(3);
    should(sut!.dayPlans).haveLength(3);
  });

  it("roundtrip preserves budget level", () => {
    const trip = makeSampleTrip();
    const sut = decodeTripFromHash(encodeTripToHash(trip));

    should(sut!.budget).be("$$");
  });

  it("roundtrip preserves selected tags", () => {
    const trip = makeSampleTrip();
    const sut = decodeTripFromHash(encodeTripToHash(trip));

    should(sut!.selectedTags).haveLength(2);
    should(sut!.selectedTags).contain("culture");
    should(sut!.selectedTags).contain("food");
  });

  it("roundtrip preserves place IDs in each day", () => {
    const trip = makeSampleTrip();
    const sut = decodeTripFromHash(encodeTripToHash(trip));

    should(sut!.dayPlans[0].placeIds).equal(["sensoji", "meiji-shrine"]);
    should(sut!.dayPlans[1].placeIds).equal(["shibuya-crossing"]);
    should(sut!.dayPlans[2].placeIds).equal([]);
  });

  it("roundtrip works for a trip with no selected tags", () => {
    const trip: Trip = { ...makeSampleTrip(), selectedTags: [] };
    const sut = decodeTripFromHash(encodeTripToHash(trip));

    should(sut!.selectedTags).haveLength(0);
  });

  it("roundtrip works for kyoto city", () => {
    const trip: Trip = { ...makeSampleTrip(), city: "kyoto" };
    const sut = decodeTripFromHash(encodeTripToHash(trip));

    should(sut!.city).be("kyoto");
  });

  // ─── Invalid / malformed hashes ─────────────────────────────────────────────

  it("returns null for an empty hash string", () => {
    const sut = decodeTripFromHash("");

    should(sut).beNull();
  });

  it("returns null for random garbage input", () => {
    const sut = decodeTripFromHash("not-a-valid-hash-at-all!!!!");

    should(sut).beNull();
  });

  it("returns null for valid base64url that decodes to non-JSON", () => {
    // "hello" base64url encoded is "aGVsbG8"
    const sut = decodeTripFromHash("aGVsbG8");

    should(sut).beNull();
  });

  it("returns null for a version mismatch (v: 2)", () => {
    const payload = { v: 2, c: "tokyo", d: 1, b: "$$", t: [], i: [[]] };
    const b64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const sut = decodeTripFromHash(b64);

    should(sut).beNull();
  });

  it("returns null when the city field is an unsupported value", () => {
    const payload = { v: 1, c: "osaka", d: 1, b: "$$", t: [], i: [[]] };
    const b64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const sut = decodeTripFromHash(b64);

    should(sut).beNull();
  });

  it("returns null when the budget field is not a valid tier", () => {
    const payload = { v: 1, c: "tokyo", d: 1, b: "free", t: [], i: [[]] };
    const b64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const sut = decodeTripFromHash(b64);

    should(sut).beNull();
  });

  it("returns null when a tag contains an unrecognised value", () => {
    const payload = { v: 1, c: "tokyo", d: 1, b: "$$", t: ["sightseeing"], i: [[]] };
    const b64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const sut = decodeTripFromHash(b64);

    should(sut).beNull();
  });

  it("returns null when the day count is out of range (0)", () => {
    const payload = { v: 1, c: "tokyo", d: 0, b: "$$", t: [], i: [] };
    const b64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const sut = decodeTripFromHash(b64);

    should(sut).beNull();
  });

  it("returns null when the number of day arrays does not match d", () => {
    // d: 2 but only one inner array
    const payload = { v: 1, c: "tokyo", d: 2, b: "$$", t: [], i: [[]] };
    const b64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const sut = decodeTripFromHash(b64);

    should(sut).beNull();
  });
});
