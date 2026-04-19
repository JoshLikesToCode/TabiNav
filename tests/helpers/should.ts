/**
 * Fluent assertion wrapper.
 *
 * Wraps Vitest's `expect` in a readable API that reads like:
 *   should(sut.days).be(3)
 *   should(sut.dayPlans[0].placeIds).contain("sensoji")
 *   should(sut).not.beNull()
 *
 * Prefer this over raw `expect()` calls in unit tests so intent is the
 * subject of each sentence, not the framework.  Integration tests that
 * use screen queries still use `expect(...).toBeInTheDocument()` directly
 * since jest-dom matchers have no equivalent here.
 */

import { expect } from "vitest";

interface ShouldChain {
  /** Strict reference or primitive equality (toBe). */
  be(expected: unknown): void;
  /** Deep structural equality (toEqual). */
  equal(expected: unknown): void;
  /** Array / string inclusion (toContain). */
  contain(item: unknown): void;
  /** Value is null. */
  beNull(): void;
  /** Value is not null and not undefined. */
  exist(): void;
  /** Numeric comparison. */
  greaterThan(n: number): void;
  lessThanOrEqual(n: number): void;
  /** Array / string length. */
  haveLength(n: number): void;
  /** Boolean shorthand. */
  beTrue(): void;
  beFalse(): void;

  not: {
    beNull(): void;
    exist(): void;
    contain(item: unknown): void;
    equal(expected: unknown): void;
  };
}

export function should(value: unknown): ShouldChain {
  return {
    be:               (expected) => expect(value).toBe(expected),
    equal:            (expected) => expect(value).toEqual(expected),
    contain:          (item)     => expect(value).toContain(item),
    beNull:           ()         => expect(value).toBeNull(),
    exist:            ()         => expect(value).not.toBeNull(),
    greaterThan:      (n)        => expect(value).toBeGreaterThan(n),
    lessThanOrEqual:  (n)        => expect(value).toBeLessThanOrEqual(n),
    haveLength:       (n)        => expect(value).toHaveLength(n),
    beTrue:           ()         => expect(value).toBe(true),
    beFalse:          ()         => expect(value).toBe(false),

    not: {
      beNull:  ()         => expect(value).not.toBeNull(),
      exist:   ()         => expect(value).toBeNull(),
      contain: (item)     => expect(value).not.toContain(item),
      equal:   (expected) => expect(value).not.toEqual(expected),
    },
  };
}
