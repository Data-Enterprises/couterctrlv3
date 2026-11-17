import { describe, expect, it } from "vitest";
import { metricFormat } from "@/pages/sales/dev/utils";

/*
 * Every Sales figure follows the Sales / Qty switch: money to the cent, or
 * whole units.
 */

describe("metricFormat", () => {
  it("draws money to the cent and units whole", () => {
    expect(metricFormat(false)(1234.5)).toBe("$1,234.50");
    expect(metricFormat(true)(1234.5)).toMatch(/^1,23[45]$/);
  });
});
