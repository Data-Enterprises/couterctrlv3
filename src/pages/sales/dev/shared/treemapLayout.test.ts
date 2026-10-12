import { describe, it, expect } from "vitest";
import { squarify } from "./treemapLayout";

const v = (value: number, key = String(value)) => ({ value, key });

describe("squarify", () => {
  it("fills the box exactly", () => {
    const out = squarify([v(50), v(30), v(20)], 0, 0, 200, 100);
    const area = out.reduce((a, r) => a + r.w * r.h, 0);
    expect(area).toBeCloseTo(200 * 100, 6);
  });

  it("gives each item area in proportion to its value", () => {
    const out = squarify([v(75), v(25)], 0, 0, 100, 100);
    const big = out.find((r) => r.key === "75");
    const small = out.find((r) => r.key === "25");
    expect((big as { w: number; h: number }).w * (big as { h: number }).h).toBeCloseTo(7500, 6);
    expect((small as { w: number; h: number }).w * (small as { h: number }).h).toBeCloseTo(2500, 6);
  });

  it("puts the largest first, whatever order it was given", () => {
    const out = squarify([v(1), v(9), v(5)], 0, 0, 100, 100);
    expect(out.map((r) => r.key)).toEqual(["9", "5", "1"]);
  });

  it("keeps every rectangle inside the box", () => {
    const out = squarify([v(40), v(30), v(20), v(7), v(3)], 10, 20, 300, 180);
    out.forEach((r) => {
      expect(r.x).toBeGreaterThanOrEqual(10 - 1e-6);
      expect(r.y).toBeGreaterThanOrEqual(20 - 1e-6);
      expect(r.x + r.w).toBeLessThanOrEqual(310 + 1e-6);
      expect(r.y + r.h).toBeLessThanOrEqual(200 + 1e-6);
    });
  });

  it("does not overlap", () => {
    const out = squarify([v(40), v(30), v(20), v(10)], 0, 0, 240, 160);
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        const apart =
          a.x + a.w <= b.x + 1e-6 || b.x + b.w <= a.x + 1e-6 ||
          a.y + a.h <= b.y + 1e-6 || b.y + b.h <= a.y + 1e-6;
        expect(apart).toBe(true);
      }
    }
  });

  it("beats slice-and-dice on aspect ratio, which is the whole point", () => {
    // Twenty equal values in a wide box. Sliced, each is a 15x160 sliver;
    // squarified, nothing is more than a few times longer than it is wide.
    const out = squarify(Array.from({ length: 20 }, (_, i) => v(5, `k${i}`)), 0, 0, 300, 160);
    const worst = Math.max(...out.map((r) => Math.max(r.w / r.h, r.h / r.w)));
    expect(worst).toBeLessThan(3);
  });

  it("drops a zero rather than placing a rectangle nobody can see or hit", () => {
    const out = squarify([v(10), v(0)], 0, 0, 100, 100);
    expect(out).toHaveLength(1);
  });

  it("answers emptily for an empty box or an empty list", () => {
    expect(squarify([v(10)], 0, 0, 0, 100)).toEqual([]);
    expect(squarify([], 0, 0, 100, 100)).toEqual([]);
  });

  it("carries the caller's own fields through", () => {
    const out = squarify([{ value: 1, label: "Grocery" }], 0, 0, 10, 10);
    expect(out[0].label).toBe("Grocery");
  });
});
