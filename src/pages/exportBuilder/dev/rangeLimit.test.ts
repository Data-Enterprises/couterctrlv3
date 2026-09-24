import { describe, expect, it } from "vitest";
import { MAX_RANGE_DAYS } from "./hooks";

/**
 * The limit itself is asserted here rather than the message around it: the
 * number is the contract with whoever reads the help page, and a quiet change
 * to it is the kind that surprises someone mid-month.
 */
describe("the longest range the page will search", () => {
  it("is a month and a day, so a calendar month always fits", () => {
    expect(MAX_RANGE_DAYS).toBe(31);
  });
});
