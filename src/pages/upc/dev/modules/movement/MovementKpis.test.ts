import { describe, expect, it } from "vitest";
import type { MovementRow } from "../../../../../features/dev/devUpcDevSlice";
import { getMovementKpis } from "./MovementKpis";
import { latestVsPrior, movementGrid, movementStores, perStorePerWeek } from "./movementStats";

const WEEKS = ["2026-09-19", "2026-09-26", "2026-10-03", "2026-10-10", "2026-10-17", "2026-10-24"];
const CODE = "28617700000";

/** Garlic Bread at Caila's stores, as on screen on 29 Oct: 137 units, five
 *  stores moving it, weekly totals 26 22 20 15 30 24. */
const caila = (): MovementRow[] => {
  const byStore: Record<number, (number | null)[]> = {
    449: [4, null, null, 4, 6, 6],
    450: [11, 11, 11, 10, 14, 9],
    452: [null, null, null, null, 1, 1],
    453: [4, 5, 6, 1, 7, 4],
    460: [7, 6, 3, null, 2, 4],
  };
  return Object.entries(byStore).flatMap(([id, cells]) =>
    cells.flatMap((qty, i) =>
      qty === null
        ? []
        : [{
            storeid: Number(id), store_number: id, store_name: `Store ${id}`,
            product_code: CODE, description: "GARLIC BREAD HALF 16 OZ",
            week_ending: WEEKS[i], qty, weight: 0,
          }],
    ),
  );
};

const grid = () => {
  const rows = caila();
  // 14 stores searched; nine of them sold none.
  const ids = [20, 21, 442, 445, 447, 449, 450, 452, 453, 460, 461, 463, 464, 465];
  return movementGrid(rows, CODE, movementStores(ids, [], rows), WEEKS);
};

describe("movement statistics", () => {
  it("rates per selling store per week", () => {
    const r = perStorePerWeek(grid());
    expect(r?.stores).toBe(5);
    expect(r?.value).toBeCloseTo(137 / 30, 5); // 4.57
  });

  it("compares the latest week with the weeks before it", () => {
    const t = latestVsPrior(grid());
    expect(t?.latest).toBe(24);
    expect(t?.priorAvg).toBeCloseTo(22.6, 5); // 113 / 5
    expect(t?.pct).toBeCloseTo((24 - 22.6) / 22.6 * 100, 5); // +6.2%
  });

  it("has nothing to compare with one week", () => {
    const rows = caila().filter((r) => r.week_ending === "2026-10-24");
    const g = movementGrid(rows, CODE, movementStores([450], [], rows), ["2026-10-24"]);
    expect(latestVsPrior(g)).toBeNull();
  });
});

describe("getMovementKpis", () => {
  it("describes the one item: weeks, stores, rate, trend", () => {
    const kpis = getMovementKpis(grid(), 6, "2026-10-24");
    expect(kpis.map((k) => k.label)).toEqual([
      "Weeks",
      "Stores moving it",
      "Per store per week",
      "Last week vs average",
    ]);
    expect(kpis[1].value).toBe("5 of 14");
    expect(kpis[2]).toMatchObject({ value: "4.6", sub: "units, at the 5 selling" });
    expect(kpis[3]).toMatchObject({ value: "+6.2%", sub: "24 vs 22.6 avg", variant: "up" });
  });

  it("calls an item new when the weeks before moved nothing", () => {
    const rows = caila().filter((r) => r.week_ending === "2026-10-24");
    const g = movementGrid(rows, CODE, movementStores([450], [], rows), WEEKS);
    expect(getMovementKpis(g, 6, "2026-10-24")[3]).toMatchObject({ value: "New" });
  });
});
