import { describe, expect, it } from "vitest";
import type { UpcPriceOpt } from "../../../../../interfaces";
import { computePriceOptRowSummary, formatBestUnits } from "./priceOptStats";
import { getPriceOptKpis } from "./PriceOptKpis";

const point = (price: number, total_qty: number, total_weight = 0, total_revenue = price * total_qty): UpcPriceOpt => ({
  product_code: "1200000131",
  product_description: "MOUNTAIN DEW 20 OZ",
  price,
  total_qty,
  total_revenue,
  total_weight,
});

describe("price points that count", () => {
  // The review's example: $2.99 rang and moved nothing.
  const points = [point(2.99, 0), point(3.49, 40), point(3.99, 30)];
  const best = point(3.49, 40);

  it("leaves out a price that moved nothing", () => {
    const s = computePriceOptRowSummary(best, points, true);
    expect(s.points.map((p) => p.price)).toEqual([3.49, 3.99]);
    // From $3.49 to $3.99. With $2.99 in, the lowest point had 0 units and
    // elasticity came out "—".
    expect(s.elasticity).toBeCloseTo(-1.745, 3);
  });

  it("gives the KPI strip the same points and elasticity as the panel", () => {
    const kpis = getPriceOptKpis(points, [best], [best.product_code], true);
    expect(kpis.find((k) => k.label === "Avg price points")?.value).toBe("2.0");
    expect(kpis.find((k) => k.label === "Avg elasticity")?.value).toBe("-1.7");
  });
});

describe("volume at the best price", () => {
  it("adds up every row at the best price, in pounds for a weighed item", () => {
    // Two rows at $3.99/lb, the best one rung with no weight behind it.
    const rows = [point(3.99, 12, 0, 120), point(3.99, 30, 61.5, 245.39), point(4.49, 20, 40, 179.6)];
    const s = computePriceOptRowSummary(rows[0], rows, true);
    expect(s.weighted).toBe(true);
    expect(s.bestUnits).toBeCloseTo(61.5);
  });

  it("pairs it with the revenue of those same rows", () => {
    // It read $120 (the best row alone) beside 61.50 lb (both rows).
    const rows = [point(3.99, 12, 0, 120), point(3.99, 30, 61.5, 245.39), point(4.49, 20, 40, 179.6)];
    const s = computePriceOptRowSummary(rows[0], rows, true);
    expect(s.bestRevenue).toBeCloseTo(365.39);
  });

  it("shows pounds even at zero, and a bare count otherwise", () => {
    expect(formatBestUnits(0, true)).toBe("0.00 lb");
    expect(formatBestUnits(61.5, true)).toBe("61.50 lb");
    expect(formatBestUnits(40, false)).toBe("40");
  });
});
