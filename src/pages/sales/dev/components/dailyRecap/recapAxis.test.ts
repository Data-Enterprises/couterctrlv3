import { describe, expect, it } from "vitest";
import { niceTicks } from "./recapAxis";

describe("chart gridlines", () => {
  it("land on round figures just above the tallest bar", () => {
    expect(niceTicks(1469)).toEqual([0, 500, 1000, 1500]);
    expect(niceTicks(410)).toEqual([0, 200, 400, 600]);
    expect(niceTicks(9.5)).toEqual([0, 5, 10]);
  });

  it("have nothing to draw for an empty day", () => {
    expect(niceTicks(0)).toEqual([0]);
  });
});
